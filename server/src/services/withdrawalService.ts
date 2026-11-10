import mongoose from 'mongoose';
import { WithdrawalRequest } from '../models/WithdrawalRequest.js';
import { BankAccount } from '../models/BankAccount.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { applyLedgerEntry, ensureUserWallets } from './walletService.js';
import { getWalletLimits } from './settingsService.js';
import { isDemoMode } from '../config/env.js';

const WITHDRAW_WALLETS = ['main', 'income', 'referral'] as const;
type WithdrawWallet = (typeof WITHDRAW_WALLETS)[number];

export async function requestWithdrawal(
  userId: string,
  amount: number,
  opts: {
    walletType?: string;
    bankAccountId?: string;
    paymentMethodId?: string;
    destinationAddress?: string;
    destinationUpi?: string;
    idempotencyKey?: string;
  }
) {
  const limits = await getWalletLimits();
  const amountNum = Number(amount);
  const walletType = (opts.walletType || 'income') as WithdrawWallet;
  if (!WITHDRAW_WALLETS.includes(walletType)) {
    throw ApiError.badRequest('Invalid wallet. Choose main, income, or referral.');
  }

  if (opts.idempotencyKey) {
    const existing = await WithdrawalRequest.findOne({ idempotencyKey: opts.idempotencyKey });
    if (existing) return { withdrawal: existing, duplicated: true };
  }

  let method = null as Awaited<ReturnType<typeof import('./paymentMethodService.js').getMethodById>> | null;
  let bank = null as InstanceType<typeof BankAccount> | null;
  let fee = Number(limits.withdrawalFee) || 0;
  let minW = limits.minWithdrawal;
  let maxW = limits.maxWithdrawal;
  let methodCode = 'inr_bank';
  let network: string | undefined;
  let currency = 'INR';
  let destinationBankSnapshot: Record<string, unknown> | undefined;

  const { getCurrencySettings, inrToUsdt } = await import('./settingsService.js');
  const { usdtInrRate } = await getCurrencySettings();

  if (opts.paymentMethodId) {
    const { getMethodById } = await import('./paymentMethodService.js');
    method = await getMethodById(opts.paymentMethodId);
    if (!method.withdrawEnabled) throw ApiError.badRequest('Withdrawal method disabled');
    fee = Number(method.withdrawFee || 0);
    minW = method.minWithdraw;
    maxW = method.maxWithdraw;
    methodCode = method.code;
    network = method.network;
    currency = method.currency;

    if (method.code === 'bep20' || method.code === 'trc20') {
      if (!opts.destinationAddress?.trim()) throw ApiError.badRequest('Wallet address required');
    }
    if (method.code === 'inr_upi') {
      if (!opts.destinationUpi?.trim()) throw ApiError.badRequest('UPI ID required');
    }
    if (method.code === 'inr_bank') {
      if (!opts.bankAccountId) throw ApiError.badRequest('Bank account required');
      bank = await BankAccount.findOne({ _id: opts.bankAccountId, userId });
      if (!bank) throw ApiError.badRequest('Bank account not found');
      destinationBankSnapshot = {
        bankName: bank.bankName,
        accountHolderName: bank.accountHolderName,
        accountNumberLast4: bank.accountNumberLast4,
        ifscCode: bank.ifscCode,
      };
    }
  } else {
    if (!opts.bankAccountId) throw ApiError.badRequest('Bank account required');
    bank = await BankAccount.findOne({ _id: opts.bankAccountId, userId });
    if (!bank) throw ApiError.badRequest('Bank account not found');
    destinationBankSnapshot = {
      bankName: bank.bankName,
      accountHolderName: bank.accountHolderName,
      accountNumberLast4: bank.accountNumberLast4,
      ifscCode: bank.ifscCode,
    };
  }

  // Wallet ledger is INR. For USDT methods, amount is still INR debit; payout USDT = net/rate.
  const isUsdtMethod = String(currency || '').toUpperCase() === 'USDT';
  if (amountNum < minW) throw ApiError.badRequest(`Minimum withdrawal is ${minW}`);
  if (amountNum > maxW) throw ApiError.badRequest(`Maximum withdrawal is ${maxW}`);
  if (fee >= amountNum) throw ApiError.badRequest('Amount must be greater than fee');
  const netAmount = Number((amountNum - fee).toFixed(2));
  const payoutUsdt = isUsdtMethod ? inrToUsdt(netAmount, usdtInrRate) : undefined;

  await ensureUserWallets(userId);

  const session = await mongoose.startSession();
  try {
    let withdrawal;
    await session.withTransaction(async () => {
      const ledger = await applyLedgerEntry({
        userId,
        walletType,
        type: 'debit',
        amount: amountNum,
        description: `Withdrawal reserve (${walletType} wallet)`,
        referenceType: 'withdrawal',
        idempotencyKey: opts.idempotencyKey ? `wd-reserve-${opts.idempotencyKey}` : undefined,
        session,
      });

      const [doc] = await WithdrawalRequest.create(
        [
          {
            userId,
            walletType,
            amount: amountNum,
            fee,
            netAmount,
            bankAccountId: bank?._id,
            paymentMethodId: method?._id,
            methodCode,
            network,
            currency,
            destinationAddress: opts.destinationAddress?.trim(),
            destinationUpi: opts.destinationUpi?.trim(),
            destinationBankSnapshot: isUsdtMethod
              ? {
                  ...(destinationBankSnapshot || {}),
                  payoutUsdt,
                  usdtInrRate,
                  amountInr: amountNum,
                }
              : destinationBankSnapshot,
            status: 'pending',
            reserveTransactionId: ledger.transaction?.transactionId,
            idempotencyKey: opts.idempotencyKey,
          },
        ],
        { session }
      );
      withdrawal = doc;

      await Notification.create(
        [
          {
            userId,
            title: 'Withdrawal Requested',
            message: isUsdtMethod
              ? `Withdrawal of ₹${amountNum} from ${walletType} wallet (≈ ${payoutUsdt} USDT) submitted for admin approval${isDemoMode() ? ' (demo)' : ''}.`
              : `Withdrawal of ₹${amountNum} from ${walletType} wallet submitted for admin approval${isDemoMode() ? ' (demo)' : ''}.`,
            type: 'withdrawal_requested',
          },
        ],
        { session }
      );
    });
    return { withdrawal, duplicated: false };
  } finally {
    session.endSession();
  }
}

