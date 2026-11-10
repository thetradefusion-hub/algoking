import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { param } from '../utils/params.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import * as dashboardService from '../services/dashboardService.js';
import * as planService from '../services/planService.js';
import * as walletService from '../services/walletService.js';
import * as rechargeService from '../services/rechargeService.js';
import * as withdrawalService from '../services/withdrawalService.js';
import * as referralService from '../services/referralService.js';
import * as kycService from '../services/kycService.js';
import * as bankService from '../services/bankService.js';
import * as notificationService from '../services/notificationService.js';
import * as supportService from '../services/supportService.js';
import { getSettingsByCategory, getWalletLimits } from '../services/settingsService.js';
import { changePasswordSchema } from '../validators/authValidators.js';
import * as authService from '../services/authService.js';

const router = Router();
router.use(authenticate);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw ApiError.notFound('User not found');
    const kyc = await kycService.getKycStatus(req.user!.id);
    return sendSuccess(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        referralCode: user.referralCode,
        status: user.status,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        kycStatus: kyc.status,
      },
    });
  })
);

router.put(
  '/profile',
  validate({
    body: z.object({
      fullName: z.string().min(2).max(120).optional(),
      profileImage: z.string().url().optional().or(z.literal('')),
    }),
  }),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: { ...(req.body.fullName && { fullName: req.body.fullName }), ...(req.body.profileImage !== undefined && { profileImage: req.body.profileImage || undefined }) } },
      { new: true }
    );
    return sendSuccess(res, { user: authService.sanitizeUser(user!) }, 'Profile updated');
  })
);

router.put(
  '/change-password',
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, null, 'Password changed');
  })
);

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await dashboardService.getUserDashboard(req.user!.id);
    return sendSuccess(res, data);
  })
);

export default router;

// ---- Plans (public list + auth purchase) ----
export const planRouter = Router();

planRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const plans = await planService.listActivePlans();
    return sendSuccess(res, { plans });
  })
);

planRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const plan = await planService.getPlanById(param(req, 'id'));
    return sendSuccess(res, { plan });
  })
);

export const orderRouter = Router();
orderRouter.use(authenticate);

orderRouter.post(
  '/',
  validate({
    body: z.object({
      planId: z.string().min(1),
      idempotencyKey: z.string().min(8).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await planService.purchasePlan(req.user!.id, req.body.planId, req.body.idempotencyKey);
    return sendSuccess(res, result, result.duplicated ? 'Order already processed' : 'Investment purchased', result.duplicated ? 200 : 201);
  })
);

orderRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await planService.listUserOrders(req.user!.id, { skip, limit, status });
    return sendPaginated(res, items, { page, limit, total });
  })
);

orderRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await planService.getUserOrder(req.user!.id, param(req, 'id'));
    return sendSuccess(res, { order });
  })
);

export const walletRouter = Router();
walletRouter.use(authenticate);

walletRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const wallets = await walletService.getUserWallets(req.user!.id);
    const limits = await getWalletLimits();
    return sendSuccess(res, { wallets, limits });
  })
);

walletRouter.get(
  '/:walletType',
  asyncHandler(async (req, res) => {
    const type = param(req, 'walletType') as 'main' | 'income' | 'referral';
    if (!['main', 'income', 'referral'].includes(type)) throw ApiError.badRequest('Invalid wallet type');
    const wallet = await walletService.getWalletByType(req.user!.id, type);
    return sendSuccess(res, { wallet });
  })
);

