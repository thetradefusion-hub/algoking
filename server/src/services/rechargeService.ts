import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { RechargeRequest } from '../models/RechargeRequest.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { applyLedgerEntry, ensureUserWallets } from './walletService.js';
import { getWalletLimits } from './settingsService.js';

/** Adapter-based payment gateway (manual/UPI flow by default until Razorpay is wired). */
export async function createPaymentOrder(amount: number, userId: string) {
  const provider = env.PAYMENT_GATEWAY;
  const providerOrderId = `order_${randomUUID()}`;

  if (provider === 'razorpay' && env.RAZORPAY_KEY_ID) {
    // Placeholder: real Razorpay order creation would go here with server-side keys only.
    throw ApiError.badRequest('Razorpay checkout is not configured yet. Use UPI/USDT deposit with admin approval.');
  }

  return {
    provider,
    providerOrderId,
    amount,
    currency: 'INR',
    checkoutToken: providerOrderId,
    keyId: env.RAZORPAY_KEY_ID || undefined,
    userId,
  };
}

export async function initiateRecharge(userId: string, amount: number, idempotencyKey?: string) {
  const limits = await getWalletLimits();
  if (amount < limits.minRecharge) throw ApiError.badRequest(`Minimum deposit is ₹${limits.minRecharge}`);
  if (amount > limits.maxRecharge) throw ApiError.badRequest(`Maximum deposit is ₹${limits.maxRecharge}`);

  if (idempotencyKey) {
    const existing = await RechargeRequest.findOne({ idempotencyKey });
    if (existing) {
      const payment = await PaymentTransaction.findOne({ rechargeRequestId: existing._id });
      return { recharge: existing, payment, duplicated: true };
    }
  }

  await ensureUserWallets(userId);
  const gateway = await createPaymentOrder(amount, userId);

  const recharge = await RechargeRequest.create({
    userId,
    amount,
    paymentMethod: gateway.provider,
    gatewayOrderId: gateway.providerOrderId,
    status: 'awaiting_payment',
    idempotencyKey,
  });

  const payment = await PaymentTransaction.create({
    userId,
    provider: gateway.provider,
    providerOrderId: gateway.providerOrderId,
    amount,
    currency: 'INR',
    status: 'created',
    rechargeRequestId: recharge._id,
  });

  return { recharge, payment, gateway, duplicated: false };
}

/**
 * Credit wallet only after verified payment.
 * Never trust frontend "payment success" alone.
 */
export async function confirmRechargePayment(opts: {
  providerOrderId: string;
  providerPaymentId?: string;
  signatureValid: boolean;
  rawReference?: Record<string, unknown>;
  approvedBy?: string;
  isManual?: boolean;
}) {
  if (!opts.signatureValid) throw ApiError.badRequest('Payment verification failed');

  const payment = await PaymentTransaction.findOne({ providerOrderId: opts.providerOrderId });
  if (!payment) throw ApiError.notFound('Payment order not found');
  if (payment.status === 'paid') {
    const recharge = await RechargeRequest.findById(payment.rechargeRequestId);
    return { payment, recharge, duplicated: true };
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const recharge = await RechargeRequest.findById(payment.rechargeRequestId).session(session);
      if (!recharge) throw ApiError.notFound('Recharge request not found');
      if (recharge.status === 'completed') {
        result = { payment, recharge, duplicated: true };
        return;
      }

      payment.status = 'paid';
      payment.providerPaymentId = opts.providerPaymentId || `pay_${randomUUID()}`;
      payment.verifiedAt = new Date();
      payment.rawReference = opts.rawReference;
      await payment.save({ session });

      recharge.status = 'completed';
      recharge.gatewayPaymentId = payment.providerPaymentId;
      recharge.verificationReference = payment.providerPaymentId;
      recharge.isManual = !!opts.isManual;
      if (opts.approvedBy) recharge.approvedBy = new mongoose.Types.ObjectId(opts.approvedBy);
      await recharge.save({ session });

      // amount is stored in INR (USDT deposits converted at submit using admin rate)
      await applyLedgerEntry({
        userId: recharge.userId.toString(),
        walletType: 'main',
        type: 'credit',
        amount: recharge.amount,
        description: 'Wallet deposit',
        referenceType: 'recharge',
        referenceId: recharge._id.toString(),
        idempotencyKey: `recharge-credit-${recharge._id.toString()}`,
        session,
      });

      const snap = (recharge.depositSnapshot || {}) as Record<string, unknown>;
      const originalUsdt =
        String(recharge.currency || '').toUpperCase() === 'USDT' && snap.originalAmount
          ? ` (${snap.originalAmount} USDT)`
          : '';

      await Notification.create(
        [
          {
            userId: recharge.userId,
            title: 'Deposit Successful',
            message: `Rs. ${recharge.amount}${originalUsdt} credited to Main Wallet.`,
            type: 'recharge_successful',
          },
        ],
        { session }
      );

      result = { payment, recharge, duplicated: false };
    });
    return result!;
  } finally {
    session.endSession();
  }
}

/** Local/dev self-confirm for gateway adapter when Razorpay is not connected. */
export async function verifyDemoPayment(userId: string, providerOrderId: string) {
  if (env.NODE_ENV === 'production' && env.PAYMENT_GATEWAY !== 'demo') {
    throw ApiError.forbidden('Self-verify is not available');
  }
  const payment = await PaymentTransaction.findOne({ providerOrderId, userId });
  if (!payment) throw ApiError.notFound('Payment not found');
  return confirmRechargePayment({
    providerOrderId,
    signatureValid: true,
    providerPaymentId: `pay_${randomUUID()}`,
    rawReference: { mode: 'adapter', verifiedBy: 'checkout_adapter' },
  });
}

