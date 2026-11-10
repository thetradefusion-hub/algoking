import slugify from 'slugify';
import mongoose from 'mongoose';
import { Plan, type IPlan } from '../models/Plan.js';
import { InvestmentOrder } from '../models/InvestmentOrder.js';
import { Referral } from '../models/Referral.js';
import { CommissionRule } from '../models/CommissionRule.js';
import { CommissionLedger } from '../models/CommissionLedger.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { generateOrderId } from '../utils/ids.js';
import { applyLedgerEntry, ensureUserWallets } from './walletService.js';

export async function listActivePlans() {
  return Plan.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: -1 }).lean();
}

export async function getPlanById(id: string) {
  const plan = await Plan.findById(id).lean();
  if (!plan || plan.status === 'archived') throw ApiError.notFound('Plan not found');
  return plan;
}

export async function adminListPlans(filter: { status?: string } = {}) {
  const q: Record<string, unknown> = {};
  if (filter.status) q.status = filter.status;
  return Plan.find(q).sort({ sortOrder: 1, createdAt: -1 }).lean();
}

const PLAN_UPDATABLE = [
  'name',
  'description',
  'image',
  'iconEmoji',
  'badgeLabel',
  'isFeatured',
  'isPopular',
  'investmentAmount',
  'durationDays',
  'projectedDailyIncome',
  'projectedTotalIncome',
  'status',
  'purchaseLimit',
  'sortOrder',
  'riskDisclosure',
  'eligibilityRules',
  'slug',
] as const;

function pickPlanFields(data: Partial<IPlan>) {
  const out: Record<string, unknown> = {};
  for (const key of PLAN_UPDATABLE) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

export async function createPlan(data: Partial<IPlan>) {
  const slug =
    data.slug ||
    slugify(data.name || 'plan', { lower: true, strict: true }) + '-' + Date.now().toString(36);
  return Plan.create({
    ...pickPlanFields(data),
    slug,
    riskDisclosure: data.riskDisclosure || '',
    iconEmoji: data.iconEmoji || '📈',
  });
}

export async function updatePlan(id: string, data: Partial<IPlan>) {
  const payload = pickPlanFields(data);
  if (data.name && !data.slug) {
    // keep existing slug unless explicitly changed
  }
  const plan = await Plan.findByIdAndUpdate(id, { $set: payload }, { new: true });
  if (!plan) throw ApiError.notFound('Plan not found');
  return plan;
}

export async function duplicatePlan(id: string) {
  const source = await Plan.findById(id).lean();
  if (!source) throw ApiError.notFound('Plan not found');
  return createPlan({
    name: `${source.name} (Copy)`,
    description: source.description,
    image: source.image,
    iconEmoji: source.iconEmoji,
    badgeLabel: source.badgeLabel,
    isFeatured: false,
    isPopular: !!source.isPopular,
    investmentAmount: source.investmentAmount,
    durationDays: source.durationDays,
    projectedDailyIncome: source.projectedDailyIncome,
    projectedTotalIncome: source.projectedTotalIncome,
    status: 'inactive',
    purchaseLimit: source.purchaseLimit,
    sortOrder: source.sortOrder,
    riskDisclosure: source.riskDisclosure,
  });
}

export async function archivePlan(id: string) {
  const orderCount = await InvestmentOrder.countDocuments({ planId: id });
  if (orderCount > 0) {
    const plan = await Plan.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
    if (!plan) throw ApiError.notFound('Plan not found');
    return { plan, archived: true };
  }
  await Plan.findByIdAndDelete(id);
  return { plan: null, archived: false, deleted: true };
}

/**
 * Purchase plan using Main Wallet.
 * Uses MongoDB transaction for debit + order + optional referral commissions.
 */
export async function purchasePlan(userId: string, planId: string, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await InvestmentOrder.findOne({ idempotencyKey });
    if (existing) return { order: existing, duplicated: true };
  }

  const plan = await Plan.findById(planId);
  if (!plan || plan.status !== 'active') throw ApiError.badRequest('Plan is not available');

  if (plan.purchaseLimit > 0) {
    const count = await InvestmentOrder.countDocuments({
      userId,
      planId,
      status: { $in: ['active', 'completed'] },
    });
    if (count >= plan.purchaseLimit) throw ApiError.badRequest('Purchase limit reached for this plan');
  }

  await ensureUserWallets(userId);

  const session = await mongoose.startSession();
  try {
    let orderDoc;
    await session.withTransaction(async () => {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const ledger = await applyLedgerEntry({
        userId,
        walletType: 'main',
        type: 'debit',
        amount: plan.investmentAmount,
        description: `Investment purchase: ${plan.name}`,
        referenceType: 'investment_order',
        idempotencyKey: idempotencyKey ? `purchase-${idempotencyKey}` : undefined,
        session,
      });

      const [order] = await InvestmentOrder.create(
        [
          {
            orderId: generateOrderId(),
            userId,
            planId: plan._id,
            planSnapshot: {
              name: plan.name,
              investmentAmount: plan.investmentAmount,
              durationDays: plan.durationDays,
              projectedDailyIncome: plan.projectedDailyIncome,
              projectedTotalIncome: plan.projectedTotalIncome,
            },
            amount: plan.investmentAmount,
            durationDays: plan.durationDays,
            projectedIncomeSnapshot: plan.projectedTotalIncome,
            status: 'active',
            startDate,
            endDate,
            walletTransactionId: ledger.transaction?.transactionId,
            idempotencyKey,
          },
        ],
        { session }
      );
      orderDoc = order;

      // Referral commissions on investment purchase (configurable rules)
      await distributeInvestmentCommissions({
        buyerId: userId,
        amount: plan.investmentAmount,
        sourceTransactionId: ledger.transaction!.transactionId,
        session,
      });

      await Notification.create(
        [
          {
            userId,
            title: 'Investment Purchased',
            message: `You invested in ${plan.name}. Projected income is non-guaranteed and demo-labeled until compliance review.`,
            type: 'investment_purchased',
            meta: { orderId: order!.orderId },
          },
        ],
        { session }
      );
    });

    return { order: orderDoc, duplicated: false };
  } finally {
    session.endSession();
  }
}

