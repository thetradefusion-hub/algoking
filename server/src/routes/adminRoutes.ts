import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex, getPagination } from '../utils/pagination.js';
import { param } from '../utils/params.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';
import { InvestmentOrder } from '../models/InvestmentOrder.js';
import { Wallet } from '../models/Wallet.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { RechargeRequest } from '../models/RechargeRequest.js';
import { WithdrawalRequest } from '../models/WithdrawalRequest.js';
import { BankAccount } from '../models/BankAccount.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import * as dashboardService from '../services/dashboardService.js';
import * as planService from '../services/planService.js';
import * as rechargeService from '../services/rechargeService.js';
import * as withdrawalService from '../services/withdrawalService.js';
import * as referralService from '../services/referralService.js';
import * as kycService from '../services/kycService.js';
import * as supportService from '../services/supportService.js';
import * as notificationService from '../services/notificationService.js';
import * as walletService from '../services/walletService.js';
import { getSettingsByCategory, setSetting } from '../services/settingsService.js';
import { generateReferralCode, generateUsername } from '../utils/ids.js';
import { impersonateUser, sanitizeUser } from '../services/authService.js';

const router = Router();
router.use(authenticate, requireAdmin);

async function audit(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  reason?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
  ip?: string
) {
  await AdminAuditLog.create({
    adminId,
    action,
    entityType,
    entityId,
    reason,
    beforeSnapshot: before,
    afterSnapshot: after,
    ipAddress: ip,
  });
}

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const data = await dashboardService.getAdminDashboard();
    return sendSuccess(res, data);
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = { role: 'user' };
    if (typeof req.query.status === 'string') filter.status = req.query.status;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const q = escapeRegex(req.query.q.trim());
      filter.$or = [
        { fullName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { mobile: new RegExp(q, 'i') },
        { referralCode: new RegExp(q, 'i') },
      ];
    }
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return sendPaginated(
      res,
      items.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        mobile: u.mobile,
        status: u.status,
        referralCode: u.referralCode,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      { page, limit, total }
    );
  })
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(param(req, 'id')).lean();
    if (!user || user.role !== 'user') throw ApiError.notFound('User not found');

    const userId = user._id.toString();
    const [
      wallets,
      orders,
      kyc,
      referrals,
      banks,
      recharges,
      withdrawals,
      ledger,
      tickets,
      sponsor,
      orderStats,
      rechargeStats,
      withdrawalStats,
    ] = await Promise.all([
      Wallet.find({ userId: user._id }).lean(),
      InvestmentOrder.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).lean(),
      kycService.getKycStatus(userId),
      referralService.getReferralSummary(userId),
      BankAccount.find({ userId: user._id }).sort({ isPrimary: -1, createdAt: -1 }).lean(),
      RechargeRequest.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      WithdrawalRequest.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(40).lean(),
      SupportTicket.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
      user.referredBy
        ? User.findById(user.referredBy).select('fullName email mobile referralCode').lean()
        : Promise.resolve(null),
      InvestmentOrder.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      RechargeRequest.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      WithdrawalRequest.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

    return sendSuccess(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        status: user.status,
        role: user.role,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        adminRemarks: user.adminRemarks,
      },
      sponsor: sponsor
        ? {
            id: sponsor._id,
            fullName: sponsor.fullName,
            email: sponsor.email,
            mobile: sponsor.mobile,
            referralCode: sponsor.referralCode,
          }
        : null,
      summary: {
        totalBalance,
        walletsCount: wallets.length,
        ordersCount: orders.length,
        banksCount: banks.length,
        openTickets: tickets.filter((t) => !['closed', 'resolved'].includes(t.status)).length,
        orderStats,
        rechargeStats,
        withdrawalStats,
      },
      wallets,
      orders,
      kyc,
      referrals,
      banks: banks.map((b) => ({
        id: b._id,
        bankName: b.bankName,
        accountHolderName: b.accountHolderName,
        accountNumberLast4: b.accountNumberLast4,
        ifscCode: b.ifscCode,
        isPrimary: b.isPrimary,
        verificationStatus: b.verificationStatus,
        createdAt: b.createdAt,
      })),
      recharges,
      withdrawals,
      ledger,
      tickets: tickets.map((t) => ({
        id: t._id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        category: t.category,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  })
);

router.post(
  '/users/:id/impersonate',
  requireRoles('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const targetId = param(req, 'id');
    const result = await impersonateUser(targetId, req.user!.id);
    await audit(
      req.user!.id,
      'user.impersonate',
      'user',
      targetId,
      'Admin logged in as user',
      undefined,
      { targetUserId: targetId, targetEmail: result.user.email },
      req.ip
    );
    // Do not overwrite admin refresh cookie — access token is enough for temporary login-as
    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        impersonatedBy: result.impersonatedBy,
      },
      'Impersonation session started'
    );
  })
);