export async function listUserRecharges(userId: string, opts: { skip: number; limit: number }) {
  const filter = { userId };
  const [items, total] = await Promise.all([
    RechargeRequest.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    RechargeRequest.countDocuments(filter),
  ]);
  return { items, total };
}

export async function adminListRecharges(opts: {
  skip: number;
  limit: number;
  status?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    RechargeRequest.find(filter)
      .populate('userId', 'fullName email mobile')
      .populate('paymentMethodId', 'name code iconUrl network currency')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    RechargeRequest.countDocuments(filter),
  ]);
  return { items, total };
}

export async function submitManualDeposit(
  userId: string,
  input: {
    amount: number;
    paymentMethodId: string;
    proofReference: string;
    userNote?: string;
    idempotencyKey?: string;
  }
) {
  const { getMethodById } = await import('./paymentMethodService.js');
  const { getCurrencySettings, usdtToInr } = await import('./settingsService.js');
  const method = await getMethodById(input.paymentMethodId);
  if (!method.depositEnabled) throw ApiError.badRequest('Deposit method disabled');

  const originalAmount = Number(input.amount);
  if (originalAmount < method.minDeposit) {
    throw ApiError.badRequest(`Minimum deposit is ${method.minDeposit}`);
  }
  if (originalAmount > method.maxDeposit) {
    throw ApiError.badRequest(`Maximum deposit is ${method.maxDeposit}`);
  }
  if (!input.proofReference?.trim()) throw ApiError.badRequest('Payment proof / Tx Hash / UTR required');

  if (input.idempotencyKey) {
    const existing = await RechargeRequest.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) return { recharge: existing, duplicated: true };
  }

  const { usdtInrRate } = await getCurrencySettings();
  const isUsdt = String(method.currency || '').toUpperCase() === 'USDT';
  // Ledger is always INR; convert USDT deposits using admin rate
  const amountInr = isUsdt ? usdtToInr(originalAmount, usdtInrRate) : originalAmount;

  await ensureUserWallets(userId);
  const orderId = `manual_${randomUUID()}`;

  const recharge = await RechargeRequest.create({
    userId,
    amount: amountInr,
    paymentMethod: method.code,
    paymentMethodId: method._id,
    methodCode: method.code,
    network: method.network,
    currency: method.currency,
    proofReference: input.proofReference.trim(),
    userNote: input.userNote?.trim(),
    depositSnapshot: {
      name: method.name,
      code: method.code,
      network: method.network,
      currency: method.currency,
      depositAddress: method.depositAddress,
      upiId: method.upiId,
      qrCodeUrl: method.qrCodeUrl,
      bankDetails: method.bankDetails,
      iconUrl: method.iconUrl,
      originalAmount,
      originalCurrency: method.currency,
      usdtInrRate: isUsdt ? usdtInrRate : undefined,
      amountInr,
    },
    gatewayOrderId: orderId,
    status: 'pending',
    isManual: true,
    idempotencyKey: input.idempotencyKey,
  });

  await PaymentTransaction.create({
    userId,
    provider: 'manual',
    providerOrderId: orderId,
    amount: amountInr,
    currency: 'INR',
    status: 'created',
    rechargeRequestId: recharge._id,
  });

  await Notification.create({
    userId,
    title: 'Deposit Submitted',
    message: isUsdt
      ? `Deposit of ${originalAmount} USDT (≈ ₹${amountInr}) via ${method.name} is pending admin approval.`
      : `Deposit of ₹${amountInr} via ${method.name} is pending admin approval.`,
    type: 'recharge_pending',
  });

  return { recharge, duplicated: false };
}

export async function adminApproveRecharge(id: string, adminId: string, reason?: string) {
  const recharge = await RechargeRequest.findById(id);
  if (!recharge) throw ApiError.notFound('Recharge not found');
  if (recharge.status === 'completed') return { recharge, duplicated: true };
  if (recharge.status === 'rejected') throw ApiError.badRequest('Cannot approve rejected recharge');
  if (!recharge.gatewayOrderId) throw ApiError.badRequest('Missing payment reference');

  return confirmRechargePayment({
    providerOrderId: recharge.gatewayOrderId,
    signatureValid: true,
    providerPaymentId: recharge.proofReference || `manual_pay_${randomUUID()}`,
    rawReference: { mode: 'manual_admin', reason, approvedBy: adminId },
    approvedBy: adminId,
    isManual: true,
  });
}

export async function adminRejectRecharge(id: string, adminId: string, reason: string) {
  const recharge = await RechargeRequest.findById(id);
  if (!recharge) throw ApiError.notFound('Recharge not found');
  if (recharge.status === 'completed') throw ApiError.badRequest('Cannot reject completed recharge');
  recharge.status = 'rejected';
  recharge.rejectionReason = reason;
  recharge.approvedBy = new mongoose.Types.ObjectId(adminId);
  await recharge.save();

  if (recharge.gatewayOrderId) {
    await PaymentTransaction.updateOne(
      { providerOrderId: recharge.gatewayOrderId },
      { $set: { status: 'failed' } }
    );
  }

  await Notification.create({
    userId: recharge.userId,
    title: 'Deposit Rejected',
    message: reason || 'Your deposit request was rejected by admin.',
    type: 'recharge_rejected',
  });

  return recharge;
}
