import { useEffect, useState } from 'react'
import { Clock3, TrendingUp } from 'lucide-react'
import { formatCountdown, getOrderRoiMeta } from '@/lib/roi'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InvestmentOrder } from '@/types'

type Props = {
  order: InvestmentOrder
  compact?: boolean
  className?: string
}

export function RoiIncomeProgress({ order, compact, className }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (order.status !== 'active') return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [order.status])

  const meta = getOrderRoiMeta(order, now)
  const done = order.status === 'completed' || meta.progressPct >= 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
            ROI Income
          </p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-brand-success">
            {formatINR(done ? meta.totalIncome : meta.liveEarned)}
            <span className="ml-1 text-[11px] font-semibold text-brand-muted">
              / {formatINR(meta.totalIncome)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-brand-muted">Progress</p>
          <p className="text-sm font-bold text-brand-primary">{meta.progressPct.toFixed(1)}%</p>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-brand-bg">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-success to-[#3DDC97] transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(100, meta.progressPct)}%` }}
        />
      </div>

      {!compact ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#E6F7EF] px-2 py-2 text-center">
            <p className="text-[9px] text-brand-muted">Credited</p>
            <p className="mt-0.5 text-[11px] font-bold text-brand-success">
              {formatINR(meta.totalIncomePaid)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-bg px-2 py-2 text-center">
            <p className="text-[9px] text-brand-muted">Per hour</p>
            <p className="mt-0.5 text-[11px] font-bold text-brand-text">
              {formatINR(meta.hourlyIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-[#E7F1FF] px-2 py-2 text-center">
            <p className="text-[9px] text-brand-muted">
              {done ? 'Status' : 'Next credit'}
            </p>
            <p className="mt-0.5 inline-flex items-center justify-center gap-0.5 text-[11px] font-bold text-brand-primary">
              {done ? (
                'Done'
              ) : (
                <>
                  <Clock3 className="h-3 w-3" />
                  {formatCountdown(meta.secondsToNextHour)}
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] text-brand-muted">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-brand-success" />
            +{formatINR(meta.hourlyIncome)}/hr
          </span>
          <span>
            Wallet: {formatINR(meta.totalIncomePaid)}
            {!done && meta.secondsToNextHour != null
              ? ` · next ${formatCountdown(meta.secondsToNextHour)}`
              : ''}
          </span>
        </div>
      )}
    </div>
  )
}