walletRouter.get(
  '/:walletType/transactions',
  asyncHandler(async (req, res) => {
    const type = param(req, 'walletType') as 'main' | 'income' | 'referral';
    if (!['main', 'income', 'referral'].includes(type)) throw ApiError.badRequest('Invalid wallet type');
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await walletService.getWalletTransactions(req.user!.id, type, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

export const rechargeRouter = Router();
rechargeRouter.use(authenticate);

rechargeRouter.post(
  '/',
  validate({
    body: z.object({
      amount: z.number().positive(),
      idempotencyKey: z.string().min(8).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await rechargeService.initiateRecharge(req.user!.id, req.body.amount, req.body.idempotencyKey);
    return sendSuccess(res, result, 'Deposit initiated', 201);
  })
);

rechargeRouter.post(
  '/manual',
  validate({
    body: z.object({
      amount: z.number().positive(),
      paymentMethodId: z.string().min(1),
      proofReference: z.string().min(4).max(200),
      userNote: z.string().max(500).optional(),
      idempotencyKey: z.string().min(8).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await rechargeService.submitManualDeposit(req.user!.id, req.body);
    return sendSuccess(res, result, 'Deposit submitted for admin approval', 201);
  })
);

rechargeRouter.post(
  '/verify-demo',
  validate({
    body: z.object({ providerOrderId: z.string().min(1) }),
  }),
  asyncHandler(async (req, res) => {
    const result = await rechargeService.verifyDemoPayment(req.user!.id, req.body.providerOrderId);
    return sendSuccess(res, result, 'Payment verified and wallet credited');
  })
);

rechargeRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await rechargeService.listUserRecharges(req.user!.id, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

rechargeRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { RechargeRequest } = await import('../models/RechargeRequest.js');
    const item = await RechargeRequest.findOne({ _id: param(req, 'id'), userId: req.user!.id }).lean();
    if (!item) throw ApiError.notFound('Recharge not found');
    return sendSuccess(res, { recharge: item });
  })
);

export const withdrawalRouter = Router();
withdrawalRouter.use(authenticate);

withdrawalRouter.post(
  '/',
  validate({
    body: z.object({
      amount: z.number().positive(),
      walletType: z.enum(['main', 'income', 'referral']).default('income'),
      paymentMethodId: z.string().min(1).optional(),
      bankAccountId: z.string().min(1).optional(),
      destinationAddress: z.string().min(8).max(200).optional(),
      destinationUpi: z.string().min(3).max(100).optional(),
      idempotencyKey: z.string().min(8).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await withdrawalService.requestWithdrawal(req.user!.id, req.body.amount, {
      walletType: req.body.walletType,
      paymentMethodId: req.body.paymentMethodId,
      bankAccountId: req.body.bankAccountId,
      destinationAddress: req.body.destinationAddress,
      destinationUpi: req.body.destinationUpi,
      idempotencyKey: req.body.idempotencyKey,
    });
    return sendSuccess(res, result, 'Withdrawal requested', 201);
  })
);

withdrawalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await withdrawalService.listUserWithdrawals(req.user!.id, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

withdrawalRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { WithdrawalRequest } = await import('../models/WithdrawalRequest.js');
    const item = await WithdrawalRequest.findOne({ _id: param(req, 'id'), userId: req.user!.id })
      .populate('bankAccountId', 'accountHolderName accountNumberLast4 ifscCode bankName')
      .lean();
    if (!item) throw ApiError.notFound('Withdrawal not found');
    return sendSuccess(res, { withdrawal: item });
  })
);

export const referralRouter = Router();
referralRouter.use(authenticate);

referralRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const data = await referralService.getReferralSummary(req.user!.id);
    return sendSuccess(res, data);
  })
);

referralRouter.get(
  '/team',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const level = req.query.level ? Number(req.query.level) : undefined;
    const { items, total } = await referralService.getTeamByLevel(req.user!.id, level, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

referralRouter.get(
  '/team/:level',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const level = Number(param(req, 'level'));
    const { items, total } = await referralService.getTeamByLevel(req.user!.id, level, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

referralRouter.get(
  '/commissions',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await referralService.getCommissions(req.user!.id, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

export const kycRouter = Router();
kycRouter.use(authenticate);

kycRouter.post(
  '/',
  validate({
    body: z.object({
      fullName: z.string().min(2),
      dateOfBirth: z.string().optional(),
      panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'Invalid PAN'),
      bankAccountHolder: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      documentPaths: z.array(z.string()).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const kyc = await kycService.submitKyc(req.user!.id, req.body);
    return sendSuccess(res, { kyc }, 'KYC submitted', 201);
  })
);

kycRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await kycService.getKycStatus(req.user!.id);
    return sendSuccess(res, data);
  })
);

kycRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    const data = await kycService.getKycStatus(req.user!.id);
    return sendSuccess(res, data);
  })
);

export const bankRouter = Router();
bankRouter.use(authenticate);

bankRouter.post(
  '/',
  validate({
    body: z.object({
      accountHolderName: z.string().min(2),
      accountNumber: z.string().min(9).max(18),
      ifscCode: z.string().min(11).max(11),
      bankName: z.string().min(2),
      isPrimary: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const account = await bankService.addBankAccount(req.user!.id, req.body);
    return sendSuccess(res, { account }, 'Bank account added', 201);
  })
);

bankRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await bankService.listBankAccounts(req.user!.id);
    return sendSuccess(res, { accounts });
  })
);

bankRouter.put(
  '/:id',
  validate({
    body: z.object({
      accountHolderName: z.string().min(2).optional(),
      bankName: z.string().min(2).optional(),
      ifscCode: z.string().min(11).max(11).optional(),
      isPrimary: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const account = await bankService.updateBankAccount(req.user!.id, param(req, 'id'), req.body);
    return sendSuccess(res, { account }, 'Bank account updated');
  })
);

bankRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await bankService.deleteBankAccount(req.user!.id, param(req, 'id'));
    return sendSuccess(res, result, 'Bank account removed');
  })
);

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await notificationService.listNotifications(req.user!.id, { skip, limit });
    return sendPaginated(res, items, { page, limit, total }, 'Success');
  })
);

