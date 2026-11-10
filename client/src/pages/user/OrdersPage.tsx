import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeIndianRupee,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Layers3,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { fetchOrder, fetchOrders } from '@/services/userService'
import { formatDate, formatINR, formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InvestmentOrder } from '@/types'

const tabs = [
  { key: 'all', label: 'All', icon: Layers3 },
  { key: 'active', label: 'Active', icon: CircleDot },
  { key: 'completed', label: 'Done', icon: CheckCircle2 },
  { key: 'cancelled', label: 'Cancel', icon: XCircle },
]

function progressPct(order: InvestmentOrder) {
  if (!order.startDate || !order.endDate) return order.status === 'completed' ? 100 : 0
  const start = new Date(order.startDate).getTime()
  const end = new Date(order.endDate).getTime()
  const now = Date.now()
  if (end <= start) return order.status === 'completed' ? 100 : 0
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

function daysLeft(order: InvestmentOrder) {
  if (!order.endDate) return null
  const diff = Math.ceil((new Date(order.endDate).getTime() - Date.now()) / 86400000)
  return diff
}

export function OrdersPage() {
  const [tab, setTab] = useState('all')
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => fetchOrders() })
  const orders: InvestmentOrder[] = data?.data || []

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) => o.status === 'active').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  const filtered = useMemo(
    () => (tab === 'all' ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab]
  )

  const totalInvested = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0)
  const totalReturn = orders.reduce((sum, o) => sum + Number(o.projectedIncomeSnapshot || 0), 0)

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-6 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
            AlgoKing Orders
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">My Orders</h1>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Orders</p>
              <p className="mt-0.5 text-lg font-bold">{isLoading ? '—' : counts.all}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Invested</p>
              <p className="mt-0.5 text-sm font-bold leading-tight">
                {isLoading ? '—' : formatINR(totalInvested)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Active</p>
              <p className="mt-0.5 text-lg font-bold text-brand-gold">
                {isLoading ? '—' : counts.active}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-3 space-y-4 px-4">
        {/* Filters */}
        <div className="ak-card flex gap-1.5 overflow-x-auto p-1.5 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            const count = counts[t.key as keyof typeof counts] ?? 0
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex min-w-[68px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                  active
                    ? 'brand-gradient text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]'
                    : 'text-brand-muted hover:bg-brand-bg'
                )}
              >
                <span className="inline-flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </span>
                <span className={cn('text-[10px]', active ? 'text-white/75' : 'text-brand-muted')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Summary strip */}
        {!isLoading && orders.length > 0 && (
          <div className="ak-card grid grid-cols-2 gap-2 p-3">
            <div className="rounded-2xl bg-brand-bg px-3 py-2.5">
              <p className="text-[10px] font-medium text-brand-muted">Total Invested</p>
              <p className="mt-0.5 text-sm font-bold text-brand-text">{formatINR(totalInvested)}</p>
            </div>
            <div className="rounded-2xl bg-[#E6F7EF] px-3 py-2.5">
              <p className="text-[10px] font-medium text-brand-muted">Expected Return</p>
              <p className="mt-0.5 text-sm font-bold text-brand-success">{formatINR(totalReturn)}</p>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 rounded-[18px]" />
            <Skeleton className="h-36 rounded-[18px]" />
          </div>
        ) : filtered.length ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-sm font-bold text-brand-text">
                {tab === 'all' ? 'All Orders' : `${tabs.find((t) => t.key === tab)?.label} Orders`}
              </h2>
              <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                {filtered.length} shown
              </span>
            </div>

            {filtered.map((order, index) => {
              const pct = progressPct(order)
              const left = daysLeft(order)
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="ak-card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,27,61,0.12)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={cn(
                      'h-1.5 w-full',
                      order.status === 'active' && 'bg-gradient-to-r from-brand-primary to-brand-accent',
                      order.status === 'completed' && 'bg-brand-success',
                      order.status === 'cancelled' && 'bg-brand-danger/70',
                      !['active', 'completed', 'cancelled'].includes(order.status) && 'bg-brand-muted/40'
                    )}
                  />

                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-secondary to-brand-deep shadow-[0_10px_20px_rgba(0,102,255,0.22)]">
                        <BriefcaseBusiness className="h-6 w-6 text-brand-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-brand-text">
                              {order.planSnapshot?.name || 'Investment'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-brand-muted">{order.orderId}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {order.durationDays} Days
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatShortDate(order.createdAt)}
                          </span>
                          {order.status === 'active' && left !== null && (
                            <span className="inline-flex items-center gap-1 text-brand-primary">
                              {left > 0 ? `${left}d left` : 'Ending'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-brand-bg px-2.5 py-2.5 text-center">
                        <p className="text-[10px] text-brand-muted">Invested</p>
                        <p className="mt-0.5 text-[12px] font-bold text-brand-text">
                          {formatINR(order.amount)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#E6F7EF] px-2.5 py-2.5 text-center">
                        <p className="text-[10px] text-brand-muted">Daily</p>
                        <p className="mt-0.5 text-[12px] font-bold text-brand-success">
                          {formatINR(order.planSnapshot?.projectedDailyIncome)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#E7F1FF] px-2.5 py-2.5 text-center">
                        <p className="text-[10px] text-brand-muted">Return</p>
                        <p className="mt-0.5 text-[12px] font-bold text-brand-primary">
                          {formatINR(order.projectedIncomeSnapshot)}
                        </p>
                      </div>
                    </div>

                    {order.status === 'active' && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-brand-muted">
                          <span>Progress</span>
                          <span className="font-semibold text-brand-primary">{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-brand-bg">
                          <div
                            className="h-full rounded-full brand-gradient transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-brand-primary">
                      View details <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            description="Browse plans and start your first investment."
          />
        )}
      </div>
    </div>
  )
}

export function OrderDetailsPage() {
  const { id } = useParams()
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-40 rounded-[18px]" />
        <Skeleton className="h-48 rounded-[18px]" />
      </div>
    )
  }

  if (!order) return <div className="p-4 text-sm text-brand-danger">Order not found</div>

  const pct = progressPct(order)
  const left = daysLeft(order)

  return (
    <div className="pb-2">
      <div className="brand-gradient relative overflow-hidden px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <Link to="/orders" className="relative z-10 text-sm font-semibold text-white/80">
          ← Orders
        </Link>
        <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
              Order Details
            </p>
            <h1 className="mt-1 truncate text-2xl font-extrabold">
              {order.planSnapshot?.name || 'Investment'}
            </h1>
            <p className="mt-1 text-xs text-white/70">{order.orderId}</p>
          </div>
          <StatusBadge status={order.status} className="bg-white/15 text-white" />
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-4 px-4">
        <div className="ak-card p-4 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-brand-bg p-3">
              <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <BadgeIndianRupee className="h-4 w-4" />
              </span>
              <p className="text-[10px] text-brand-muted">Invested</p>
              <p className="mt-0.5 text-base font-bold">{formatINR(order.amount)}</p>
            </div>
            <div className="rounded-2xl bg-[#E6F7EF] p-3">
              <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand-success">
                <TrendingUp className="h-4 w-4" />
              </span>
              <p className="text-[10px] text-brand-muted">Total Return</p>
              <p className="mt-0.5 text-base font-bold text-brand-success">
                {formatINR(order.projectedIncomeSnapshot)}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-bg p-3">
              <p className="text-[10px] text-brand-muted">Daily Income</p>
              <p className="mt-0.5 font-bold text-brand-text">
                {formatINR(order.planSnapshot?.projectedDailyIncome)}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-bg p-3">
              <p className="text-[10px] text-brand-muted">Duration</p>
              <p className="mt-0.5 font-bold text-brand-text">{order.durationDays} Days</p>
            </div>
          </div>

          {order.status === 'active' && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-brand-muted">Progress</span>
                <span className="font-semibold text-brand-primary">
                  {pct}%{left !== null && left > 0 ? ` · ${left}d left` : ''}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-bg">
                <div className="h-full rounded-full brand-gradient" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="ak-card space-y-3 p-4">
          <h2 className="text-sm font-bold text-brand-text">Timeline</h2>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="rounded-2xl bg-brand-bg p-3">
              <p className="text-[10px] text-brand-muted">Start</p>
              <p className="mt-1 font-semibold">{formatDate(order.startDate)}</p>
            </div>
            <div className="rounded-2xl bg-brand-bg p-3">
              <p className="text-[10px] text-brand-muted">End</p>
              <p className="mt-1 font-semibold">{formatDate(order.endDate)}</p>
            </div>
          </div>
        </div>

        <Link
          to="/plans"
          className="brand-gradient flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,102,255,0.25)]"
        >
          Browse More Plans
        </Link>
      </div>
    </div>
  )
}
