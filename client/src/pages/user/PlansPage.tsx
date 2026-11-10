import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseBusiness, CalendarRange, Crown, Layers3 } from 'lucide-react'
import { InvestmentPlanCard } from '@/components/user/InvestmentPlanCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchPlans, fetchPublicSettings } from '@/services/userService'
import { formatINR } from '@/lib/format'
import type { Plan } from '@/types'
import { cn } from '@/lib/utils'

const filters = [
  { key: 'all', label: 'All', icon: Layers3 },
  { key: 'short', label: 'Short', icon: CalendarRange },
  { key: 'medium', label: 'Medium', icon: BriefcaseBusiness },
  { key: 'long', label: 'Long', icon: Crown },
]

function matchFilter(plan: Plan, key: string) {
  if (key === 'all') return true
  if (key === 'short') return plan.durationDays <= 30
  if (key === 'medium') return plan.durationDays > 30 && plan.durationDays <= 60
  return plan.durationDays > 60
}

export function PlansPage() {
  const [filter, setFilter] = useState('all')
  const { data, isLoading } = useQuery({ queryKey: ['plans'], queryFn: fetchPlans })
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  const allPlans = data?.plans || []
  const plans = useMemo(
    () => allPlans.filter((p) => matchFilter(p, filter)),
    [allPlans, filter]
  )

  const highlight = allPlans[0]
  const maxDaily = allPlans.reduce(
    (max, p) => Math.max(max, Number(p.projectedDailyIncome || 0)),
    0
  )

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-hero relative overflow-hidden px-4 pb-6 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-accent/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-brand-secondary/20 blur-2xl" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
            AlgoKing Plans
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Investment Plans</h1>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Plans</p>
              <p className="mt-0.5 text-lg font-bold">{isLoading ? '—' : allPlans.length}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">From</p>
              <p className="mt-0.5 text-sm font-bold leading-tight">
                {highlight ? formatINR(highlight.investmentAmount) : '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Top Daily</p>
              <p className="mt-0.5 text-sm font-bold leading-tight text-brand-gold">
                {maxDaily ? formatINR(maxDaily) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-3 space-y-4 px-4">
        {/* Filters */}
        <div className="ak-card flex gap-1.5 overflow-x-auto p-1.5 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
          {filters.map((f) => {
            const Icon = f.icon
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex min-w-[72px] flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition',
                  active
                    ? 'brand-gradient text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]'
                    : 'text-brand-muted hover:bg-brand-bg'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 rounded-[18px]" />
            <Skeleton className="h-56 rounded-[18px]" />
          </div>
        ) : plans.length ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-sm font-bold text-brand-text">
                {filter === 'all' ? 'Available Plans' : `${filters.find((f) => f.key === filter)?.label} Term`}
              </h2>
              <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                {plans.length} plan{plans.length === 1 ? '' : 's'}
              </span>
            </div>
            {plans.map((plan, index) => (
              <InvestmentPlanCard key={plan._id} plan={plan} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState title="No plans available" description="Check back soon for new investment plans." />
        )}

        {settings?.riskDisclaimer ? (
          <p className="rounded-2xl bg-brand-bg px-3 py-2.5 text-[11px] leading-relaxed text-brand-muted">
            {settings.riskDisclaimer}
          </p>
        ) : null}
      </div>
    </div>
  )
}
