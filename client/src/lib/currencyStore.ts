export type ProjectCurrency = 'INR' | 'USDT'

export type CurrencyConfig = {
  projectCurrency: ProjectCurrency
  usdtInrRate: number
}

const DEFAULT_CONFIG: CurrencyConfig = {
  projectCurrency: 'INR',
  usdtInrRate: 90,
}

let config: CurrencyConfig = { ...DEFAULT_CONFIG }
const listeners = new Set<() => void>()

export function getCurrencyConfig() {
  return config
}

export function setCurrencyConfig(next: Partial<CurrencyConfig>) {
  const rate = Number(next.usdtInrRate)
  config = {
    projectCurrency:
      next.projectCurrency !== undefined
        ? next.projectCurrency === 'USDT'
          ? 'USDT'
          : 'INR'
        : config.projectCurrency,
    usdtInrRate: rate > 0 ? rate : config.usdtInrRate || DEFAULT_CONFIG.usdtInrRate,
  }
  listeners.forEach((fn) => fn())
}

export function subscribeCurrency(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Ledger amounts are treated as INR base. */
export function inrToUsdt(amountInr?: number | null, rate = config.usdtInrRate) {
  const r = Number(rate) > 0 ? Number(rate) : DEFAULT_CONFIG.usdtInrRate
  return Number((Number(amountInr || 0) / r).toFixed(6))
}

export function usdtToInr(amountUsdt?: number | null, rate = config.usdtInrRate) {
  const r = Number(rate) > 0 ? Number(rate) : DEFAULT_CONFIG.usdtInrRate
  return Number((Number(amountUsdt || 0) * r).toFixed(2))
}
