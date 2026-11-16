import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RoiIncomeProgress } from '@/components/user/RoiIncomeProgress'
import { fetchOrders } from '@/services/userService'
import { formatINR } from '@/lib/format'
import { getOrderRoiMeta } from '@/lib/roi'
import type { InvestmentOrder } from '@/types'

type Props = {
  incomeWalletBalance?: number
  /** Optional API-provided orders (new backend). Client still recomputes live values. */
  apiOrders?: InvestmentOrder[]
  activeCount?: number
}

export function LiveRoiDashboardCard({
  incomeWalletBalance = 0,
  apiOrders,
  activeCount = 0,
}: Props) {
  const [now, setNow] = useState(() => Date.now())

  const ordersQuery = useQuery({
    queryKey: ['orders', 'active-roi'],
    queryFn: () => fetchOrders({ status: 'active', page: 1 }),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const activeOrders = useMemo(() => {
    const fromApi = Array.isArray(apiOrders) ? apiOrders.filter((o) => o.status === 'active') : []
    const fromQuery = (ordersQuery.data?.data || []) as InvestmentOrder[]
    const queried = fromQuery.filter((o) => o.status === 'active')
    // Prefer freshest list with dates; merge by id with query winning
    const map = new Map<string, InvestmentOrder>()
    for (const o of fromApi) map.set(o._id, o)
    for (const o of queried) map.set(o._id, o)
    return Array.from(map.values())
  }, [apiOrders, ordersQuery.data])

  const stats = useMemo(() => {
    if (!activeOrders.length) {
      return { liveEarned: 0, progressPct: 0, paid: 0 }
    }
    let liveEarned = 0
    let progressSum = 0
    let paid = 0
    for (const order of activeOrders) {
      const meta = getOrderRoiMeta(order, now)
      liveEarned += meta.liveEarned
      progressSum += meta.progressPct
      paid += meta.totalIncomePaid
    }
    return {
      liveEarned: Number(liveEarned.toFixed(4)),
      progressPct: Number((progressSum / activeOrders.length).toFixed(2)),
      paid: Number(paid.toFixed(2)),
    }
  }, [activeOrders, now])

  const show = activeCount > 0 || activeOrders.length > 0
  if (!show) return null

  return (
    <div className="ak-card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-brand-text">Live ROI Income</h3>
          <p className="text-[11px] text-brand-muted">Grows every hour · credited to Income Wallet</p>
        </div>
        <Link to="/wallet/income" className="text-xs font-semibold text-brand-primary">
          Wallet
        </Link>
      </div>

      <div className="rounded-2xl bg-[#E6F7EF] px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
          Earning now
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-success">
          {formatINR(stats.liveEarned)}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-success to-[#3DDC97] transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.min(100, stats.progressPct)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-brand-muted">
          Credited in wallet: {formatINR(incomeWalletBalance || stats.paid)} · Progress{' '}
          {stats.progressPct.toFixed(1)}%
        </p>
      </div>

      {activeOrders.slice(0, 2).map((order) => (
        <div key={order._id} className="rounded-2xl border border-brand-primary/10 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-brand-text">
              {order.planSnapshot?.name || 'Plan'}
            </p>
            <Link to={`/orders/${order._id}`} className="text-[11px] font-semibold text-brand-primary">
              Details
            </Link>
          </div>
          <RoiIncomeProgress order={order} compact />
        </div>
      ))}
    </div>
  )
}
