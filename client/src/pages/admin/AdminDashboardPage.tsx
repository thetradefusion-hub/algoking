import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BarChart3,
  Layers3,
  LifeBuoy,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { fetchAdminDashboard } from '@/services/adminService'
import { formatDate, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

type PopUser = { _id?: string; fullName?: string; email?: string } | string | null

function userName(u?: PopUser) {
  if (!u || typeof u === 'string') return 'User'
  return u.fullName || u.email || 'User'
}

function Kpi({
  label,
  value,
  hint,
  to,
  tone = 'default',
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: string
  to?: string
  tone?: 'default' | 'warn' | 'accent' | 'ok'
  icon?: typeof Users
}) {
  const body = (
    <Card
      className={cn(
        'h-full transition',
        tone === 'warn' && 'ring-1 ring-brand-warning/40',
        tone === 'accent' && 'ring-1 ring-brand-accent/35',
        tone === 'ok' && 'ring-1 ring-brand-success/25',
        to && 'hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,27,61,0.1)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
        {Icon ? (
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl',
              tone === 'warn' && 'bg-brand-warning/15 text-[#9a6510]',
              tone === 'accent' && 'bg-brand-accent/15 text-brand-accent',
              tone === 'ok' && 'bg-brand-success/10 text-brand-success',
              tone === 'default' && 'bg-brand-primary/10 text-brand-primary'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-bold',
          tone === 'warn' && 'text-[#9a6510]',
          tone === 'accent' && 'text-brand-accent',
          tone === 'ok' && 'text-brand-success',
          tone === 'default' && 'text-brand-text'
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function SectionHead({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="font-semibold text-brand-text">{title}</h3>
      <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function RowShell({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-bg px-3 py-2.5">{children}</div>
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchAdminDashboard })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  const k = data?.kpis || {}
  const recent = data?.recent || {}

  const registrationChart = (data?.charts?.registrations || []).map((d: { _id: string; count: number }) => ({
    day: d._id.slice(5),
    count: d.count,
  }))
  const rechargeChart = (data?.charts?.recharges || []).map((d: { _id: string; total: number }) => ({
    day: d._id.slice(5),
    total: d.total,
  }))
  const investmentChart = (data?.charts?.investments || []).map((d: { _id: string; total: number }) => ({
    day: d._id.slice(5),
    total: d.total,
  }))

  const attentionItems = [
    {
      label: 'Pending deposits',
      value: k.pendingRecharge || 0,
      to: '/admin/recharges',
      tone: 'warn' as const,
    },
    {
      label: 'Pending withdrawals',
      value: k.pendingWithdrawals || 0,
      to: '/admin/withdrawals',
      tone: 'warn' as const,
    },
    {
      label: 'Pending KYC',
      value: k.pendingKyc || 0,
      to: '/admin/kyc',
      tone: 'accent' as const,
    },
    {
      label: 'Open tickets',
      value: k.openTickets || 0,
      to: '/admin/support',
      tone: 'default' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Control Center
          </p>
          <h1 className="text-2xl font-bold text-brand-text">Admin Dashboard</h1>
          <p className="text-sm text-brand-muted">Approvals, cashflow & recent activity</p>
        </div>
        <span className="rounded-full brand-accent-gradient px-3 py-1 text-xs font-bold text-brand-dark">
          Live
        </span>
      </div>

      {(k.pendingRecharge > 0 || k.pendingWithdrawals > 0 || k.pendingKyc > 0 || k.openTickets > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 transition hover:-translate-y-0.5',
                item.tone === 'warn' && 'ring-brand-warning/35',
                item.tone === 'accent' && 'ring-brand-accent/30',
                item.tone === 'default' && 'ring-brand-primary/15'
              )}
            >
              <div>
                <p className="text-xs font-medium text-brand-muted">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-muted" />
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Users" value={k.totalUsers || 0} hint={`${k.activeUsers || 0} active`} to="/admin/users" icon={Users} />
        <Kpi label="New This Month" value={k.newRegistrations || 0} to="/admin/users" icon={Users} tone="ok" />
        <Kpi
          label="Total Deposits"
          value={formatINR(k.totalRecharge)}
          hint={`${k.pendingRecharge || 0} pending`}
          to="/admin/recharges"
          icon={ArrowDownToLine}
        />
        <Kpi
          label="Withdrawals Paid"
          value={formatINR(k.completedWithdrawalAmount)}
          hint={`${k.pendingWithdrawals || 0} pending · ${k.completedWithdrawals || 0} paid`}
          to="/admin/withdrawals"
          icon={ArrowUpFromLine}
          tone={(k.pendingWithdrawals || 0) > 0 ? 'warn' : 'default'}
        />
        <Kpi
          label="Total Investments"
          value={formatINR(k.totalInvestments)}
          hint={`${k.activeInvestments || 0} active · ${k.investmentCount || 0} orders`}
          to="/admin/orders"
          icon={ShoppingBag}
        />
        <Kpi
          label="Referral Payouts"
          value={formatINR(k.totalReferralCommissions)}
          to="/admin/referrals"
          icon={BarChart3}
          tone="accent"
        />
        <Kpi label="Active Plans" value={k.activePlans || 0} to="/admin/plans" icon={Layers3} />
        <Kpi
          label="Support Queue"
          value={k.openTickets || 0}
          hint={`${k.pendingKyc || 0} KYC pending`}
          to="/admin/support"
          icon={LifeBuoy}
          tone={(k.openTickets || 0) > 0 ? 'warn' : 'default'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h2 className="mb-4 font-semibold text-brand-text">Registrations (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6E4F5" />
                <XAxis dataKey="day" tick={{ fill: '#6B7C93', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7C93', fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#0066FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <h2 className="mb-4 font-semibold text-brand-text">Deposits (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rechargeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6E4F5" />
                <XAxis dataKey="day" tick={{ fill: '#6B7C93', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7C93', fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => formatINR(Number(v || 0))} />
                <Bar dataKey="total" fill="#00A3FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <h2 className="mb-4 font-semibold text-brand-text">Investments (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={investmentChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6E4F5" />
                <XAxis dataKey="day" tick={{ fill: '#6B7C93', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7C93', fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => formatINR(Number(v || 0))} />
                <Bar dataKey="total" fill="#FF8A00" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Recent deposits" to="/admin/recharges" linkLabel="All deposits" />
          <div className="space-y-2 text-sm">
            {(recent.recharges || []).length ? (
              (recent.recharges || []).map(
                (r: {
                  _id: string
                  amount: number
                  status: string
                  createdAt?: string
                  userId?: PopUser
                }) => (
                  <RowShell key={r._id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{userName(r.userId)}</p>
                      <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-success">{formatINR(r.amount)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                  </RowShell>
                )
              )
            ) : (
              <EmptyState title="No deposits yet" description="Deposit requests will appear here" />
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title="Recent withdrawals" to="/admin/withdrawals" linkLabel="All withdrawals" />
          <div className="space-y-2 text-sm">
            {(recent.withdrawals || []).length ? (
              (recent.withdrawals || []).map(
                (w: {
                  _id: string
                  amount: number
                  netAmount?: number
                  status: string
                  createdAt?: string
                  userId?: PopUser
                }) => (
                  <RowShell key={w._id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{userName(w.userId)}</p>
                      <p className="text-xs text-brand-muted">{formatDate(w.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatINR(w.amount)}</p>
                      {w.netAmount != null ? (
                        <p className="text-[11px] text-brand-muted">Net {formatINR(w.netAmount)}</p>
                      ) : null}
                      <StatusBadge status={w.status} />
                    </div>
                  </RowShell>
                )
              )
            ) : (
              <EmptyState title="No withdrawals yet" description="Withdrawal requests will appear here" />
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title="Recent investments" to="/admin/orders" linkLabel="All orders" />
          <div className="space-y-2 text-sm">
            {(recent.orders || []).length ? (
              (recent.orders || []).map(
                (o: {
                  _id: string
                  amount: number
                  status: string
                  createdAt?: string
                  userId?: PopUser
                  planId?: { name?: string } | string | null
                  planSnapshot?: { name?: string }
                }) => {
                  const planName =
                    o.planSnapshot?.name ||
                    (typeof o.planId === 'object' && o.planId?.name) ||
                    'Plan'
                  return (
                    <RowShell key={o._id}>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{userName(o.userId)}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {planName} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatINR(o.amount)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                    </RowShell>
                  )
                }
              )
            ) : (
              <EmptyState title="No investments yet" description="Purchased plans will appear here" />
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title="Latest registrations" to="/admin/users" linkLabel="All users" />
          <div className="space-y-2 text-sm">
            {(recent.users || []).length ? (
              (recent.users || []).map(
                (u: {
                  _id: string
                  fullName: string
                  email: string
                  mobile?: string
                  status: string
                  createdAt?: string
                }) => (
                  <Link key={u._id} to={`/admin/users/${u._id}`}>
                    <RowShell>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{u.fullName}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {u.email || u.mobile} · {formatDate(u.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={u.status} />
                    </RowShell>
                  </Link>
                )
              )
            ) : (
              <EmptyState title="No users yet" description="New signups will appear here" />
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title="Pending KYC" to="/admin/kyc" linkLabel="KYC queue" />
          <div className="space-y-2 text-sm">
            {(recent.kyc || []).length ? (
              (recent.kyc || []).map(
                (kyc: {
                  _id: string
                  status: string
                  documentType?: string
                  createdAt?: string
                  userId?: PopUser
                }) => (
                  <RowShell key={kyc._id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{userName(kyc.userId)}</p>
                      <p className="text-xs text-brand-muted">
                        {kyc.documentType || 'Document'} · {formatDate(kyc.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand-accent" />
                      <StatusBadge status={kyc.status} />
                    </div>
                  </RowShell>
                )
              )
            ) : (
              <EmptyState title="KYC clear" description="No pending verification requests" />
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title="Open support tickets" to="/admin/support" linkLabel="Support" />
          <div className="space-y-2 text-sm">
            {(recent.tickets || []).length ? (
              (recent.tickets || []).map(
                (t: {
                  _id: string
                  subject: string
                  ticketNumber?: string
                  status: string
                  createdAt?: string
                  userId?: PopUser
                }) => (
                  <RowShell key={t._id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.subject}</p>
                      <p className="truncate text-xs text-brand-muted">
                        {t.ticketNumber || 'Ticket'} · {userName(t.userId)} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </RowShell>
                )
              )
            ) : (
              <EmptyState title="Inbox clear" description="No open support tickets" />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
