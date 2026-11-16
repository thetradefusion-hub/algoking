import { InvestmentOrder, type IInvestmentOrder } from '../models/InvestmentOrder.js';
import { Notification } from '../models/Notification.js';
import { applyLedgerEntry, ensureUserWallets } from './walletService.js';
import { logger } from '../utils/logger.js';

const MS_PER_HOUR = 60 * 60 * 1000;

export function getOrderTotalIncome(order: {
  projectedIncomeSnapshot?: number;
  planSnapshot?: { projectedTotalIncome?: number };
}) {
  return Number(order.projectedIncomeSnapshot || order.planSnapshot?.projectedTotalIncome || 0);
}

export function getOrderTotalHours(order: { durationDays?: number; planSnapshot?: { durationDays?: number } }) {
  const days = Math.max(1, Number(order.durationDays || order.planSnapshot?.durationDays || 1));
  return days * 24;
}

/** Exact cumulative income that should be paid after `hours` completed hours. */
export function cumulativeIncomeForHours(totalIncome: number, totalHours: number, hours: number) {
  if (totalIncome <= 0 || totalHours <= 0 || hours <= 0) return 0;
  if (hours >= totalHours) return Number(totalIncome.toFixed(2));
  return Number(((totalIncome * hours) / totalHours).toFixed(2));
}

export function completedHoursElapsed(order: {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  durationDays?: number;
}, now = new Date()) {
  if (!order.startDate) return 0;
  const start = new Date(order.startDate).getTime();
  const totalHours = getOrderTotalHours(order);
  const endFromDuration = start + totalHours * MS_PER_HOUR;
  const end = order.endDate ? new Date(order.endDate).getTime() : endFromDuration;
  const cappedNow = Math.min(now.getTime(), end);
  if (cappedNow <= start) return 0;
  return Math.min(totalHours, Math.floor((cappedNow - start) / MS_PER_HOUR));
}

export function enrichOrderIncome(order: Record<string, unknown>, now = new Date()) {
  const totalIncome = getOrderTotalIncome(order as never);
  const totalHours = getOrderTotalHours(order as never);
  const paidHours = Number(order.paidHours || 0);
  const totalIncomePaid = Number(order.totalIncomePaid || 0);
  const start = order.startDate ? new Date(order.startDate as string).getTime() : now.getTime();
  const end =
    order.endDate
      ? new Date(order.endDate as string).getTime()
      : start + totalHours * MS_PER_HOUR;
  const elapsedMs = Math.min(Math.max(now.getTime() - start, 0), Math.max(end - start, 0));
  const progressPct =
    end > start ? Math.min(100, Math.max(0, Number(((elapsedMs / (end - start)) * 100).toFixed(2)))) : 0;
  const liveEarned =
    end > start
      ? Number(Math.min(totalIncome, (elapsedMs / (end - start)) * totalIncome).toFixed(4))
      : totalIncomePaid;
  const hourlyIncome = totalHours > 0 ? Number((totalIncome / totalHours).toFixed(6)) : 0;
  const hoursDone = completedHoursElapsed(order as never, now);
  const nextHourAt =
    order.status === 'active' && hoursDone < totalHours && order.startDate
      ? new Date(start + (hoursDone + 1) * MS_PER_HOUR).toISOString()
      : null;

  return {
    ...order,
    totalIncome,
    totalHours,
    paidHours,
    totalIncomePaid,
    hourlyIncome,
    progressPct,
    liveEarned,
    hoursCompleted: hoursDone,
    nextHourAt,
  };
}

