import { format, formatDistanceToNow } from 'date-fns'
import {
  getCurrencyConfig,
  inrToUsdt,
  type ProjectCurrency,
  usdtToInr,
} from '@/lib/currencyStore'

/** Always format as INR (rupees), ignoring project currency. Uses "Rs. " + spaced amount. */
export function formatAsINR(amount?: number | null) {
  const valueInr = Number(amount || 0)
  const number = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(valueInr)
  return `Rs. ${number}`
}

/**
 * Format ledger amount (stored in INR) using project currency setting.
 * Kept as formatINR for existing call sites across the app.
 */
export function formatINR(amount?: number | null) {
  return formatMoney(amount)
}

export function formatUSDT(amount?: number | null) {
  const value = Number(amount || 0)
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} USDT`
}

/** Format ledger amount (stored in INR) using project currency setting. */
export function formatMoney(amount?: number | null, forceCurrency?: ProjectCurrency) {
  const { projectCurrency, usdtInrRate } = getCurrencyConfig()
  const currency = forceCurrency || projectCurrency
  const valueInr = Number(amount || 0)

  if (currency === 'USDT') {
    return formatUSDT(inrToUsdt(valueInr, usdtInrRate))
  }

  return formatAsINR(valueInr)
}

/** Show primary + conversion hint, e.g. "Rs. 9,000 · ≈ 100 USDT" */
export function formatMoneyWithConversion(amountInr?: number | null) {
  const { projectCurrency, usdtInrRate } = getCurrencyConfig()
  const value = Number(amountInr || 0)
  const primary = formatMoney(value)
  if (projectCurrency === 'USDT') {
    return `${primary} · ≈ ${formatAsINR(value)}`
  }
  return `${primary} · ≈ ${formatUSDT(inrToUsdt(value, usdtInrRate))}`
}

/** Only the alternate currency (for secondary labels under a primary balance). */
export function formatAlternateCurrency(amountInr?: number | null) {
  const { projectCurrency, usdtInrRate } = getCurrencyConfig()
  const value = Number(amountInr || 0)
  if (projectCurrency === 'USDT') return `≈ ${formatAsINR(value)}`
  return `≈ ${formatUSDT(inrToUsdt(value, usdtInrRate))}`
}

export function formatUsdtAmountAsProject(amountUsdt?: number | null) {
  const { projectCurrency, usdtInrRate } = getCurrencyConfig()
  const usdt = Number(amountUsdt || 0)
  if (projectCurrency === 'USDT') return formatUSDT(usdt)
  return formatAsINR(usdtToInr(usdt, usdtInrRate))
}

export function getUsdtInrRate() {
  return getCurrencyConfig().usdtInrRate
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '—'
  return format(new Date(value), 'dd MMM yyyy, hh:mm a')
}

export function formatShortDate(value?: string | Date | null) {
  if (!value) return '—'
  return format(new Date(value), 'dd MMM yyyy')
}

export function fromNow(value?: string | Date | null) {
  if (!value) return ''
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}