router.patch(
  '/users/:id/status',
  validate({
    body: z.object({
      status: z.enum(['active', 'inactive', 'blocked']),
      reason: z.string().min(3),
      adminRemarks: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const user = await User.findById(param(req, 'id'));
    if (!user || user.role !== 'user') throw ApiError.notFound('User not found');
    const before = { status: user.status };
    user.status = req.body.status;
    if (req.body.adminRemarks) user.adminRemarks = req.body.adminRemarks;
    await user.save();
    await audit(req.user!.id, 'user.status_update', 'user', user._id.toString(), req.body.reason, before, {
      status: user.status,
    }, req.ip);
    return sendSuccess(res, { user: sanitizeUser(user) }, 'User status updated');
  })
);

router.get(
  '/plans',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const plans = await planService.adminListPlans({ status });
    return sendSuccess(res, { plans });
  })
);

const planBodySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  investmentAmount: z.number().positive(),
  durationDays: z.number().int().positive(),
  projectedDailyIncome: z.number().min(0),
  projectedTotalIncome: z.number().min(0),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  purchaseLimit: z.number().int().min(0).optional(),
  sortOrder: z.number().optional(),
  image: z.string().max(2000).optional(),
  iconEmoji: z.string().max(8).optional(),
  badgeLabel: z.string().max(40).optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  riskDisclosure: z.string().optional(),
  slug: z.string().optional(),
});

router.post(
  '/plans',
  validate({ body: planBodySchema }),
  asyncHandler(async (req, res) => {
    const plan = await planService.createPlan(req.body);
    await audit(req.user!.id, 'plan.create', 'plan', plan._id.toString(), undefined, undefined, plan.toObject() as unknown as Record<string, unknown>, req.ip);
    return sendSuccess(res, { plan }, 'Plan created', 201);
  })
);

router.put(
  '/plans/:id',
  validate({ body: planBodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const plan = await planService.updatePlan(param(req, 'id'), req.body);
    await audit(req.user!.id, 'plan.update', 'plan', plan._id.toString(), undefined, undefined, plan.toObject() as unknown as Record<string, unknown>, req.ip);
    return sendSuccess(res, { plan }, 'Plan updated');
  })
);

router.post(
  '/plans/:id/duplicate',
  asyncHandler(async (req, res) => {
    const plan = await planService.duplicatePlan(param(req, 'id'));
    await audit(req.user!.id, 'plan.duplicate', 'plan', plan._id.toString(), undefined, undefined, plan.toObject() as unknown as Record<string, unknown>, req.ip);
    return sendSuccess(res, { plan }, 'Plan duplicated', 201);
  })
);

router.delete(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    const result = await planService.archivePlan(param(req, 'id'));
    await audit(req.user!.id, 'plan.archive_or_delete', 'plan', param(req, 'id'), undefined, undefined, result as unknown as Record<string, unknown>, req.ip);
    return sendSuccess(res, result, result.archived ? 'Plan archived' : 'Plan deleted');
  })
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (typeof req.query.status === 'string') filter.status = req.query.status;
    const [items, total] = await Promise.all([
      InvestmentOrder.find(filter)
        .populate('userId', 'fullName email mobile')
        .populate('planId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InvestmentOrder.countDocuments(filter),
    ]);
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.get(
  '/wallets',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) return sendSuccess(res, { user: null, wallets: [] });
    const user = await User.findOne({
      $or: [{ email: q.toLowerCase() }, { mobile: q }, { referralCode: q.toUpperCase() }],
    });
    if (!user) throw ApiError.notFound('User not found');
    const wallets = await walletService.getUserWallets(user._id.toString());
    return sendSuccess(res, { user: sanitizeUser(user), wallets });
  })
);

