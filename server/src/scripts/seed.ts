import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { CommissionRule } from '../models/CommissionRule.js';
import { ensureDefaultSettings } from '../services/settingsService.js';
import { ensureUserWallets, applyLedgerEntry } from '../services/walletService.js';
import { generateReferralCode, generateUsername } from '../utils/ids.js';
import { logger } from '../utils/logger.js';

async function seed() {
  await connectDatabase();
  await ensureDefaultSettings();
  const { seedPaymentMethods } = await import('../services/paymentMethodService.js');
  await seedPaymentMethods();
  logger.info('Payment methods seeded (BEP20, TRC20, INR UPI, INR Bank)');

  const adminEmail = env.SUPER_ADMIN_EMAIL || 'admin@algoking.local';
  const adminPassword = env.SUPER_ADMIN_PASSWORD || 'Admin@12345';
  const adminMobile = env.SUPER_ADMIN_MOBILE || '9999999999';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      fullName: env.SUPER_ADMIN_NAME || 'AlgoKing Super Admin',
      username: generateUsername('superadmin'),
      email: adminEmail,
      mobile: adminMobile,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'super_admin',
      permissions: ['*'],
      referralCode: generateReferralCode(),
      status: 'active',
      emailVerified: true,
      mobileVerified: true,
    });
    await ensureUserWallets(admin._id);
    logger.info({ email: adminEmail }, 'Super admin created');
  } else {
    logger.info('Super admin already exists');
  }

  // Demo investor
  const demoEmail = 'investor@algoking.local';
  let investor = await User.findOne({ email: demoEmail });
  if (!investor) {
    investor = await User.create({
      fullName: 'Demo Investor',
      username: generateUsername('demoinvestor'),
      email: demoEmail,
      mobile: '9888888888',
      passwordHash: await bcrypt.hash('Investor@123', 12),
      role: 'user',
      referralCode: 'DEMOKING1',
      status: 'active',
      emailVerified: true,
      mobileVerified: true,
      referredBy: undefined,
    });
    await ensureUserWallets(investor._id);
    // Seed demo main wallet balance for testing purchases
    await applyLedgerEntry({
      userId: investor._id.toString(),
      walletType: 'main',
      type: 'credit',
      amount: 10000,
      description: 'Demo seed credit',
      referenceType: 'seed',
      idempotencyKey: 'seed-demo-main-10000',
    });
    await applyLedgerEntry({
      userId: investor._id.toString(),
      walletType: 'income',
      type: 'credit',
      amount: 2000,
      description: 'Demo income seed',
      referenceType: 'seed',
      idempotencyKey: 'seed-demo-income-2000',
    });
    logger.info({ email: demoEmail }, 'Demo investor created with wallets');
  }

  const planCount = await Plan.countDocuments();
  if (planCount === 0) {
    await Plan.insertMany([
      {
        name: 'Starter Growth',
        slug: 'starter-growth',
        description: 'Starter investment plan',
        investmentAmount: 1000,
        durationDays: 30,
        projectedDailyIncome: 20,
        projectedTotalIncome: 600,
        status: 'active',
        purchaseLimit: 5,
        sortOrder: 1,
      },
      {
        name: 'Prime Builder',
        slug: 'prime-builder',
        description: 'Prime investment plan',
        investmentAmount: 5000,
        durationDays: 60,
        projectedDailyIncome: 120,
        projectedTotalIncome: 7200,
        status: 'active',
        purchaseLimit: 3,
        sortOrder: 2,
      },
      {
        name: 'Royal Wealth',
        slug: 'royal-wealth',
        description: 'Royal investment plan',
        investmentAmount: 10000,
        durationDays: 90,
        projectedDailyIncome: 280,
        projectedTotalIncome: 25200,
        status: 'active',
        purchaseLimit: 2,
        sortOrder: 3,
      },
    ]);
    logger.info('Demo investment plans seeded');
  }

  const ruleCount = await CommissionRule.countDocuments();
  if (ruleCount === 0) {
    await CommissionRule.insertMany([
      {
        level: 1,
        percentage: 10,
        eligibleEvent: 'investment_purchase',
        minimumQualifyingAmount: 0,
        status: 'active',
        version: 1,
        effectiveFrom: new Date(),
      },
      {
        level: 2,
        percentage: 5,
        eligibleEvent: 'investment_purchase',
        minimumQualifyingAmount: 0,
        status: 'active',
        version: 1,
        effectiveFrom: new Date(),
      },
      {
        level: 3,
        percentage: 2,
        eligibleEvent: 'investment_purchase',
        minimumQualifyingAmount: 0,
        status: 'active',
        version: 1,
        effectiveFrom: new Date(),
      },
    ]);
    logger.info('Commission rules seeded (demo defaults)');
  }

  logger.info('Seed complete');
  logger.info(`Admin login: ${adminEmail} / ${adminPassword}`);
  logger.info('Investor login: investor@algoking.local / Investor@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