async function settleOrderIncome(order: IInvestmentOrder, now = new Date()) {
  const totalIncome = getOrderTotalIncome(order);
  const totalHours = getOrderTotalHours(order);
  if (totalIncome <= 0 || totalHours <= 0 || !order.startDate) {
    if (order.endDate && now >= new Date(order.endDate) && order.status === 'active') {
      order.status = 'completed';
      await order.save();
    }
    return { credited: 0, hours: 0 };
  }

  const targetHours = completedHoursElapsed(order, now);
  const paidHours = Number(order.paidHours || 0);
  if (targetHours <= paidHours) {
    if (targetHours >= totalHours && order.status === 'active') {
      // Ensure final rounding settled
      const finalDue = Number((totalIncome - Number(order.totalIncomePaid || 0)).toFixed(2));
      if (finalDue > 0) {
        await creditRoi(order, finalDue, paidHours, totalHours);
      }
      order.status = 'completed';
      order.paidHours = totalHours;
      order.totalIncomePaid = totalIncome;
      order.lastPayoutAt = now;
      await order.save();
      return { credited: Math.max(0, finalDue), hours: 0 };
    }
    return { credited: 0, hours: 0 };
  }

  const dueAmount = Number(
    (
      cumulativeIncomeForHours(totalIncome, totalHours, targetHours) - Number(order.totalIncomePaid || 0)
    ).toFixed(2)
  );

  if (dueAmount > 0) {
    await creditRoi(order, dueAmount, paidHours + 1, targetHours);
  }

  order.paidHours = targetHours;
  order.totalIncomePaid = cumulativeIncomeForHours(totalIncome, totalHours, targetHours);
  order.lastPayoutAt = now;
  if (targetHours >= totalHours) {
    order.status = 'completed';
    order.totalIncomePaid = totalIncome;
  }
  await order.save();

  return { credited: Math.max(0, dueAmount), hours: targetHours - paidHours };
}

async function creditRoi(
  order: IInvestmentOrder,
  amount: number,
  fromHour: number,
  toHour: number
) {
  if (amount <= 0) return;
  const userId = order.userId.toString();
  await ensureUserWallets(userId);

  const planName = order.planSnapshot?.name || 'plan';
  const hoursLabel = fromHour === toHour ? `hour ${toHour}` : `hours ${fromHour}-${toHour}`;

  const ledger = await applyLedgerEntry({
    userId,
    walletType: 'income',
    type: 'credit',
    amount,
    description: `ROI income · ${planName} · ${hoursLabel}`,
    referenceType: 'investment_roi',
    referenceId: order._id.toString(),
    idempotencyKey: `roi-${order._id.toString()}-h${fromHour}-${toHour}`,
    metadata: {
      orderId: order.orderId,
      fromHour,
      toHour,
      planName,
    },
  });

  if (!ledger.duplicated) {
    await Notification.create({
      userId: order.userId,
      title: 'ROI Income Credited',
      message: `Rs. ${amount.toFixed(2)} added to Income Wallet from ${planName}.`,
      type: 'roi_income',
      meta: { orderId: order.orderId, amount },
    });
  }
}

export async function processOrderIncomeById(orderId: string) {
  const order = await InvestmentOrder.findById(orderId);
  if (!order || order.status !== 'active') return null;
  return settleOrderIncome(order);
}

export async function runIncomePayoutJob() {
  const now = new Date();
  const orders = await InvestmentOrder.find({ status: 'active' }).limit(500);
  let creditedOrders = 0;
  let totalCredited = 0;
  let hoursPaid = 0;

  for (const order of orders) {
    try {
      const result = await settleOrderIncome(order, now);
      if (result.credited > 0 || result.hours > 0) {
        creditedOrders += 1;
        totalCredited += result.credited;
        hoursPaid += result.hours;
      }
    } catch (err) {
      logger.error({ err, orderId: order.orderId }, 'ROI payout failed for order');
    }
  }

  if (creditedOrders > 0) {
    logger.info(
      { creditedOrders, totalCredited: Number(totalCredited.toFixed(2)), hoursPaid },
      'ROI hourly payout job completed'
    );
  }

  return { creditedOrders, totalCredited, hoursPaid };
}

let payoutTimer: NodeJS.Timeout | null = null;

export function startIncomePayoutScheduler(intervalMs = 60_000) {
  if (payoutTimer) return;
  // Kick once on boot (catch up missed hours), then every minute
  void runIncomePayoutJob().catch((err) => logger.error({ err }, 'Initial ROI payout failed'));
  payoutTimer = setInterval(() => {
    void runIncomePayoutJob().catch((err) => logger.error({ err }, 'ROI payout job failed'));
  }, intervalMs);
  // Avoid keeping process alive solely because of the timer in some environments
  if (typeof payoutTimer.unref === 'function') payoutTimer.unref();
  logger.info({ intervalMs }, 'ROI hourly income scheduler started');
}
