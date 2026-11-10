import { BankAccount } from '../models/BankAccount.js';
import { WithdrawalRequest } from '../models/WithdrawalRequest.js';
import { ApiError } from '../utils/apiError.js';
import { encryptSensitive, last4 } from '../utils/crypto.js';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function sanitizeBank(account: InstanceType<typeof BankAccount>) {
  return {
    id: account._id,
    accountHolderName: account.accountHolderName,
    accountNumberMasked: `****${account.accountNumberLast4}`,
    accountNumberLast4: account.accountNumberLast4,
    ifscCode: account.ifscCode,
    bankName: account.bankName,
    isPrimary: account.isPrimary,
    verificationStatus: account.verificationStatus,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export async function addBankAccount(
  userId: string,
  data: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    isPrimary?: boolean;
  }
) {
  if (!IFSC_REGEX.test(data.ifscCode.toUpperCase())) {
    throw ApiError.badRequest('Invalid IFSC code');
  }
  if (!/^\d{9,18}$/.test(data.accountNumber)) {
    throw ApiError.badRequest('Invalid account number');
  }

  const count = await BankAccount.countDocuments({ userId });
  const isPrimary = data.isPrimary || count === 0;
  if (isPrimary) {
    await BankAccount.updateMany({ userId }, { $set: { isPrimary: false } });
  }

  const account = await BankAccount.create({
    userId,
    accountHolderName: data.accountHolderName,
    accountNumberEncrypted: encryptSensitive(data.accountNumber),
    accountNumberLast4: last4(data.accountNumber),
    ifscCode: data.ifscCode.toUpperCase(),
    bankName: data.bankName,
    isPrimary,
    verificationStatus: 'unverified',
  });

  return sanitizeBank(account);
}

export async function listBankAccounts(userId: string) {
  const accounts = await BankAccount.find({ userId }).sort({ isPrimary: -1, createdAt: -1 });
  return accounts.map(sanitizeBank);
}

export async function updateBankAccount(
  userId: string,
  id: string,
  data: Partial<{ accountHolderName: string; bankName: string; isPrimary: boolean; ifscCode: string }>
) {
  const account = await BankAccount.findOne({ _id: id, userId });
  if (!account) throw ApiError.notFound('Bank account not found');

  if (data.ifscCode) {
    if (!IFSC_REGEX.test(data.ifscCode.toUpperCase())) throw ApiError.badRequest('Invalid IFSC code');
    account.ifscCode = data.ifscCode.toUpperCase();
  }
  if (data.accountHolderName) account.accountHolderName = data.accountHolderName;
  if (data.bankName) account.bankName = data.bankName;
  if (data.isPrimary) {
    await BankAccount.updateMany({ userId }, { $set: { isPrimary: false } });
    account.isPrimary = true;
  }
  await account.save();
  return sanitizeBank(account);
}

export async function deleteBankAccount(userId: string, id: string) {
  const pending = await WithdrawalRequest.exists({
    bankAccountId: id,
    status: { $in: ['pending', 'approved', 'processing'] },
  });
  if (pending) throw ApiError.badRequest('Cannot remove bank account linked to a pending payout');

  const account = await BankAccount.findOneAndDelete({ _id: id, userId });
  if (!account) throw ApiError.notFound('Bank account not found');
  if (account.isPrimary) {
    const next = await BankAccount.findOne({ userId }).sort({ createdAt: -1 });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }
  return { deleted: true };
}