router.post(
  '/wallets/adjust',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({
    body: z.object({
      userId: z.string().min(1),
      walletType: z.enum(['main', 'income', 'referral']),
      type: z.enum(['credit', 'debit']),
      amount: z.number().positive(),
      reason: z.string().min(5),
    }),
  }),
  asyncHandler(async (req, res) => {
    await walletService.ensureUserWallets(req.body.userId);
    const result = await walletService.applyLedgerEntry({
      userId: req.body.userId,
      walletType: req.body.walletType,
      type: req.body.type,
      amount: req.body.amount,
      description: `Admin adjustment: ${req.body.reason}`,
      referenceType: 'admin_adjustment',
      referenceId: req.user!.id,
      metadata: { adminId: req.user!.id, reason: req.body.reason },
    });
    await audit(
      req.user!.id,
      'wallet.adjust',
      'wallet',
      result.wallet?._id?.toString(),
      req.body.reason,
      undefined,
      {
        userId: req.body.userId,
        walletType: req.body.walletType,
        type: req.body.type,
        amount: req.body.amount,
        transactionId: result.transaction?.transactionId,
      },
      req.ip
    );
    return sendSuccess(res, result, 'Wallet adjusted via ledger');
  })
);

router.get(
  '/recharges',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await rechargeService.adminListRecharges({ skip, limit, status });
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.post(
  '/recharges/:id/approve',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({ body: z.object({ reason: z.string().min(3).optional(), providerPaymentId: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const result = await rechargeService.adminApproveRecharge(
      param(req, 'id'),
      req.user!.id,
      req.body.reason || 'Admin approved'
    );
    await audit(req.user!.id, 'recharge.approve', 'recharge', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, result, 'Deposit approved');
  })
);

router.post(
  '/recharges/:id/reject',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({ body: z.object({ reason: z.string().min(3) }) }),
  asyncHandler(async (req, res) => {
    const recharge = await rechargeService.adminRejectRecharge(param(req, 'id'), req.user!.id, req.body.reason);
    await audit(req.user!.id, 'recharge.reject', 'recharge', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, { recharge }, 'Deposit rejected');
  })
);

router.get(
  '/withdrawals',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await withdrawalService.adminListWithdrawals({ skip, limit, status });
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.post(
  '/withdrawals/:id/approve',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({ body: z.object({ reason: z.string().min(3).optional() }) }),
  asyncHandler(async (req, res) => {
    const withdrawal = await withdrawalService.approveWithdrawal(param(req, 'id'), req.user!.id);
    await audit(req.user!.id, 'withdrawal.approve', 'withdrawal', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, { withdrawal }, 'Withdrawal approved');
  })
);

router.post(
  '/withdrawals/:id/reject',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({ body: z.object({ reason: z.string().min(3) }) }),
  asyncHandler(async (req, res) => {
    const withdrawal = await withdrawalService.rejectWithdrawal(param(req, 'id'), req.user!.id, req.body.reason);
    await audit(req.user!.id, 'withdrawal.reject', 'withdrawal', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, { withdrawal }, 'Withdrawal rejected');
  })
);

router.post(
  '/withdrawals/:id/mark-paid',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({ body: z.object({ payoutReference: z.string().min(3), reason: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const withdrawal = await withdrawalService.markWithdrawalPaid(
      param(req, 'id'),
      req.user!.id,
      req.body.payoutReference
    );
    await audit(req.user!.id, 'withdrawal.mark_paid', 'withdrawal', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, { withdrawal }, 'Withdrawal marked paid (demo)');
  })
);

router.post(
  '/withdrawals/:id/processing',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  asyncHandler(async (req, res) => {
    const withdrawal = await withdrawalService.markProcessing(param(req, 'id'), req.user!.id);
    return sendSuccess(res, { withdrawal }, 'Marked processing');
  })
);

router.get(
  '/referrals',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) return sendSuccess(res, { summary: null });
    const user = await User.findOne({
      $or: [{ email: q.toLowerCase() }, { mobile: q }, { referralCode: q.toUpperCase() }],
    });
    if (!user) throw ApiError.notFound('User not found');
    const summary = await referralService.getReferralSummary(user._id.toString());
    const team = await referralService.getTeamByLevel(user._id.toString(), undefined, { skip: 0, limit: 50 });
    return sendSuccess(res, { user: sanitizeUser(user), summary, team });
  })
);

router.get(
  '/commission-settings',
  asyncHandler(async (_req, res) => {
    const rules = await referralService.getCommissionRules();
    return sendSuccess(res, { rules });
  })
);

router.put(
  '/commission-settings',
  requireRoles('super_admin', 'admin'),
  validate({
    body: z.object({
      rules: z.array(
        z.object({
          level: z.number().int().min(1).max(10),
          percentage: z.number().min(0).max(100),
          eligibleEvent: z.string().optional(),
          minimumQualifyingAmount: z.number().min(0).optional(),
        })
      ),
    }),
  }),
  asyncHandler(async (req, res) => {
    const rules = await referralService.upsertCommissionRules(req.body.rules, req.user!.id);
    await audit(req.user!.id, 'commission.update', 'commission_rule', undefined, 'Versioned update', undefined, undefined, req.ip);
    return sendSuccess(res, { rules }, 'Commission rules updated');
  })
);

router.get(
  '/kyc',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await kycService.adminListKyc({ skip, limit, status });
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.post(
  '/kyc/:id/approve',
  requireRoles('super_admin', 'admin', 'kyc_manager'),
  asyncHandler(async (req, res) => {
    const kyc = await kycService.approveKyc(param(req, 'id'), req.user!.id);
    await audit(req.user!.id, 'kyc.approve', 'kyc', param(req, 'id'), undefined, undefined, undefined, req.ip);
    return sendSuccess(res, { kyc }, 'KYC approved');
  })
);

router.post(
  '/kyc/:id/reject',
  requireRoles('super_admin', 'admin', 'kyc_manager'),
  validate({ body: z.object({ reason: z.string().min(3) }) }),
  asyncHandler(async (req, res) => {
    const kyc = await kycService.rejectKyc(param(req, 'id'), req.user!.id, req.body.reason);
    await audit(req.user!.id, 'kyc.reject', 'kyc', param(req, 'id'), req.body.reason, undefined, undefined, req.ip);
    return sendSuccess(res, { kyc }, 'KYC rejected');
  })
);

router.get(
  '/support',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await supportService.adminListTickets({ skip, limit, status });
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.get(
  '/support/:id',
  asyncHandler(async (req, res) => {
    const data = await supportService.getTicket(req.user!.id, param(req, 'id'), true);
    return sendSuccess(res, data);
  })
);

router.post(
  '/support/:id/messages',
  requireRoles('super_admin', 'admin', 'support_manager'),
  validate({ body: z.object({ message: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const message = await supportService.replyToTicket({
      ticketId: param(req, 'id'),
      senderId: req.user!.id,
      senderRole: req.user!.role,
      message: req.body.message,
      isAdmin: true,
    });
    return sendSuccess(res, { message }, 'Reply sent', 201);
  })
);

router.patch(
  '/support/:id/status',
  requireRoles('super_admin', 'admin', 'support_manager'),
  validate({
    body: z.object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
      assignedTo: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const ticket = await supportService.updateTicketStatus(param(req, 'id'), req.body.status, req.body.assignedTo);
    return sendSuccess(res, { ticket }, 'Ticket updated');
  })
);

router.post(
  '/notifications',
  requireRoles('super_admin', 'admin'),
  validate({
    body: z.object({
      title: z.string().min(2),
      message: z.string().min(2),
      userIds: z.array(z.string()).optional(),
      statusFilter: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await notificationService.createAnnouncement(req.body);
    await audit(req.user!.id, 'notification.broadcast', 'notification', undefined, undefined, undefined, result as unknown as Record<string, unknown>, req.ip);
    return sendSuccess(res, result, 'Announcement sent', 201);
  })
);

router.get(
  '/payment-methods',
  asyncHandler(async (_req, res) => {
    const { listAllMethods } = await import('../services/paymentMethodService.js');
    const methods = await listAllMethods();
    return sendSuccess(res, { methods });
  })
);

router.put(
  '/payment-methods/:id',
  requireRoles('super_admin', 'admin', 'finance_manager'),
  validate({
    body: z.object({
      name: z.string().min(2).optional(),
      iconUrl: z.string().min(1).optional(),
      depositEnabled: z.boolean().optional(),
      withdrawEnabled: z.boolean().optional(),
      depositAddress: z.string().optional(),
      upiId: z.string().optional(),
      bankDetails: z
        .object({
          accountHolderName: z.string().optional(),
          accountNumber: z.string().optional(),
          ifscCode: z.string().optional(),
          bankName: z.string().optional(),
        })
        .optional(),
      depositInstructions: z.string().optional(),
      withdrawInstructions: z.string().optional(),
      minDeposit: z.number().optional(),
      maxDeposit: z.number().optional(),
      minWithdraw: z.number().optional(),
      maxWithdraw: z.number().optional(),
      depositFee: z.number().optional(),
      withdrawFee: z.number().optional(),
      sortOrder: z.number().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { upsertMethod } = await import('../services/paymentMethodService.js');
    const method = await upsertMethod(param(req, 'id'), req.body);
    await audit(req.user!.id, 'payment_method.update', 'payment_method', param(req, 'id'), undefined, undefined, req.body, req.ip);
    return sendSuccess(res, { method }, 'Payment method updated');
  })
);

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await getSettingsByCategory();
    // Never expose payment secrets
    delete (settings as Record<string, unknown>).razorpayKeySecret;
    delete (settings as Record<string, unknown>).razorpayWebhookSecret;
    return sendSuccess(res, { settings });
  })
);

router.put(
  '/settings',
  requireRoles('super_admin', 'admin'),
  validate({
    body: z.object({
      settings: z.array(
        z.object({
          key: z.string(),
          value: z.unknown(),
          category: z.string().optional(),
        })
      ),
    }),
  }),
  asyncHandler(async (req, res) => {
    for (const s of req.body.settings) {
      if (['razorpayKeySecret', 'razorpayWebhookSecret', 'RAZORPAY_KEY_SECRET'].includes(s.key)) {
        continue; // secrets only via env
      }
      await setSetting(s.key, s.value, req.user!.id, s.category || 'general');
    }
    await audit(req.user!.id, 'settings.update', 'app_settings', undefined, undefined, undefined, undefined, req.ip);
    return sendSuccess(res, await getSettingsByCategory(), 'Settings updated');
  })
);

router.get(
  '/reports/:type',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req, 50, 200);
    const type = param(req, 'type');
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { $gte: from } : {}),
              ...(to ? { $lte: to } : {}),
            },
          }
        : {};

    if (type === 'users') {
      const filter: Record<string, unknown> = { role: 'user', ...dateFilter };
      const [items, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash').lean(),
        User.countDocuments(filter),
      ]);
      return sendPaginated(res, items, { page, limit, total });
    }
    if (type === 'recharges') {
      const { items, total } = await rechargeService.adminListRecharges({
        skip,
        limit,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      return sendPaginated(res, items, { page, limit, total });
    }
    if (type === 'withdrawals') {
      const { items, total } = await withdrawalService.adminListWithdrawals({
        skip,
        limit,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      return sendPaginated(res, items, { page, limit, total });
    }
    if (type === 'investments') {
      const filter = { ...dateFilter };
      if (typeof req.query.status === 'string') (filter as Record<string, unknown>).status = req.query.status;
      const [items, total] = await Promise.all([
        InvestmentOrder.find(filter).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        InvestmentOrder.countDocuments(filter),
      ]);
      return sendPaginated(res, items, { page, limit, total });
    }
    throw ApiError.badRequest('Unknown report type');
  })
);

router.get(
  '/admin-users',
  requireRoles('super_admin'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = {
      role: { $in: ['admin', 'super_admin', 'finance_manager', 'support_manager', 'kyc_manager'] },
    };
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return sendPaginated(
      res,
      items.map((u) =>
        sanitizeUser({
          ...u,
          _id: u._id,
        } as unknown as import('../models/User.js').IUser)
      ),
      { page, limit, total }
    );
  })
);

router.post(
  '/admin-users',
  requireRoles('super_admin'),
  validate({
    body: z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      mobile: z.string().min(10),
      password: z.string().min(8),
      role: z.enum(['admin', 'finance_manager', 'support_manager', 'kyc_manager']),
      permissions: z.array(z.string()).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const exists = await User.findOne({
      $or: [{ email: req.body.email.toLowerCase() }, { mobile: req.body.mobile }],
    });
    if (exists) throw ApiError.conflict('Email or mobile already exists');
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      fullName: req.body.fullName,
      username: generateUsername(req.body.fullName),
      email: req.body.email.toLowerCase(),
      mobile: req.body.mobile,
      passwordHash,
      role: req.body.role,
      permissions: req.body.permissions || [],
      referralCode: generateReferralCode(),
      status: 'active',
    });
    await walletService.ensureUserWallets(user._id);
    await audit(req.user!.id, 'admin.create', 'user', user._id.toString(), undefined, undefined, undefined, req.ip);
    return sendSuccess(res, { user: sanitizeUser(user) }, 'Admin user created', 201);
  })
);

router.get(
  '/audit-logs',
  requireRoles('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      AdminAuditLog.find()
        .populate('adminId', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminAuditLog.countDocuments(),
    ]);
    return sendPaginated(res, items, { page, limit, total });
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { WalletTransaction } = await import('../models/WalletTransaction.js');
    const filter: Record<string, unknown> = {};
    if (typeof req.query.walletType === 'string') filter.walletType = req.query.walletType;
    if (typeof req.query.userId === 'string') filter.userId = req.query.userId;
    const [items, total] = await Promise.all([
      WalletTransaction.find(filter)
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);
    return sendPaginated(res, items, { page, limit, total });
  })
);

export default router;
