import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CandlestickChart,
  Clock3,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react'
import { TradingViewChart } from '@/components/user/TradingViewChart'
import { LiveDot, LivePrice } from '@/components/user/LivePrice'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCryptoById, CRYPTO_ASSETS } from '@/lib/cryptoMarkets'
import { useLiveCryptoQuote } from '@/hooks/useLiveCryptoMarkets'
import { formatCompactUsd, formatUsdPrice } from '@/services/cryptoService'
import { cn } from '@/lib/utils'

export function CryptoDetailPage() {
  const { id = '' } = useParams()
  const meta = getCryptoById(id)
  const { quote, isPending, isError, isLive, hasPrices } = useLiveCryptoQuote(id)

  const symbol = meta?.symbol || quote?.symbol || id.toUpperCase()
  const name = meta?.name || quote?.name || symbol
  const tvSymbol = meta?.tradingViewSymbol || quote?.tradingViewSymbol || `BINANCE:${symbol}USDT`
  const color = meta?.color || quote?.color || '#0066FF'
  const image = quote?.image || meta?.image
  const up = (quote?.priceChangePct24h || 0) >= 0
  const rangePct =
    quote && quote.high24h > quote.low24h
      ? ((quote.currentPrice - quote.low24h) / (quote.high24h - quote.low24h)) * 100
      : 50

  const related = CRYPTO_ASSETS.filter((c) => c.id !== meta?.id && c.id !== quote?.id).slice(0, 6)

  if (!meta && !isPending && !quote) {
    return (
      <div className="space-y-4 p-4">
        <Link to="/markets" className="text-sm font-semibold text-brand-primary">
          ← Markets
        </Link>
        <div className="ak-card p-4 text-sm text-brand-muted">Crypto asset not found.</div>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <div
        className="relative overflow-hidden px-4 pb-14 pt-5 text-white"
        style={{
          background: `linear-gradient(145deg, ${color} 0%, #0052CC 52%, #001B3D 100%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-6 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/markets"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90"
          >
            <ArrowLeft className="h-4 w-4" /> Markets
          </Link>
          <LiveDot connected={isLive} />
        </div>

        <div className="relative z-10 mt-5 flex items-start gap-3">
          {image ? (
            <img
              src={image}
              alt=""
              className="h-14 w-14 rounded-2xl bg-white/15 object-contain p-2 ring-1 ring-white/25"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold ring-1 ring-white/25">
              {symbol.slice(0, 3)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {symbol} / USDT
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">{name}</h1>
            {isPending && !hasPrices && !quote?.currentPrice ? (
              <Skeleton className="mt-2 h-9 w-40 bg-white/20" />
            ) : (
              <div className="mt-1.5">
                <LivePrice
                  price={quote?.currentPrice}
                  flash={quote?.flash}
                  size="xl"
                  tone="light"
                  className="!px-0"
                />
                {quote ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                        up ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'
                      )}
                    >
                      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {up ? '+' : ''}
                      {quote.priceChangePct24h.toFixed(2)}%
                    </span>
                    <span className="text-xs text-white/75">
                      {up ? '+' : ''}
                      {formatUsdPrice(quote.priceChange24h).replace('$', '')} · 24h
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-8 space-y-4 px-4">
        <div className="ak-card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              24h Range
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted">
              <Activity className="h-3.5 w-3.5 text-brand-primary" />
              Streaming
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
            <span className="text-brand-danger">{quote ? formatUsdPrice(quote.low24h) : '—'}</span>
            <span className="text-brand-success">{quote ? formatUsdPrice(quote.high24h) : '—'}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-brand-bg">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-danger via-brand-gold to-brand-success"
              style={{ width: '100%', opacity: 0.35 }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow"
              style={{ left: `calc(${Math.min(Math.max(rangePct, 4), 96)}% - 7px)` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="24h High"
            value={quote ? formatUsdPrice(quote.high24h) : '—'}
            loading={isPending && !hasPrices}
          />
          <Stat
            icon={<TrendingDown className="h-4 w-4" />}
            label="24h Low"
            value={quote ? formatUsdPrice(quote.low24h) : '—'}
            loading={isPending && !hasPrices}
          />
          <Stat
            icon={<Waves className="h-4 w-4" />}
            label="24h Volume"
            value={quote ? formatCompactUsd(quote.quoteVolume24h || quote.volume24h) : '—'}
            loading={isPending && !hasPrices}
          />
          <Stat
            icon={<Clock3 className="h-4 w-4" />}
            label="Last tick"
            value={
              quote?.lastUpdated
                ? new Date(quote.lastUpdated).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '—'
            }
            loading={isPending && !hasPrices}
          />
        </div>

        {isError ? (
          <div className="rounded-2xl bg-brand-danger/10 px-3 py-2 text-xs text-brand-danger">
            Live feed interrupted. Chart still works — reconnecting automatically.
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-brand-text">
              <CandlestickChart className="h-4 w-4 text-brand-primary" />
              Live Chart
            </h2>
            <span className="text-[11px] font-medium text-brand-muted">TradingView · 15m</span>
          </div>
          <TradingViewChart symbol={tvSymbol} height={440} />
        </div>

        <div>
          <h3 className="mb-2 px-0.5 text-sm font-bold text-brand-text">Also trending</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {related.map((coin) => (
              <Link
                key={coin.id}
                to={`/markets/${coin.id}`}
                className="ak-card flex min-w-[118px] flex-col items-center gap-1.5 p-3 text-center"
              >
                <img src={coin.image} alt="" className="h-8 w-8 rounded-full object-contain" />
                <p className="text-xs font-bold text-brand-text">{coin.symbol}</p>
                <p className="text-[10px] text-brand-muted">{coin.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-[calc(4.35rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-brand-primary/10 bg-white/95 px-4 py-2.5 shadow-[0_-10px_28px_rgba(0,27,61,0.1)] backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-brand-muted">{name} live price</span>
          <LivePrice price={quote?.currentPrice} flash={quote?.flash} size="sm" />
        </div>
        <Link to="/plans">
          <Button className="w-full" size="lg">
            Invest Now
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  loading,
  icon,
}: {
  label: string
  value: string
  loading?: boolean
  icon?: React.ReactElement
}) {
  return (
    <div className="ak-card p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-brand-primary/80">{icon}</div>
      <p className="text-[10px] font-medium text-brand-muted">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-5 w-20" />
      ) : (
        <p className="mt-1 text-sm font-bold tabular-nums text-brand-text">{value}</p>
      )}
    </div>
  )
}
