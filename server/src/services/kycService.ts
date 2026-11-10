import { UserKyc } from '../models/UserKyc.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { encryptSensitive, last4, maskPan } from '../utils/crypto.js';

export async function submitKyc(
  userId: string,
  data: {
    fullName: string;
    dateOfBirth?: string;
    panNumber: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    documentPaths?: string[];
  }
) {
  const existing = await UserKyc.findOne({ userId });
  if (existing && existing.status === 'approved') {
    throw ApiError.badRequest('KYC already approved');
  }
  if (existing && existing.status === 'pending') {
    throw ApiError.badRequest('KYC already pending review');
  }

  const payload = {
    userId,
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    panNumberEncrypted: encryptSensitive(data.panNumber.toUpperCase()),
    panLast4: last4(data.panNumber.toUpperCase()),
    bankAccountHolder: data.bankAccountHolder,
    bankAccountNumberEncrypted: data.bankAccountNumber
      ? encryptSensitive(data.bankAccountNumber)
      : undefined,
    bankAccountLast4: data.bankAccountNumber ? last4(data.bankAccountNumber) : undefined,
    ifscCode: data.ifscCode?.toUpperCase(),
    documentPaths: data.documentPaths || [],
    status: 'pending' as const,
    rejectionReason: undefined,
    reviewedBy: undefined,
    reviewedAt: undefined,
  };

  const kyc = existing
    ? await UserKyc.findByIdAndUpdate(existing._id, { $set: payload }, { new: true })
    : await UserKyc.create(payload);

  return sanitizeKyc(kyc!);
}

export function sanitizeKyc(kyc: InstanceType<typeof UserKyc>) {
  return {
    id: kyc._id,
    userId: kyc.userId,
    fullName: kyc.fullName,
    dateOfBirth: kyc.dateOfBirth,
    panMasked: `******${kyc.panLast4}`,
    bankAccountHolder: kyc.bankAccountHolder,
    bankAccountMasked: kyc.bankAccountLast4 ? `****${kyc.bankAccountLast4}` : undefined,
    ifscCode: kyc.ifscCode,
    documentCount: kyc.documentPaths?.length || 0,
    status: kyc.status,
    rejectionReason: kyc.rejectionReason,
    reviewedAt: kyc.reviewedAt,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
  };
}

export async function getKycStatus(userId: string) {
  const kyc = await UserKyc.findOne({ userId });
  if (!kyc) return { status: 'not_submitted' as const, kyc: null };
  return { status: kyc.status, kyc: sanitizeKyc(kyc) };
}

export async function adminListKyc(opts: { skip: number; limit: number; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    UserKyc.find(filter)
      .populate('userId', 'fullName email mobile')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    UserKyc.countDocuments(filter),
  ]);

  return {
    items: items.map((k) => ({
      ...k,
      panMasked: maskPan(`XXXXXX${k.panLast4}`),
      panNumberEncrypted: undefined,
      bankAccountNumberEncrypted: undefined,
      documentPaths: undefined,
      documentCount: k.documentPaths?.length || 0,
    })),
    total,
  };
}

export async function approveKyc(id: string, adminId: string) {
  const kyc = await UserKyc.findById(id);
  if (!kyc) throw ApiError.notFound('KYC not found');
  kyc.status = 'approved';
  kyc.reviewedBy = kyc.reviewedBy; // keep type happy
  kyc.set({ reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: undefined });
  await kyc.save();
  await Notification.create({
    userId: kyc.userId,
    title: 'KYC Approved',
    message: 'Your KYC verification has been approved.',
    type: 'kyc_status',
  });
  return sanitizeKyc(kyc);
}

export async function rejectKyc(id: string, adminId: string, reason: string) {
  const kyc = await UserKyc.findById(id);
  if (!kyc) throw ApiError.notFound('KYC not found');
  kyc.status = 'rejected';
  kyc.set({ reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason });
  await kyc.save();
  await Notification.create({
    userId: kyc.userId,
    title: 'KYC Rejected',
    message: `KYC rejected: ${reason}`,
    type: 'kyc_status',
  });
  return sanitizeKyc(kyc);
}
