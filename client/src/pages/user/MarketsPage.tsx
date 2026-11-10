import { Search, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveCryptoMarkets } from '@/hooks/useLiveCryptoMarkets'
import { LiveDot, LivePrice } from '@/components/user/LivePrice'
import { Skeleton } from '@/components/ui/Skeleton'
import { CRYPTO_ASSETS } from '@/lib/cryptoMarkets'
import { cn } from '@/lib/utils'

export function MarketsPage() {
  const [q, setQ] = useState('')
  const { data, isPending, hasPrices, isLive, isError } = useLiveCryptoMarkets()

  const rows = useMemo(() => {
    type Row = {
      id: string
      symbol: string
      name: string
      image: string
      color?: string
      currentPrice: number
      priceChangePct24h: number
      flash?: 'up' | 'down' | null
    }
    const list: Row[] =
      data && data.length > 0
        ? data
        : CRYPTO_ASSETS.map((a) => ({
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            image: a.image,
            color: a.color,
            currentPrice: 0,
            priceChangePct24h: 0,
            flash: null,
          }))
    const term = q.trim().toLowerCase()
    if (!term) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    )
  }, [data, q])

  const showSkeleton = isPending && !(data && data.length > 0)

  return (
    <div className="pb-2">
      <div className="brand-hero relative overflow-hidden px-4 pb-10 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-accent/25 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
              Crypto
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Markets</h1>
            <p className="mt-1 text-sm text-white/75">All popular coins · live prices</p>
          </div>
          <LiveDot connected={isLive} />
        </div>

        <div className="relative z-10 mt-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
            <Search className="h-4 w-4 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search BTC, ETH, TRX…"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/55 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-5 px-4">
        <div className="ak-card divide-y divide-brand-primary/5 overflow-hidden p-0">
          {showSkeleton
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            : null}

          {!showSkeleton &&
            rows.map((coin) => {
              const up = (coin.priceChangePct24h || 0) >= 0
              return (
                <Link
                  key={coin.id}
                  to={`/markets/${coin.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-brand-bg/70 active:bg-brand-bg"
                >
                  <img
                    src={coin.image}
                    alt=""
                    className="h-10 w-10 rounded-2xl bg-brand-bg object-contain p-1.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-text">{coin.name}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                      {coin.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <LivePrice price={coin.currentPrice} flash={coin.flash} size="sm" />
                    <p
                      className={cn(
                        'mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
                        hasPrices
                          ? up
                            ? 'text-brand-success'
                            : 'text-brand-danger'
                          : 'text-brand-muted'
                      )}
                    >
                      {hasPrices ? (
                        <>
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {up ? '+' : ''}
                          {(coin.priceChangePct24h || 0).toFixed(2)}%
                        </>
                      ) : (
                        'Updating…'
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                </Link>
              )
            })}

          {isError && !hasPrices ? (
            <p className="px-3.5 py-3 text-xs text-brand-danger">Price feed unavailable right now.</p>
          ) : null}

          {!showSkeleton && !rows.length ? (
            <p className="p-4 text-sm text-brand-muted">No coins match “{q}”.</p>
          ) : null}
        </div>

        <p className="mt-3 px-1 text-center text-[11px] text-brand-muted">
          {CRYPTO_ASSETS.length} markets · tap any coin for live chart
        </p>
      </div>
    </div>
  )
}