async function distributeInvestmentCommissions(opts: {
  buyerId: string;
  amount: number;
  sourceTransactionId: string;
  session: mongoose.ClientSession;
}) {
  const rules = await CommissionRule.find({
    status: 'active',
    eligibleEvent: 'investment_purchase',
    effectiveFrom: { $lte: new Date() },
    $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gt: new Date() } }],
  })
    .sort({ level: 1, version: -1 })
    .session(opts.session);

  // Keep latest version per level
  const byLevel = new Map<number, (typeof rules)[0]>();
  for (const rule of rules) {
    if (!byLevel.has(rule.level)) byLevel.set(rule.level, rule);
  }

  const uplines = await Referral.find({ userId: opts.buyerId }).session(opts.session);

  for (const link of uplines) {
    const rule = byLevel.get(link.level);
    if (!rule) continue;
    if (opts.amount < rule.minimumQualifyingAmount) continue;

    const commissionAmount = Number(((opts.amount * rule.percentage) / 100).toFixed(2));
    if (commissionAmount <= 0) continue;

    // Unique index prevents duplicate commission for same source+level
    try {
      const ledgerCredit = await applyLedgerEntry({
        userId: link.sponsorId.toString(),
        walletType: 'referral',
        type: 'credit',
        amount: commissionAmount,
        description: `Level ${link.level} referral commission (simulated/demo)`,
        referenceType: 'commission',
        referenceId: opts.sourceTransactionId,
        idempotencyKey: `comm-${opts.sourceTransactionId}-L${link.level}`,
        session: opts.session,
      });

      await CommissionLedger.create(
        [
          {
            userId: link.sponsorId,
            sourceUserId: opts.buyerId,
            sourceTransactionId: opts.sourceTransactionId,
            level: link.level,
            percentageSnapshot: rule.percentage,
            ruleVersion: rule.version,
            commissionAmount,
            qualifyingAmount: opts.amount,
            status: 'paid',
            walletTransactionId: ledgerCredit.transaction?.transactionId,
          },
        ],
        { session: opts.session }
      );

      await Notification.create(
        [
          {
            userId: link.sponsorId,
            title: 'Referral Commission',
            message: `You received a Level ${link.level} commission of ₹${commissionAmount} (demo/simulated).`,
            type: 'referral_commission',
          },
        ],
        { session: opts.session }
      );
    } catch (err) {
      // Duplicate commission — skip
      if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
        continue;
      }
      throw err;
    }
  }
}

export async function listUserOrders(
  userId: string,
  opts: { skip: number; limit: number; status?: string }
) {
  const filter: Record<string, unknown> = { userId };
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    InvestmentOrder.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    InvestmentOrder.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getUserOrder(userId: string, orderId: string) {
  const order = await InvestmentOrder.findOne({
    $or: [{ _id: orderId }, { orderId }],
    userId,
  }).lean();
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}
