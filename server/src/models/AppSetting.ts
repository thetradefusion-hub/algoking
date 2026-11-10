import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAppSetting extends Document {
  key: string;
  value: unknown;
  category: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appSettingSchema = new Schema<IAppSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: { type: String, required: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AppSetting = mongoose.model<IAppSetting>('AppSetting', appSettingSchema);

export const DEFAULT_SETTINGS: Array<{ key: string; value: unknown; category: string }> = [
  { key: 'platformName', value: 'AlgoKing', category: 'general' },
  { key: 'tagline', value: 'Grow Your Future.', category: 'general' },
  { key: 'supportEmail', value: 'support@algoking.local', category: 'general' },
  { key: 'supportPhone', value: '+91-0000000000', category: 'general' },
  { key: 'whatsappSupport', value: '', category: 'general' },
  { key: 'telegramSupport', value: '', category: 'general' },
  { key: 'currency', value: 'INR', category: 'general' },
  { key: 'projectCurrency', value: 'INR', category: 'general' },
  { key: 'usdtInrRate', value: 90, category: 'general' },
  { key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
  { key: 'maintenanceMode', value: false, category: 'general' },
  { key: 'registrationOpen', value: true, category: 'general' },
  { key: 'minRecharge', value: 100, category: 'wallet' },
  { key: 'maxRecharge', value: 100000, category: 'wallet' },
  { key: 'minWithdrawal', value: 500, category: 'wallet' },
  { key: 'maxWithdrawal', value: 50000, category: 'wallet' },
  { key: 'withdrawalFee', value: 0, category: 'wallet' },
  { key: 'withdrawalProcessingTime', value: '1-3 business days', category: 'wallet' },
  { key: 'paymentGatewayMode', value: 'DEMO', category: 'payment' },
  {
    key: 'terms',
    value: 'AlgoKing demo terms. All activity is simulated until compliance approval.',
    category: 'content',
  },
  {
    key: 'privacy',
    value: 'AlgoKing privacy policy placeholder. Do not collect unnecessary personal data.',
    category: 'content',
  },
  {
    key: 'dashboardBanner',
    value: 'Welcome to AlgoKing — Grow Your Future. Demo mode active.',
    category: 'content',
  },
  {
    key: 'riskDisclaimer',
    value: 'Projected income is illustrative and non-guaranteed. Invest only what you can afford.',
    category: 'content',
  },
];
