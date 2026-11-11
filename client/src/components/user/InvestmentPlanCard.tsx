import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Crown, Layers3, TrendingUp } from 'lucide-react'
import type { Plan } from '@/types'
import { formatAlternateCurrency, formatINR, getUsdtInrRate } from '@/lib/format'
import { cn } from '@/lib/utils'

const tierStyles = [
  {
    badge: 'Starter',
    accent: 'from-[#00A3FF] to-[#0066FF]',
    ring: 'ring-brand-primary/15',
    chip: 'bg-[#E7F1FF] text-brand-primary',
  },
  {
    badge: 'Popular',
    accent: 'from-[#FFC700] to-[#FF8A00]',
    ring: 'ring-brand-accent/35',
    chip: 'bg-[#FFF4D6] text-[#C4691A]',
  },
  {
    badge: 'Premium',
    accent: 'from-[#0066FF] to-[#001B3D]',
    ring: 'ring-brand-deep/20',
    chip: 'bg-[#E7F1FF] text-brand-deep',
  },
]

function getTier(plan: Plan, index = 0) {
  if (plan.isFeatured || plan.isPopular) return tierStyles[1]
  const amount = Number(plan.investmentAmount || 0)
  if (amount >= 10000 || index >= 2) return tierStyles[2]
  if (amount >= 5000 || index === 1) return tierStyles[1]
  return tierStyles[0]
}

export function InvestmentPlanCard({ plan, index = 0 }: { plan: Plan; index?: number }) {
  const tier = getTier(plan, index)
  const badge = plan.badgeLabel?.trim() || tier.badge
  const roi =
    plan.investmentAmount > 0
      ? Math.round((plan.projectedTotalIncome / plan.investmentAmount) * 100)
      : 0

  return (
    <article
      className={cn(
        'ak-card group relative overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,27,61,0.12)]',
        'ring-1',
        tier.ring
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn('h-1.5 w-full bg-gradient-to-r', tier.accent)} />

      <div className="p-4 pb-3">
        <div className="flex gap-3">
          <div
            className={cn(
              'relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-3xl shadow-[0_10px_20px_rgba(0,102,255,0.22)]',
              tier.accent
            )}
          >
            {plan.image ? (
              <img src={plan.image} alt="" className="h-full w-full object-cover" />
            ) : plan.iconEmoji ? (
              <span>{plan.iconEmoji}</span>
            ) : (
              <Layers3 className="h-8 w-8 text-brand-gold" />
            )}
            {(plan.isFeatured || plan.isPopular) && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-brand-dark shadow">
                <Crown className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    tier.chip
                  )}
                >
                  {badge}
                </span>
                <h3 className="mt-1.5 truncate text-[17px] font-bold leading-tight text-brand-text">
                  {plan.name}
                </h3>
              </div>
              <div className="rounded-2xl bg-brand-success/10 px-2.5 py-1.5 text-center">
                <p className="text-[10px] font-medium text-brand-muted">ROI</p>
                <p className="text-sm font-extrabold text-brand-success">{roi}%</p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand-muted">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {plan.durationDays} Days
              </span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-brand-success" />
                {formatINR(plan.projectedDailyIncome)}/day
              </span>
              <span className="text-[10px]">{formatAlternateCurrency(plan.projectedDailyIncome)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-brand-bg px-2 py-3 text-center">
            <p className="text-[10px] font-medium text-brand-muted">Invest</p>
            <p className="mt-1 text-[12px] font-bold leading-tight text-brand-text">
              {formatINR(plan.investmentAmount)}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-brand-muted">
              {formatAlternateCurrency(plan.investmentAmount)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#E6F7EF] px-2 py-3 text-center">
            <p className="text-[10px] font-medium text-brand-muted">Daily Profit</p>
            <p className="mt-1 text-[12px] font-bold leading-tight text-brand-success">
              {formatINR(plan.projectedDailyIncome)}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-brand-muted">
              {formatAlternateCurrency(plan.projectedDailyIncome)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#E7F1FF] px-2 py-3 text-center">
            <p className="text-[10px] font-medium text-brand-muted">Total Profit</p>
            <p className="mt-1 text-[12px] font-bold leading-tight text-brand-primary">
              {formatINR(plan.projectedTotalIncome)}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-brand-muted">
              {formatAlternateCurrency(plan.projectedTotalIncome)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-brand-muted">
          Conversion rate: 1 USDT = Rs. {getUsdtInrRate()}
        </p>
      </div>

      <div className="px-4 pb-4">
        <Link
          to={`/plans/${plan._id}`}
          className="brand-gradient flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,102,255,0.25)] transition group-hover:brightness-110"
        >
          Invest Now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}
