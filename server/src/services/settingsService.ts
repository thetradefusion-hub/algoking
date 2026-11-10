import { AppSetting, DEFAULT_SETTINGS } from '../models/AppSetting.js';

export async function ensureDefaultSettings() {
  for (const setting of DEFAULT_SETTINGS) {
    await AppSetting.updateOne(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true }
    );
  }
}

export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T> {
  const doc = await AppSetting.findOne({ key }).lean();
  if (!doc) return fallback as T;
  return doc.value as T;
}

export async function getSettingsByCategory(category?: string) {
  const filter = category ? { category } : {};
  const docs = await AppSetting.find(filter).lean();
  return Object.fromEntries(docs.map((d) => [d.key, d.value]));
}

export async function setSetting(key: string, value: unknown, updatedBy?: string, category = 'general') {
  return AppSetting.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy, category } },
    { upsert: true, new: true }
  );
}

export async function getWalletLimits() {
  const [minRecharge, maxRecharge, minWithdrawal, maxWithdrawal, withdrawalFee, processingTime] =
    await Promise.all([
      getSetting<number>('minRecharge', 100),
      getSetting<number>('maxRecharge', 100000),
      getSetting<number>('minWithdrawal', 500),
      getSetting<number>('maxWithdrawal', 50000),
      getSetting<number>('withdrawalFee', 0),
      getSetting<string>('withdrawalProcessingTime', '1-3 business days'),
    ]);
  return { minRecharge, maxRecharge, minWithdrawal, maxWithdrawal, withdrawalFee, processingTime };
}

export type ProjectCurrency = 'INR' | 'USDT';

export async function getCurrencySettings() {
  const [projectCurrency, usdtInrRate, currency] = await Promise.all([
    getSetting<ProjectCurrency>('projectCurrency', 'INR'),
    getSetting<number>('usdtInrRate', 90),
    getSetting<string>('currency', 'INR'),
  ]);
  const rate = Number(usdtInrRate) > 0 ? Number(usdtInrRate) : 90;
  const active = (projectCurrency === 'USDT' ? 'USDT' : 'INR') as ProjectCurrency;
  return {
    projectCurrency: active,
    currency: currency || active,
    usdtInrRate: rate,
  };
}

/** Ledger amounts are stored in INR. Convert for display/calc helpers. */
export function inrToUsdt(amountInr: number, rate: number) {
  const r = Number(rate) > 0 ? Number(rate) : 90;
  return Number((Number(amountInr || 0) / r).toFixed(6));
}

export function usdtToInr(amountUsdt: number, rate: number) {
  const r = Number(rate) > 0 ? Number(rate) : 90;
  return Number((Number(amountUsdt || 0) * r).toFixed(2));
}
