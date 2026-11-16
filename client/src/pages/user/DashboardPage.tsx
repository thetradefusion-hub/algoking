import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeIndianRupee,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gift,
  HandCoins,
  Layers3,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { UserHeader } from '@/components/user/UserHeader'
import { CryptoMarketsList } from '@/components/user/CryptoMarketsList'
import { RoiIncomeProgress } from '@/components/user/RoiIncomeProgress'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { fetchDashboard, fetchPublicSettings } from '@/services/userService'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InvestmentOrder } from '@/types'

const quickActions = [
  {
    to: '/wallet/recharge',
    label: 'Deposit',
    icon: ArrowDownToLine,
    tone: 'from-[#0066FF] to-[#0052CC]',
  },
  {
    to: '/wallet/withdraw',
    label: 'Withdraw',
    icon: ArrowUpFromLine,
    tone: 'from-[#16A36A] to-[#0F8A56]',
  },
  {
    to: '/orders',
    label: 'My Orders',
    icon: ShoppingBag,
    tone: 'from-[#E7A23B] to-[#C4691A]',
  },
  {
    to: '/team',
    label: 'Refer & Earn',
    icon: Gift,
    tone: 'from-[#FFC700] to-[#FF8A00]',
  },
]

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  })
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) {
    return <div className="p-4 text-sm text-brand-danger">Failed to load dashboard</div>
  }

  const wallets = [
    {
      key: 'main',
      label: 'Main Wallet',
      balance: data.wallets?.main?.balance || 0,
      icon: WalletCards,
      chip: 'bg-[#E7F1FF] text-brand-primary',
    },
    {
      key: 'income',
      label: 'Income Wallet',
      balance: data.wallets?.income?.balance || 0,
      icon: HandCoins,
      chip: 'bg-[#E6F7EF] text-brand-success',
    },
    {
      key: 'referral',
      label: 'Referral Wallet',
      balance: data.wallets?.referral?.balance || 0,
      icon: UsersRound,
      chip: 'bg-[#FFF4D6] text-[#B8860B]',
    },
  ]

  const totalBalance =
    wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0)

  return (
    <div className="pb-2">
      <UserHeader unread={data.summary?.unreadNotifications || 0} userId={data.user?.referralCode} />

      <div className="space-y-4 px-4 pt-1">
        {settings?.dashboardBanner ? (
          <div className="rounded-2xl bg-brand-primary/10 px-3.5 py-3 text-sm font-medium text-brand-primary ring-1 ring-brand-primary/15">
            {settings.dashboardBanner}
          </div>
        ) : null}

        {/* Premium hero balance card */}
        <div className="brand-hero relative overflow-hidden rounded-[24px] p-5 text-white shadow-[0_18px_40px_rgba(0,102,255,0.28)]">
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-brand-accent/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-brand-secondary/20 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                Total Balance
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatINR(totalBalance)}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
              <ChartNoAxesCombined className="h-7 w-7 text-brand-gold" />
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-2 gap-2">
            <Link
              to="/wallet/recharge"
              className="rounded-2xl bg-white py-2.5 text-center text-sm font-semibold text-brand-primary"
            >
              Deposit
            </Link>
            <Link
              to="/plans"
              className="rounded-2xl border border-white/35 bg-white/10 py-2.5 text-center text-sm font-semibold text-white"
            >
              Explore Plans
            </Link>
          </div>
        </div>

        {/* Wallet tiles */}
        <div>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h3 className="text-sm font-bold text-brand-text">My Wallets</h3>
            <Link to="/wallet" className="text-xs font-semibold text-brand-primary">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {wallets.map((w) => {
              const Icon = w.icon
              return (
                <Link
                  key={w.key}
                  to={`/wallet/${w.key}`}
                  className="ak-card group relative overflow-hidden p-3 transition hover:-translate-y-0.5"
                >
                  <span className={cn('mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl', w.chip)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-[10px] font-medium text-brand-muted">{w.label}</p>
                  <p className="mt-1 text-[13px] font-bold leading-tight text-brand-text">
                    {formatINR(w.balance)}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="mb-2 px-0.5 text-sm font-bold text-brand-text">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ to, label, icon: Icon, tone }) => (
              <Link
                key={to}
                to={to}
                className="ak-card flex flex-col items-center gap-2 p-3 text-center transition hover:-translate-y-0.5"
              >
                <span
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_18px_rgba(0,27,61,0.16)]',
                    tone
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-brand-text">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Investment overview */}
        <div className="ak-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text">My Investment</h3>
            <TrendingUp className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-brand-bg p-3 text-center">
              <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Layers3 className="h-4 w-4" />
              </span>
              <p className="text-[10px] text-brand-muted">Active Plans</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">
                {data.summary?.activeInvestments || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-bg p-3 text-center">
              <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E7F1FF] text-brand-primary">
                <BadgeIndianRupee className="h-4 w-4" />
              </span>
              <p className="text-[10px] text-brand-muted">Total Invested</p>
              <p className="mt-1 text-sm font-bold">{formatINR(data.summary?.totalInvestment)}</p>
            </div>
            <div className="rounded-2xl bg-brand-bg p-3 text-center">
              <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F7EF] text-brand-success">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <p className="text-[10px] text-brand-muted">Income Wallet</p>
              <p className="mt-1 text-sm font-bold text-brand-success">
                {formatINR(data.wallets?.income?.balance || data.summary?.totalEarnings)}
              </p>
            </div>
          </div>
        </div>

        {/* Live ROI income */}
        {(data.summary?.activeInvestments || 0) > 0 ? (
          <div className="ak-card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-text">Live ROI Income</h3>
                <p className="text-[11px] text-brand-muted">
                  Grows every hour · credited to Income Wallet
                </p>
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
                {formatINR(data.summary?.liveRoiEarned || 0)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-success to-[#3DDC97] transition-all"
                  style={{ width: `${Math.min(100, Number(data.summary?.roiProgressPct || 0))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-brand-muted">
                Credited in wallet: {formatINR(data.wallets?.income?.balance || 0)} · Progress{' '}
                {Number(data.summary?.roiProgressPct || 0).toFixed(1)}%
              </p>
            </div>
            {(data.activeRoiOrders as InvestmentOrder[] | undefined)?.slice(0, 2).map((order) => (
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
        ) : null}

        {/* Live crypto markets */}
        <CryptoMarketsList limit={8} />
      </div>
    </div>
  )
}
