import mongoose, { type ClientSession, type Types } from 'mongoose';
import { Wallet, type WalletType } from '../models/Wallet.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { ApiError } from '../utils/apiError.js';
import { generateTransactionId } from '../utils/ids.js';

export async function ensureUserWallets(userId: Types.ObjectId | string, session?: ClientSession) {
  const types: WalletType[] = ['main', 'income', 'referral'];
  const wallets = [];
  for (const walletType of types) {
    const existing = await Wallet.findOne({ userId, walletType }).session(session || null);
    if (existing) {
      wallets.push(existing);
      continue;
    }
    const [created] = await Wallet.create(
      [{ userId, walletType, balance: 0, totalCredited: 0, totalDebited: 0, currency: 'INR' }],
      { session }
    );
    wallets.push(created!);
  }
  return wallets;
}

export async function getUserWallets(userId: string) {
  await ensureUserWallets(userId);
  return Wallet.find({ userId }).lean();
}

export async function getWalletByType(userId: string, walletType: WalletType) {
  await ensureUserWallets(userId);
  const wallet = await Wallet.findOne({ userId, walletType });
  if (!wallet) throw ApiError.notFound('Wallet not found');
  return wallet;
}

interface LedgerInput {
  userId: string | Types.ObjectId;
  walletType: WalletType;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  session?: ClientSession;
}

/**
 * Atomic wallet ledger entry.
 * Always creates an immutable transaction and updates balance in the same MongoDB session.
 */
export async function applyLedgerEntry(input: LedgerInput) {
  if (input.amount <= 0) throw ApiError.badRequest('Amount must be greater than zero');

  if (input.idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey: input.idempotencyKey }).session(
      input.session || null
    );
    if (existing) return { wallet: await Wallet.findById(existing.walletId), transaction: existing, duplicated: true };
  }

  const run = async (session: ClientSession) => {
    const wallet = await Wallet.findOne({ userId: input.userId, walletType: input.walletType }).session(session);
    if (!wallet) throw ApiError.notFound(`${input.walletType} wallet not found`);

    const balanceBefore = wallet.balance;
    if (input.type === 'debit' && wallet.balance < input.amount) {
      throw ApiError.badRequest('Insufficient wallet balance');
    }

    const balanceAfter = input.type === 'credit' ? balanceBefore + input.amount : balanceBefore - input.amount;

    wallet.balance = balanceAfter;
    if (input.type === 'credit') wallet.totalCredited += input.amount;
    else wallet.totalDebited += input.amount;
    await wallet.save({ session });

    const [transaction] = await WalletTransaction.create(
      [
        {
          transactionId: generateTransactionId(),
          userId: input.userId,
          walletId: wallet._id,
          walletType: input.walletType,
          type: input.type,
          amount: input.amount,
          balanceBefore,
          balanceAfter,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          description: input.description,
          status: 'completed',
          idempotencyKey: input.idempotencyKey,
          metadata: input.metadata,
        },
      ],
      { session }
    );

    return { wallet, transaction, duplicated: false };
  };

  if (input.session) return run(input.session);

  const session = await mongoose.startSession();
  try {
    let result: Awaited<ReturnType<typeof run>> | undefined;
    await session.withTransaction(async () => {
      result = await run(session);
    });
    return result!;
  } finally {
    session.endSession();
  }
}

export async function getWalletTransactions(
  userId: string,
  walletType: WalletType | undefined,
  opts: { skip: number; limit: number; status?: string }
) {
  const filter: Record<string, unknown> = { userId };
  if (walletType) filter.walletType = walletType;
  if (opts.status) filter.status = opts.status;

  const [items, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    WalletTransaction.countDocuments(filter),
  ]);
  return { items, total };
}