export async function listUserWithdrawals(userId: string, opts: { skip: number; limit: number }) {
  const filter = { userId };
  const [items, total] = await Promise.all([
    WithdrawalRequest.find(filter)
      .populate('bankAccountId', 'accountHolderName accountNumberLast4 ifscCode bankName isPrimary')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    WithdrawalRequest.countDocuments(filter),
  ]);
  return { items, total };
}

export async function adminListWithdrawals(opts: { skip: number; limit: number; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    WithdrawalRequest.find(filter)
      .populate('userId', 'fullName email mobile')
      .populate('bankAccountId', 'accountHolderName accountNumberLast4 ifscCode bankName')
      .populate('paymentMethodId', 'name code iconUrl network currency')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    WithdrawalRequest.countDocuments(filter),
  ]);
  return { items, total };
}

export async function approveWithdrawal(id: string, adminId: string) {
  const wd = await WithdrawalRequest.findById(id);
  if (!wd) throw ApiError.notFound('Withdrawal not found');
  if (wd.status !== 'pending') throw ApiError.badRequest('Only pending withdrawals can be approved');
  wd.status = 'approved';
  wd.reviewedBy = new mongoose.Types.ObjectId(adminId);
  await wd.save();
  await Notification.create({
    userId: wd.userId,
    title: 'Withdrawal Approved',
    message: `Your withdrawal of ₹${wd.amount} was approved${isDemoMode() ? ' (demo)' : ''}.`,
    type: 'withdrawal_approved',
  });
  return wd;
}

export async function rejectWithdrawal(id: string, adminId: string, reason: string) {
  const wd = await WithdrawalRequest.findById(id);
  if (!wd) throw ApiError.notFound('Withdrawal not found');
  if (!['pending', 'approved', 'processing'].includes(wd.status)) {
    throw ApiError.badRequest('Withdrawal cannot be rejected in current status');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const releaseWallet = (wd.walletType || 'income') as WithdrawWallet;
      // Release reserved amount back to the same source wallet
      await applyLedgerEntry({
        userId: wd.userId.toString(),
        walletType: releaseWallet,
        type: 'credit',
        amount: wd.amount,
        description: `Withdrawal rejected — funds released to ${releaseWallet} wallet`,
        referenceType: 'withdrawal_release',
        referenceId: wd._id.toString(),
        idempotencyKey: `wd-release-${wd._id.toString()}`,
        session,
      });

      wd.status = 'rejected';
      wd.rejectionReason = reason;
      wd.reviewedBy = new mongoose.Types.ObjectId(adminId);
      await wd.save({ session });

      await Notification.create(
        [
          {
            userId: wd.userId,
            title: 'Withdrawal Rejected',
            message: `Withdrawal rejected: ${reason}`,
            type: 'withdrawal_rejected',
          },
        ],
        { session }
      );
    });
    return wd;
  } finally {
    session.endSession();
  }
}

export async function markWithdrawalPaid(id: string, adminId: string, payoutReference: string) {
  if (!isDemoMode()) {
    // LIVE payouts must not execute until compliance — still allow status record only if explicitly needed later
    throw ApiError.badRequest('LIVE payouts are disabled until compliance review. Stay in DEMO mode.');
  }
  const wd = await WithdrawalRequest.findById(id);
  if (!wd) throw ApiError.notFound('Withdrawal not found');
  if (!['approved', 'processing'].includes(wd.status)) {
    throw ApiError.badRequest('Withdrawal must be approved/processing before mark paid');
  }
  wd.status = 'completed';
  wd.payoutReference = payoutReference || `DEMO-PAYOUT-${Date.now()}`;
  wd.reviewedBy = new mongoose.Types.ObjectId(adminId);
  wd.internalNote = (wd.internalNote || '') + ' | DEMO payout recorded (no real bank transfer)';
  await wd.save();
  await Notification.create({
    userId: wd.userId,
    title: 'Withdrawal Completed',
    message: `Withdrawal marked paid (demo). Ref: ${wd.payoutReference}`,
    type: 'withdrawal_approved',
  });
  return wd;
}

export async function markProcessing(id: string, adminId: string) {
  const wd = await WithdrawalRequest.findById(id);
  if (!wd) throw ApiError.notFound('Withdrawal not found');
  if (wd.status !== 'approved') throw ApiError.badRequest('Only approved withdrawals can move to processing');
  wd.status = 'processing';
  wd.reviewedBy = new mongoose.Types.ObjectId(adminId);
  await wd.save();
  return wd;
}
