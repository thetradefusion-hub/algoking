import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { ensureUserWallets } from '../services/walletService.js';
import { generateReferralCode, generateUsername } from '../utils/ids.js';
import { ensureDefaultSettings } from '../services/settingsService.js';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const mobile = process.argv[4] || '9000000000';
  const fullName = process.argv[5] || 'AlgoKing Admin';

  if (!email || !password) {
    console.log('Usage: npm run create-admin -- <email> <password> [mobile] [fullName]');
    process.exit(1);
  }

  await connectDatabase();
  await ensureDefaultSettings();

  const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
  if (exists) {
    console.error('User with this email or mobile already exists');
    process.exit(1);
  }

  const user = await User.create({
    fullName,
    username: generateUsername(fullName),
    email: email.toLowerCase(),
    mobile,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'super_admin',
    permissions: ['*'],
    referralCode: generateReferralCode(),
    status: 'active',
    emailVerified: true,
  });
  await ensureUserWallets(user._id);
  console.log('Super admin created:', email);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
