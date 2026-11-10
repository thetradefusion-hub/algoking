import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { InvestmentOrder } from '../models/InvestmentOrder.js';
import { RechargeRequest } from '../models/RechargeRequest.js';
import { WithdrawalRequest } from '../models/WithdrawalRequest.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { CommissionLedger } from '../models/CommissionLedger.js';
import { Referral } from '../models/Referral.js';
import { Plan } from '../models/Plan.js';
import { Notification } from '../models/Notification.js';
import { UserKyc } from '../models/UserKyc.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ensureUserWallets } from './walletService.js';

export async function getUserDashboard(userId: string) {
  await ensureUserWallets(userId);
  const uid = new mongoose.Types.ObjectId(userId);

  const [
    user,
    wallets,
    activeInvestments,
    completedInvestments,
    investedAgg,
    recentTxns,
    recentOrders,
    plans,
    referralIncome,
    teamCount,
    unreadNotifications,
  ] = await Promise.all([
    User.findById(userId).lean(),
    Wallet.find({ userId }).lean(),
    InvestmentOrder.countDocuments({ userId, status: 'active' }),
    InvestmentOrder.countDocuments({ userId, status: 'completed' }),
    InvestmentOrder.aggregate([
      { $match: { userId: uid, status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, projected: { $sum: '$projectedIncomeSnapshot' } } },
    ]),
    WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(8).lean(),
    InvestmentOrder.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    Plan.find({ status: 'active' }).sort({ sortOrder: 1 }).limit(4).lean(),
    CommissionLedger.aggregate([
      { $match: { userId: uid, status: { $in: ['paid', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
    Referral.countDocuments({ sponsorId: userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  const walletMap = Object.fromEntries(wallets.map((w) => [w.walletType, w]));
  const totalInvested = investedAgg[0]?.total || 0;
  const totalProjected = investedAgg[0]?.projected || 0;
  const totalReferralIncome = referralIncome[0]?.total || 0;
  const incomeWallet = walletMap.income?.balance || 0;
  const referralWallet = walletMap.referral?.balance || 0;

  // Earnings chart: last 7 days credits
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const earningsChart = await WalletTransaction.aggregate([
    {
      $match: {
        userId: uid,
        type: 'credit',
        createdAt: { $gte: sevenDaysAgo },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    user: {
      id: user?._id,
      fullName: user?.fullName,
      referralCode: user?.referralCode,
      profileImage: user?.profileImage,
    },
    wallets: {
      main: walletMap.main || null,
      income: walletMap.income || null,
      referral: walletMap.referral || null,
    },
    summary: {
      totalInvestment: totalInvested,
      totalEarnings: incomeWallet + referralWallet + totalReferralIncome,
      totalProjectedIncome: totalProjected,
      activeInvestments,
      completedInvestments,
      teamMembers: teamCount,
      unreadNotifications,
    },
    plans,
    recentOrders,
    recentActivity: recentTxns,
    charts: {
      earningsOverview: earningsChart,
    },
  };
}

export async function getAdminDashboard() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    newRegistrations,
    totalInvestmentsAgg,
    activeInvestments,
    rechargeAgg,
    pendingRecharge,
    pendingWithdrawals,
    completedWithdrawalsAgg,
    commissionAgg,
    pendingKyc,
    openTickets,
    activePlans,
    latestUsers,
    latestRecharges,
    latestWithdrawals,
    latestOrders,
    latestKyc,
    latestTickets,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'active' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
    InvestmentOrder.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    InvestmentOrder.countDocuments({ status: 'active' }),
    RechargeRequest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    RechargeRequest.countDocuments({ status: { $in: ['pending', 'awaiting_payment'] } }),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    WithdrawalRequest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    CommissionLedger.aggregate([
      { $match: { status: { $in: ['paid', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
    UserKyc.countDocuments({ status: 'pending' }),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Plan.countDocuments({ status: 'active' }),
    User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(8).select('fullName email mobile status createdAt').lean(),
    RechargeRequest.find().sort({ createdAt: -1 }).limit(8).populate('userId', 'fullName email').lean(),
    WithdrawalRequest.find().sort({ createdAt: -1 }).limit(8).populate('userId', 'fullName email').lean(),
    InvestmentOrder.find().sort({ createdAt: -1 }).limit(8).populate('userId', 'fullName email').populate('planId', 'name').lean(),
    UserKyc.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(8).populate('userId', 'fullName email').lean(),
    SupportTicket.find({ status: { $in: ['open', 'in_progress'] } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('userId', 'fullName email')
      .lean(),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [registrationChart, rechargeChart, investmentChart] = await Promise.all([
    User.aggregate([
      { $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    RechargeRequest.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    InvestmentOrder.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    kpis: {
      totalUsers,
      activeUsers,
      newRegistrations,
      totalInvestments: totalInvestmentsAgg[0]?.total || 0,
      investmentCount: totalInvestmentsAgg[0]?.count || 0,
      activeInvestments,
      totalRecharge: rechargeAgg[0]?.total || 0,
      pendingRecharge,
      pendingWithdrawals,
      completedWithdrawals: completedWithdrawalsAgg[0]?.count || 0,
      completedWithdrawalAmount: completedWithdrawalsAgg[0]?.total || 0,
      totalReferralCommissions: commissionAgg[0]?.total || 0,
      pendingKyc,
      openTickets,
      activePlans,
    },
    charts: {
      registrations: registrationChart,
      recharges: rechargeChart,
      investments: investmentChart,
    },
    recent: {
      users: latestUsers,
      recharges: latestRecharges,
      withdrawals: latestWithdrawals,
      orders: latestOrders,
      kyc: latestKyc,
      tickets: latestTickets,
    },
  };
}
