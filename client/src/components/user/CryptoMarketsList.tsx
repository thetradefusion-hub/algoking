import { Link } from 'react-router-dom'
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useLiveCryptoMarkets } from '@/hooks/useLiveCryptoMarkets'
import { LiveDot, LivePrice } from '@/components/user/LivePrice'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export function CryptoMarketsList({
  limit,
  showHeader = true,
}: {
  limit?: number
  showHeader?: boolean
}) {
  const { data, isError, hasPrices, isLive, isPending } = useLiveCryptoMarkets()
  const rows = (data || []).slice(0, limit)
  const showSkeleton = isPending && !rows.length

  return (
    <section className="space-y-3">
      {showHeader ? (
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="font-bold text-brand-text">Live Markets</h3>
            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-brand-muted">
              <LiveDot connected={isLive} />
              <span>· Popular crypto</span>
            </p>
          </div>
          <Link to="/markets" className="text-xs font-semibold text-brand-primary">
            View all
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between px-0.5">
          <LiveDot connected={isLive} />
          <p className="text-[11px] text-brand-muted">Auto-refresh every few seconds</p>
        </div>
      )}

      <div className="ak-card divide-y divide-brand-primary/5 overflow-hidden p-0">
        {showSkeleton
          ? Array.from({ length: limit || 8 }).map((_, i) => (
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
            const up = coin.priceChangePct24h >= 0
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
                  style={{ boxShadow: `inset 0 0 0 1px ${coin.color}22` }}
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
                        {coin.priceChangePct24h.toFixed(2)}%
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
          <p className="px-3.5 py-3 text-xs text-brand-danger">
            Could not refresh prices. Pull to reopen page.
          </p>
        ) : null}
      </div>
    </section>
  )
}