notificationRouter.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user!.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  })
);

notificationRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const item = await notificationService.markRead(req.user!.id, param(req, 'id'));
    return sendSuccess(res, { notification: item });
  })
);

export const supportRouter = Router();
supportRouter.use(authenticate);

supportRouter.post(
  '/tickets',
  validate({
    body: z.object({
      subject: z.string().min(3).max(200),
      category: z.string().min(2),
      message: z.string().min(5),
      attachments: z.array(z.string()).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const ticket = await supportService.createTicket(req.user!.id, req.body);
    return sendSuccess(res, { ticket }, 'Ticket created', 201);
  })
);

supportRouter.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await supportService.listUserTickets(req.user!.id, { skip, limit });
    return sendPaginated(res, items, { page, limit, total });
  })
);

supportRouter.get(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const data = await supportService.getTicket(req.user!.id, param(req, 'id'));
    return sendSuccess(res, data);
  })
);

supportRouter.post(
  '/tickets/:id/messages',
  validate({ body: z.object({ message: z.string().min(1), attachments: z.array(z.string()).optional() }) }),
  asyncHandler(async (req, res) => {
    const msg = await supportService.replyToTicket({
      ticketId: param(req, 'id'),
      senderId: req.user!.id,
      senderRole: 'user',
      message: req.body.message,
      attachments: req.body.attachments,
      userId: req.user!.id,
    });
    return sendSuccess(res, { message: msg }, 'Reply sent', 201);
  })
);

export const paymentMethodRouter = Router();
paymentMethodRouter.use(authenticate);
paymentMethodRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { listActiveMethods } = await import('../services/paymentMethodService.js');
    const forDeposit = req.query.for === 'deposit';
    const forWithdraw = req.query.for === 'withdraw';
    const methods = await listActiveMethods({
      forDeposit: forDeposit || undefined,
      forWithdraw: forWithdraw || undefined,
    });
    return sendSuccess(res, { methods });
  })
);

export const publicContentRouter = Router();
publicContentRouter.get(
  '/settings/public',
  asyncHandler(async (_req, res) => {
    const general = await getSettingsByCategory('general');
    const content = await getSettingsByCategory('content');
    const { getCurrencySettings, getWalletLimits } = await import('../services/settingsService.js');
    const currencySettings = await getCurrencySettings();
    const walletLimits = await getWalletLimits();
    return sendSuccess(res, {
      platformName: general.platformName,
      tagline: general.tagline,
      supportEmail: general.supportEmail,
      supportPhone: general.supportPhone,
      whatsappSupport: general.whatsappSupport || '',
      telegramSupport: general.telegramSupport || '',
      timezone: general.timezone || 'Asia/Kolkata',
      currency: currencySettings.projectCurrency,
      projectCurrency: currencySettings.projectCurrency,
      usdtInrRate: currencySettings.usdtInrRate,
      maintenanceMode: !!general.maintenanceMode,
      registrationOpen: general.registrationOpen !== false,
      terms: content.terms,
      privacy: content.privacy,
      dashboardBanner: content.dashboardBanner,
      riskDisclaimer: content.riskDisclaimer || '',
      wallet: walletLimits,
    });
  })
);
