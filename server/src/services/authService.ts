import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, type IUser } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { ApiError } from '../utils/apiError.js';
import { generateReferralCode, generateUsername } from '../utils/ids.js';
import { ensureUserWallets } from './walletService.js';

const SALT_ROUNDS = 12;

function signAccessToken(user: IUser, extra?: Record<string, unknown>) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'access', ...extra },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
}

function signRefreshToken(user: IUser) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    permissions: user.permissions,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    status: user.status,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    profileImage: user.profileImage,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  return generateReferralCode(10);
}

async function buildReferralChain(newUserId: mongoose.Types.ObjectId, sponsorId: mongoose.Types.ObjectId, code: string) {
  // Level 1: direct sponsor
  const chain: Array<{ userId: mongoose.Types.ObjectId; sponsorId: mongoose.Types.ObjectId; level: number; referralCodeUsed: string }> = [
    { userId: newUserId, sponsorId, level: 1, referralCodeUsed: code },
  ];

  // Walk up sponsor hierarchy (max 3 levels)
  let currentSponsorId: mongoose.Types.ObjectId = sponsorId;
  for (let level = 2; level <= 3; level++) {
    const upline = await User.findById(currentSponsorId).select({ referredBy: 1 }).lean<{
      referredBy?: mongoose.Types.ObjectId | null;
    } | null>();
    if (!upline?.referredBy) break;
    const nextSponsorId = upline.referredBy;
    // Prevent circular referral
    if (String(nextSponsorId) === String(newUserId)) break;
    chain.push({
      userId: newUserId,
      sponsorId: nextSponsorId,
      level,
      referralCodeUsed: code,
    });
    currentSponsorId = nextSponsorId;
  }

  await Referral.insertMany(chain);
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  referralCode?: string;
}) {
  const { getSetting } = await import('./settingsService.js');
  const registrationOpen = await getSetting<boolean>('registrationOpen', true);
  if (registrationOpen === false) {
    throw ApiError.badRequest('New registrations are temporarily closed. Please try again later.');
  }

  const existing = await User.findOne({
    $or: [{ email: input.email.toLowerCase() }, { mobile: input.mobile }],
  });
  if (existing) {
    if (existing.email === input.email.toLowerCase()) throw ApiError.conflict('Email already registered');
    throw ApiError.conflict('Mobile number already registered');
  }

  let sponsor: IUser | null = null;
  if (input.referralCode) {
    sponsor = await User.findOne({ referralCode: input.referralCode.toUpperCase() });
    if (!sponsor) throw ApiError.badRequest('Invalid referral code');
    if (sponsor.status === 'blocked') throw ApiError.badRequest('Referral sponsor is not eligible');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const session = await mongoose.startSession();

  try {
    let user!: IUser;
    await session.withTransaction(async () => {
      const [created] = await User.create(
        [
          {
            fullName: input.fullName,
            username: generateUsername(input.fullName),
            email: input.email.toLowerCase(),
            mobile: input.mobile,
            passwordHash,
            role: 'user',
            referralCode: await uniqueReferralCode(),
            referredBy: sponsor?._id,
            status: 'active',
          },
        ],
        { session }
      );
      user = created!;
      await ensureUserWallets(user._id, session);
      if (sponsor) {
        await buildReferralChain(user._id, sponsor._id, input.referralCode!.toUpperCase());
      }
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    return { user: sanitizeUser(user), accessToken, refreshToken };
  } finally {
    session.endSession();
  }
}

export async function loginUser(identifier: string, password: string) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
  }).select('+passwordHash +refreshTokenHash');

  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status === 'blocked') throw ApiError.forbidden('Account is blocked');
  if (user.status === 'inactive') throw ApiError.forbidden('Account is inactive');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: string; type: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; type: string };
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid token type');

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw ApiError.unauthorized('Session expired');
  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    // Possible reuse — invalidate
    user.refreshTokenHash = undefined;
    await user.save();
    throw ApiError.unauthorized('Refresh token reuse detected');
  }
  if (user.status === 'blocked' || user.status === 'inactive') {
    throw ApiError.forbidden('Account not allowed');
  }

  const accessToken = signAccessToken(user);
  const newRefresh = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefresh);
  await user.save();

  return { user: sanitizeUser(user), accessToken, refreshToken: newRefresh };
}

export async function logoutUser(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

/** Admin-only: issue a temporary user access token without password (audited by caller). */
export async function impersonateUser(userId: string, adminId: string) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') throw ApiError.notFound('User not found');
  if (user.status === 'blocked') throw ApiError.forbidden('Cannot login as a blocked user');

  // Longer-lived access token for support sessions; does not rotate user's refresh token
  const accessToken = jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'access', impersonatedBy: adminId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '2h' }
  );

  return {
    user: sanitizeUser(user),
    accessToken,
    impersonatedBy: adminId,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.refreshTokenHash = undefined;
  await user.save();
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always return success message to avoid enumeration
  if (!user) return { resetToken: null as string | null };

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // Return token in non-production for local testing; production would email it
  return {
    resetToken: env.NODE_ENV === 'production' ? null : resetToken,
    message: 'If the account exists, reset instructions were sent',
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const hash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordHash');

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined;
  await user.save();
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
}
