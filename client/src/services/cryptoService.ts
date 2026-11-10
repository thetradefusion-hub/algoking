import {
  BINANCE_SYMBOLS,
  CRYPTO_ASSETS,
  getCryptoByBinanceSymbol,
  type CryptoAsset,
} from '@/lib/cryptoMarkets'

export type CryptoMarketQuote = {
  id: string
  symbol: string
  name: string
  image: string
  binanceSymbol: string
  tradingViewSymbol: string
  color: string
  currentPrice: number
  priceChange24h: number
  priceChangePct24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  marketCap?: number
  lastUpdated?: string
  flash?: 'up' | 'down' | null
}

type BinanceTicker24h = {
  symbol: string
  lastPrice: string
  priceChange: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  closeTime: number
}

type BinanceWsTicker = {
  s: string
  c: string
  P: string
  p: string
  h: string
  l: string
  v: string
  q: string
  E: number
}

type CoinGeckoMarket = {
  id: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  high_24h: number
  low_24h: number
  total_volume: number
  market_cap: number
  last_updated?: string
}

const CACHE_KEY = 'ak_crypto_markets_v1'

export function marketPlaceholders(): CryptoMarketQuote[] {
  return CRYPTO_ASSETS.map((asset) => fromAsset(asset))
}

export function readMarketsCache(): CryptoMarketQuote[] | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CryptoMarketQuote[]
    if (!Array.isArray(parsed) || !parsed.length) return undefined
    return parsed.map((row) => ({ ...row, flash: null }))
  } catch {
    return undefined
  }
}

export function writeMarketsCache(rows: CryptoMarketQuote[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(rows.map(({ flash: _f, ...rest }) => rest))
    )
  } catch {
    /* ignore quota */
  }
}

function fromAsset(asset: CryptoAsset, ticker?: Partial<BinanceTicker24h>): CryptoMarketQuote {
  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    image: asset.image,
    binanceSymbol: asset.binanceSymbol,
    tradingViewSymbol: asset.tradingViewSymbol,
    color: asset.color,
    currentPrice: Number(ticker?.lastPrice || 0),
    priceChange24h: Number(ticker?.priceChange || 0),
    priceChangePct24h: Number(ticker?.priceChangePercent || 0),
    high24h: Number(ticker?.highPrice || 0),
    low24h: Number(ticker?.lowPrice || 0),
    volume24h: Number(ticker?.volume || 0),
    quoteVolume24h: Number(ticker?.quoteVolume || 0),
    lastUpdated: ticker?.closeTime ? new Date(ticker.closeTime).toISOString() : undefined,
    flash: null,
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

async function fetchFromBinance(): Promise<CryptoMarketQuote[]> {
  const symbols = encodeURIComponent(JSON.stringify(BINANCE_SYMBOLS))
  // data-api.binance.vision is often more reachable than api.binance.com
  const urls = [
    `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${symbols}`,
    `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`,
  ]

  let lastError: unknown
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`binance ${res.status}`)
      const data = (await res.json()) as BinanceTicker24h[]
      const bySymbol = new Map(data.map((t) => [t.symbol, t]))
      const rows = CRYPTO_ASSETS.map((asset) => fromAsset(asset, bySymbol.get(asset.binanceSymbol)))
      if (rows.some((r) => r.currentPrice > 0)) return rows
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('binance failed')
}

async function fetchFromCoinGecko(): Promise<CryptoMarketQuote[]> {
  const ids = CRYPTO_ASSETS.map((c) => c.id).join(',')
  const url =
    `https://api.coingecko.com/api/v3/coins/markets` +
    `?vs_currency=usd&ids=${encodeURIComponent(ids)}` +
    `&order=market_cap_desc&sparkline=false&price_change_percentage=24h`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('coingecko failed')
  const data = (await res.json()) as CoinGeckoMarket[]
  const byId = new Map(data.map((row) => [row.id, row]))

  return CRYPTO_ASSETS.map((asset) => {
    const row = byId.get(asset.id)
    return {
      ...fromAsset(asset),
      currentPrice: Number(row?.current_price || 0),
      priceChange24h: Number(row?.price_change_24h || 0),
      priceChangePct24h: Number(row?.price_change_percentage_24h || 0),
      high24h: Number(row?.high_24h || 0),
      low24h: Number(row?.low_24h || 0),
      volume24h: Number(row?.total_volume || 0),
      quoteVolume24h: Number(row?.total_volume || 0),
      marketCap: Number(row?.market_cap || 0),
      lastUpdated: row?.last_updated,
      flash: null,
    }
  })
}

/** Fast first paint: Binance (3s) → CoinGecko fallback. */
export async function fetchCryptoMarkets(): Promise<CryptoMarketQuote[]> {
  try {
    const rows = await withTimeout(fetchFromBinance(), 3000)
    writeMarketsCache(rows)
    return rows
  } catch {
    const rows = await fetchFromCoinGecko()
    writeMarketsCache(rows)
    return rows
  }
}

export function mergeLiveTicker(
  prev: CryptoMarketQuote[],
  msg: BinanceWsTicker
): CryptoMarketQuote[] {
  const asset = getCryptoByBinanceSymbol(msg.s)
  if (!asset) return prev

  const nextPrice = Number(msg.c)
  const idx = prev.findIndex((p) => p.binanceSymbol === msg.s)
  const base = idx >= 0 ? prev[idx] : fromAsset(asset)

  let flash: 'up' | 'down' | null = null
  if (base.currentPrice > 0 && nextPrice !== base.currentPrice) {
    flash = nextPrice > base.currentPrice ? 'up' : 'down'
  }

  const updated: CryptoMarketQuote = {
    ...base,
    currentPrice: nextPrice,
    priceChange24h: Number(msg.p),
    priceChangePct24h: Number(msg.P),
    high24h: Number(msg.h),
    low24h: Number(msg.l),
    volume24h: Number(msg.v),
    quoteVolume24h: Number(msg.q),
    lastUpdated: new Date(msg.E || Date.now()).toISOString(),
    flash,
  }

  if (idx < 0) return [...prev, updated]
  const copy = prev.slice()
  copy[idx] = updated
  return copy
}

export function formatUsdPrice(value?: number | null) {
  const n = Number(value || 0)
  if (!n) return '—'
  if (n >= 1000) {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (n >= 1) {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
  }
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`
}

export function formatCompactUsd(value?: number | null) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(n)
}

export function binanceWsUrl() {
  const streams = BINANCE_SYMBOLS.map((s) => `${s.toLowerCase()}@ticker`).join('/')
  return `wss://stream.binance.com:9443/stream?streams=${streams}`
}
