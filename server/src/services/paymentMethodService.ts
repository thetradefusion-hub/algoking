import { PaymentMethod, type IPaymentMethod } from '../models/PaymentMethod.js';
import { ApiError } from '../utils/apiError.js';

const DEFAULT_METHODS = [
  {
    code: 'bep20' as const,
    name: 'USDT (BEP20)',
    kind: 'crypto' as const,
    network: 'BEP20',
    currency: 'USDT',
    iconUrl: '/icons/usdt.png',
    depositAddress: '0xALGOKING_BEP20_REPLACE_ME',
    depositInstructions: 'Send only USDT on BNB Smart Chain (BEP20). Submit Tx Hash after transfer.',
    withdrawInstructions: 'Enter your BEP20 USDT wallet address. Wrong network may cause loss of funds.',
    minDeposit: 10,
    maxDeposit: 50000,
    minWithdraw: 20,
    maxWithdraw: 50000,
    sortOrder: 1,
  },
  {
    code: 'trc20' as const,
    name: 'USDT (TRC20)',
    kind: 'crypto' as const,
    network: 'TRC20',
    currency: 'USDT',
    iconUrl: '/icons/trx.png',
    depositAddress: 'TALGOKING_TRC20_REPLACE_ME',
    depositInstructions: 'Send only USDT on TRON (TRC20). Submit Tx Hash after transfer.',
    withdrawInstructions: 'Enter your TRC20 USDT wallet address. Wrong network may cause loss of funds.',
    minDeposit: 10,
    maxDeposit: 50000,
    minWithdraw: 20,
    maxWithdraw: 50000,
    sortOrder: 2,
  },
  {
    code: 'inr_upi' as const,
    name: 'INR (UPI)',
    kind: 'fiat' as const,
    currency: 'INR',
    iconUrl: '/icons/upi.svg',
    upiId: 'algoking@upi',
    depositInstructions: 'Pay via UPI and submit UTR / Reference ID for admin verification.',
    withdrawInstructions: 'Enter your UPI ID. Admin will process after approval.',
    minDeposit: 100,
    maxDeposit: 200000,
    minWithdraw: 500,
    maxWithdraw: 100000,
    sortOrder: 3,
  },
  {
    code: 'inr_bank' as const,
    name: 'INR (Bank Account)',
    kind: 'fiat' as const,
    currency: 'INR',
    iconUrl: '/icons/inr.svg',
    bankDetails: {
      accountHolderName: 'AlgoKing Payments',
      accountNumber: 'XXXXXXXXXXXX',
      ifscCode: 'HDFC0000000',
      bankName: 'HDFC Bank',
    },
    depositInstructions: 'Transfer to the bank account and submit UTR / Reference number.',
    withdrawInstructions: 'Select or provide bank account details for payout.',
    minDeposit: 500,
    maxDeposit: 500000,
    minWithdraw: 500,
    maxWithdraw: 200000,
    sortOrder: 4,
  },
];

export async function seedPaymentMethods() {
  for (const item of DEFAULT_METHODS) {
    await PaymentMethod.updateOne(
      { code: item.code },
      {
        $setOnInsert: {
          ...item,
          depositEnabled: true,
          withdrawEnabled: true,
          depositFee: 0,
          withdrawFee: 0,
          status: 'active',
        },
      },
      { upsert: true }
    );
  }
}

export function sanitizeMethod(m: IPaymentMethod, forAdmin = false) {
  return {
    id: m._id,
    code: m.code,
    name: m.name,
    kind: m.kind,
    network: m.network,
    currency: m.currency,
    iconUrl: m.iconUrl,
    qrCodeUrl: m.qrCodeUrl || '',
    depositEnabled: m.depositEnabled,
    withdrawEnabled: m.withdrawEnabled,
    depositAddress: m.depositAddress,
    upiId: m.upiId,
    bankDetails: m.bankDetails,
    depositInstructions: m.depositInstructions,
    withdrawInstructions: m.withdrawInstructions,
    minDeposit: m.minDeposit,
    maxDeposit: m.maxDeposit,
    minWithdraw: m.minWithdraw,
    maxWithdraw: m.maxWithdraw,
    depositFee: m.depositFee,
    withdrawFee: m.withdrawFee,
    sortOrder: m.sortOrder,
    status: m.status,
    ...(forAdmin ? { createdAt: m.createdAt, updatedAt: m.updatedAt } : {}),
  };
}

export async function listActiveMethods(opts?: { forDeposit?: boolean; forWithdraw?: boolean }) {
  const filter: Record<string, unknown> = { status: 'active' };
  if (opts?.forDeposit) filter.depositEnabled = true;
  if (opts?.forWithdraw) filter.withdrawEnabled = true;
  const items = await PaymentMethod.find(filter).sort({ sortOrder: 1 }).lean();
  return items.map((m) => sanitizeMethod(m as unknown as IPaymentMethod));
}

export async function listAllMethods() {
  const items = await PaymentMethod.find().sort({ sortOrder: 1 });
  return items.map((m) => sanitizeMethod(m, true));
}

export async function getMethodById(id: string) {
  const m = await PaymentMethod.findById(id);
  if (!m || m.status !== 'active') throw ApiError.notFound('Payment method not found');
  return m;
}

export async function upsertMethod(
  id: string | undefined,
  data: Partial<IPaymentMethod>
) {
  if (id) {
    const updated = await PaymentMethod.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!updated) throw ApiError.notFound('Payment method not found');
    return sanitizeMethod(updated, true);
  }
  if (!data.code || !data.name || !data.kind || !data.currency || !data.iconUrl) {
    throw ApiError.badRequest('Missing required payment method fields');
  }
  const created = await PaymentMethod.create(data);
  return sanitizeMethod(created, true);
}
