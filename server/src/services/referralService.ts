import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { CommissionLedger } from '../models/CommissionLedger.js';
import { CommissionRule } from '../models/CommissionRule.js';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export async function getReferralSummary(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const [level1, level2, level3, incomeAgg] = await Promise.all([
    Referral.countDocuments({ sponsorId: userId, level: 1 }),
    Referral.countDocuments({ sponsorId: userId, level: 2 }),
    Referral.countDocuments({ sponsorId: userId, level: 3 }),
    CommissionLedger.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $in: ['paid', 'approved'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
  ]);

  const total = level1 + level2 + level3;
  const activeMembers = await User.countDocuments({
    _id: { $in: (await Referral.find({ sponsorId: userId }).distinct('userId')) },
    status: 'active',
  });

  const rules = await getCommissionRules();

  return {
    referralCode: user.referralCode,
    referralLink: `${env.CLIENT_URL}/register?ref=${user.referralCode}`,
    totalTeamMembers: total,
    activeMembers,
    inactiveMembers: Math.max(total - activeMembers, 0),
    totalReferralIncome: incomeAgg[0]?.total || 0,
    levels: { level1, level2, level3 },
    commissionRules: rules.map((r) => ({
      level: r.level,
      percentage: r.percentage,
      eligibleEvent: r.eligibleEvent,
      minimumQualifyingAmount: r.minimumQualifyingAmount,
    })),
  };
}

export async function getTeamByLevel(userId: string, level?: number, opts?: { skip: number; limit: number }) {
  const filter: Record<string, unknown> = { sponsorId: userId };
  if (level) filter.level = level;

  const skip = opts?.skip ?? 0;
  const limit = opts?.limit ?? 50;

  const [links, total] = await Promise.all([
    Referral.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Referral.countDocuments(filter),
  ]);

  const userIds = links.map((l) => l.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('fullName email mobile status createdAt referralCode')
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  const items = links.map((l) => ({
    ...l,
    member: userMap[l.userId.toString()] || null,
  }));

  return { items, total };
}

export async function getCommissions(userId: string, opts: { skip: number; limit: number }) {
  const filter = { userId };
  const [items, total] = await Promise.all([
    CommissionLedger.find(filter)
      .populate('sourceUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    CommissionLedger.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getCommissionRules() {
  const rules = await CommissionRule.find({ status: 'active' }).sort({ level: 1, version: -1 }).lean();
  const byLevel = new Map<number, (typeof rules)[0]>();
  for (const rule of rules) {
    if (!byLevel.has(rule.level)) byLevel.set(rule.level, rule);
  }
  return Array.from(byLevel.values()).sort((a, b) => a.level - b.level);
}

export async function upsertCommissionRules(
  rules: Array<{
    level: number;
    percentage: number;
    eligibleEvent?: string;
    minimumQualifyingAmount?: number;
  }>,
  _adminId: string
) {
  const results = [];
  for (const rule of rules) {
    const latest = await CommissionRule.findOne({ level: rule.level }).sort({ version: -1 });
    const version = (latest?.version || 0) + 1;
    if (latest) {
      latest.effectiveTo = new Date();
      latest.status = 'inactive';
      await latest.save();
    }
    const created = await CommissionRule.create({
      level: rule.level,
      percentage: rule.percentage,
      eligibleEvent: rule.eligibleEvent || 'investment_purchase',
      minimumQualifyingAmount: rule.minimumQualifyingAmount || 0,
      status: 'active',
      version,
      effectiveFrom: new Date(),
    });
    results.push(created);
  }
  return results;
}
