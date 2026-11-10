import { formatUsdPrice } from '@/services/cryptoService'
import { cn } from '@/lib/utils'

type Props = {
  price?: number | null
  flash?: 'up' | 'down' | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** light = on purple/dark hero backgrounds */
  tone?: 'default' | 'light'
}

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

export function LivePrice({ price, flash, className, size = 'sm', tone = 'default' }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded-md px-1 py-0.5 font-bold tabular-nums transition-colors duration-300',
        sizeClass[size],
        flash === 'up' && 'animate-price-up bg-emerald-500/20 text-brand-success',
        flash === 'down' && 'animate-price-down bg-rose-500/20 text-brand-danger',
        !flash && (tone === 'light' ? 'text-white' : 'text-brand-text'),
        className
      )}
    >
      {formatUsdPrice(price)}
    </span>
  )
}

export function LiveDot({ connected = true }: { connected?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-muted">
      <span
        className={cn(
          'relative flex h-2 w-2',
          connected ? 'text-brand-success' : 'text-brand-warning'
        )}
      >
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-60',
            connected ? 'animate-ping bg-brand-success' : 'bg-brand-warning'
          )}
        />
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            connected ? 'bg-brand-success' : 'bg-brand-warning'
          )}
        />
      </span>
      {connected ? 'LIVE' : 'RECONNECTING'}
    </span>
  )
}
