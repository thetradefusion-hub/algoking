import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogIn, Mail, Phone, Shield, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import {
  approveKyc,
  approveRecharge,
  approveWithdrawal,
  fetchAdminKyc,
  fetchAdminOrders,
  fetchAdminPaymentMethods,
  fetchAdminRecharges,
  fetchAdminReferrals,
  fetchAdminSupport,
  fetchAdminUser,
  fetchAdminUsers,
  fetchAdminWithdrawals,
  fetchAuditLogs,
  fetchCommissionSettings,
  fetchReport,
  impersonateAdminUser,
  markWithdrawalPaid,
  rejectKyc,
  rejectRecharge,
  rejectWithdrawal,
  searchWallet,
  adjustWallet,
  sendAnnouncement,
  updateAdminPaymentMethod,
  updateCommissionSettings,
  updateUserStatus,
} from '@/services/adminService'
import { formatDate, formatINR } from '@/lib/format'
import { getErrorMessage } from '@/services/api'

function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle ? <p className="text-sm text-brand-muted">{subtitle}</p> : null}
    </div>
  )
}

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => fetchAdminUsers({ q: q || undefined }),
  })

  const loginAs = async (userId: string) => {
    setBusyId(userId)
    try {
      const result = await impersonateAdminUser(userId)
      startImpersonation(result.accessToken, result.user)
      toast.success(`Logged in as ${result.user.fullName}`)
      navigate('/dashboard')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageTitle title="Users" subtitle="Search accounts, open full profile, or login as user" />
      <Input placeholder="Search name, email, mobile, referral…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-bg text-left text-brand-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Referral</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data || []).map(
              (u: {
                id: string
                fullName: string
                email: string
                mobile: string
                status: string
                referralCode?: string
                createdAt: string
              }) => (
                <tr key={u.id} className="border-t border-brand-bg">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-brand-primary" to={`/admin/users/${u.id}`}>
                      {u.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{u.email}</div>
                    <div className="text-brand-muted">{u.mobile}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{u.referralCode || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/users/${u.id}`}>
                        <Button size="sm" variant="outline">
                          Details
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === u.id}
                        disabled={u.status === 'blocked'}
                        onClick={() => void loginAs(u.id)}
                      >
                        <LogIn className="mr-1 h-3.5 w-3.5" />
                        Login as
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {!isLoading && !data?.data?.length ? (
          <div className="p-6">
            <EmptyState title="No users found" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchAdminUser(id!),
    enabled: !!id,
  })
  const [reason, setReason] = useState('Admin status update')
  const [loggingIn, setLoggingIn] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="space-y-3">
        <Link to="/admin/users" className="text-sm text-brand-primary">
          ← Users
        </Link>
        <EmptyState title="User not found" />
      </div>
    )
  }

  const u = data.user
  const summary = data.summary || {}

  const loginAs = async () => {
    setLoggingIn(true)
    try {
      const result = await impersonateAdminUser(u.id)
      startImpersonation(result.accessToken, result.user)
      toast.success(`Logged in as ${result.user.fullName}`)
      navigate('/dashboard')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/users" className="text-sm font-semibold text-brand-primary">
        ← Users
      </Link>

      <Card className="overflow-hidden p-0">
        <div className="brand-hero px-5 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/20">
                {u.profileImage ? (
                  <img src={u.profileImage} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  (u.fullName || 'U').slice(0, 1).toUpperCase()
                )}
              </span>
              <div>
                <h1 className="text-2xl font-bold">{u.fullName}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {u.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {u.mobile}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-brand-gold">ID: {u.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={u.status || 'active'} />
              <Button size="sm" variant="secondary" loading={loggingIn} disabled={u.status === 'blocked'} onClick={() => void loginAs()}>
                <LogIn className="mr-1 h-3.5 w-3.5" />
                Login as User
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total Balance" value={formatINR(summary.totalBalance)} />
          <MiniStat label="Orders" value={String(summary.ordersCount || 0)} />
          <MiniStat label="Banks" value={String(summary.banksCount || 0)} />
          <MiniStat label="Open Tickets" value={String(summary.openTickets || 0)} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-brand-primary" /> Profile
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <Detail label="Username" value={u.username || '—'} />
            <Detail label="Referral Code" value={u.referralCode || '—'} mono />
            <Detail label="Email verified" value={u.emailVerified ? 'Yes' : 'No'} />
            <Detail label="Mobile verified" value={u.mobileVerified ? 'Yes' : 'No'} />
            <Detail label="Joined" value={formatDate(u.createdAt)} />
            <Detail label="Last login" value={formatDate(u.lastLoginAt)} />
            <Detail label="Updated" value={formatDate(u.updatedAt)} />
            <Detail label="Role" value={u.role || 'user'} />
          </div>
          {data.sponsor ? (
            <div className="rounded-2xl bg-brand-bg p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Sponsor</p>
              <p className="mt-1 font-semibold">{data.sponsor.fullName}</p>
              <p className="text-brand-muted">
                {data.sponsor.email} · {data.sponsor.mobile} · {data.sponsor.referralCode}
              </p>
            </div>
          ) : (
            <p className="text-sm text-brand-muted">No sponsor / root user</p>
          )}
          {u.adminRemarks ? (
            <div className="rounded-2xl border border-brand-accent/20 bg-[#FFF7EB] p-3 text-sm">
              <p className="text-xs font-semibold text-brand-accent">Admin remarks</p>
              <p className="mt-1">{u.adminRemarks}</p>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4 text-brand-primary" /> Account controls
          </h3>
          <Input label="Reason for status change" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await updateUserStatus(id!, { status: 'active', reason })
                  toast.success('User activated')
                  await qc.invalidateQueries({ queryKey: ['admin-user', id] })
                } catch (e) {
                  toast.error(getErrorMessage(e))
                }
              }}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await updateUserStatus(id!, { status: 'inactive', reason })
                  toast.success('User set inactive')
                  await qc.invalidateQueries({ queryKey: ['admin-user', id] })
                } catch (e) {
                  toast.error(getErrorMessage(e))
                }
              }}
            >
              Inactive
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                try {
                  await updateUserStatus(id!, { status: 'blocked', reason })
                  toast.success('User blocked')
                  await qc.invalidateQueries({ queryKey: ['admin-user', id] })
                } catch (e) {
                  toast.error(getErrorMessage(e))
                }
              }}
            >
              Block
            </Button>
          </div>
          <div className="rounded-2xl bg-brand-bg p-3 text-xs text-brand-muted">
            KYC: <span className="font-semibold text-brand-text">{data.kyc?.status || 'not_submitted'}</span>
            {data.referrals ? (
              <p className="mt-1">
                Referral income: {formatINR(data.referrals.totalReferralIncome)} · Team:{' '}
                {data.referrals.totalTeamMembers ?? 0}
                {data.referrals.levels
                  ? ` (L1 ${data.referrals.levels.level1} · L2 ${data.referrals.levels.level2} · L3 ${data.referrals.levels.level3})`
                  : ''}
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(data.wallets || []).map(
          (w: {
            _id: string
            walletType: string
            balance: number
            totalCredited?: number
            totalDebited?: number
          }) => (
            <Card key={w._id}>
              <p className="capitalize text-brand-muted">{w.walletType} wallet</p>
              <p className="mt-1 text-2xl font-bold">{formatINR(w.balance)}</p>
              <p className="mt-2 text-xs text-brand-muted">
                In {formatINR(w.totalCredited)} · Out {formatINR(w.totalDebited)}
              </p>
            </Card>
          )
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Investments / Orders">
          {(data.orders || []).length ? (
            (data.orders || []).map(
              (o: {
                _id: string
                orderId: string
                amount: number
                status: string
                createdAt?: string
                planSnapshot?: { name?: string }
              }) => (
                <Row
                  key={o._id}
                  left={o.planSnapshot?.name || o.orderId}
                  right={`${formatINR(o.amount)} · ${o.status}`}
                  sub={formatDate(o.createdAt)}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No investments</p>
          )}
        </SectionCard>

        <SectionCard title="Deposits">
          {(data.recharges || []).length ? (
            (data.recharges || []).map(
              (r: {
                _id: string
                amount: number
                status: string
                methodCode?: string
                currency?: string
                createdAt?: string
              }) => (
                <Row
                  key={r._id}
                  left={`${(r.methodCode || 'deposit').toUpperCase()} · ${r.currency || ''}`}
                  right={`${formatINR(r.amount)} · ${r.status}`}
                  sub={formatDate(r.createdAt)}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No deposits</p>
          )}
        </SectionCard>

        <SectionCard title="Withdrawals">
          {(data.withdrawals || []).length ? (
            (data.withdrawals || []).map(
              (w: {
                _id: string
                amount: number
                netAmount?: number
                status: string
                methodCode?: string
                createdAt?: string
              }) => (
                <Row
                  key={w._id}
                  left={(w.methodCode || 'withdraw').toUpperCase()}
                  right={`${formatINR(w.amount)} · net ${formatINR(w.netAmount)} · ${w.status}`}
                  sub={formatDate(w.createdAt)}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No withdrawals</p>
          )}
        </SectionCard>

        <SectionCard title="Bank accounts">
          {(data.banks || []).length ? (
            (data.banks || []).map(
              (b: {
                id: string
                bankName: string
                accountHolderName: string
                accountNumberLast4: string
                ifscCode: string
                isPrimary?: boolean
                verificationStatus?: string
              }) => (
                <Row
                  key={b.id}
                  left={`${b.bankName}${b.isPrimary ? ' · Primary' : ''}`}
                  right={`****${b.accountNumberLast4} · ${b.verificationStatus || ''}`}
                  sub={`${b.accountHolderName} · ${b.ifscCode}`}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No bank accounts</p>
          )}
        </SectionCard>

        <SectionCard title="Ledger (recent)">
          {(data.ledger || []).length ? (
            (data.ledger || []).map(
              (tx: {
                _id: string
                type: string
                amount: number
                walletType?: string
                description?: string
                createdAt?: string
              }) => (
                <Row
                  key={tx._id}
                  left={`${tx.walletType || 'wallet'} · ${tx.description || tx.type}`}
                  right={`${tx.type === 'debit' ? '-' : '+'}${formatINR(tx.amount)}`}
                  sub={formatDate(tx.createdAt)}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No ledger entries</p>
          )}
        </SectionCard>

        <SectionCard title="Support tickets">
          {(data.tickets || []).length ? (
            (data.tickets || []).map(
              (t: {
                id: string
                ticketNumber?: string
                subject: string
                category?: string
                status: string
                createdAt?: string
              }) => (
                <Row
                  key={t.id}
                  left={`${t.ticketNumber || ''} · ${t.subject}`}
                  right={t.status}
                  sub={`${t.category || ''} · ${formatDate(t.createdAt)}`}
                />
              )
            )
          ) : (
            <p className="text-sm text-brand-muted">No tickets</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-bg px-3 py-3">
      <p className="text-[11px] text-brand-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand-text">{value}</p>
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-brand-muted">{label}</p>
      <p className={`mt-0.5 font-medium text-brand-text ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">{children}</div>
    </Card>
  )
}

function Row({ left, right, sub }: { left: string; right: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-brand-bg px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 font-medium text-brand-text">{left}</p>
        <p className="shrink-0 text-right text-xs font-semibold text-brand-primary">{right}</p>
      </div>
      {sub ? <p className="mt-0.5 text-[11px] text-brand-muted">{sub}</p> : null}
    </div>
  )
}

export { AdminPlansPage } from '@/pages/admin/AdminPlansPage'

export function AdminOrdersPage() {
  const { data } = useQuery({ queryKey: ['admin-orders'], queryFn: () => fetchAdminOrders() })
  return (
    <div>
      <PageTitle title="Orders / Investments" />
      <div className="space-y-2">
        {(data?.data || []).map((o: { _id: string; orderId: string; amount: number; status: string; userId?: { fullName?: string }; planSnapshot?: { name?: string } }) => (
          <Card key={o._id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold">{o.orderId}</p>
              <p className="text-brand-muted">
                {o.userId?.fullName} · {o.planSnapshot?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatINR(o.amount)}</p>
              <StatusBadge status={o.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminWalletsPage() {
  const [q, setQ] = useState('')
  const [result, setResult] = useState<{ user?: { id: string; fullName: string }; wallets?: Array<{ walletType: string; balance: number }> } | null>(null)
  const [amount, setAmount] = useState('100')
  const [walletType, setWalletType] = useState('main')
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [reason, setReason] = useState('')

  return (
    <div className="space-y-4">
      <PageTitle title="Wallet Management" subtitle="Adjustments always create ledger entries" />
      <div className="flex gap-2">
        <Input placeholder="Email / mobile / referral code" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button
          onClick={async () => {
            try {
              const data = await searchWallet(q)
              setResult(data)
            } catch (e) {
              toast.error(getErrorMessage(e))
            }
          }}
        >
          Search
        </Button>
      </div>
      {result?.user ? (
        <Card className="space-y-3">
          <p className="font-semibold">{result.user.fullName}</p>
          <div className="grid gap-2 md:grid-cols-3">
            {(result.wallets || []).map((w) => (
              <div key={w.walletType} className="rounded-xl bg-brand-bg p-3">
                <p className="capitalize text-brand-muted">{w.walletType}</p>
                <p className="font-bold">{formatINR(w.balance)}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <select className="h-12 rounded-2xl border px-3" value={walletType} onChange={(e) => setWalletType(e.target.value)}>
              <option value="main">Main</option>
              <option value="income">Income</option>
              <option value="referral">Referral</option>
            </select>
            <select className="h-12 rounded-2xl border px-3" value={type} onChange={(e) => setType(e.target.value as 'credit' | 'debit')}>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input placeholder="Mandatory reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              try {
                await adjustWallet({
                  userId: result.user!.id,
                  walletType,
                  type,
                  amount: Number(amount),
                  reason,
                })
                toast.success('Ledger adjustment applied')
                const data = await searchWallet(q)
                setResult(data)
              } catch (e) {
                toast.error(getErrorMessage(e))
              }
            }}
          >
            Apply Adjustment
          </Button>
        </Card>
      ) : null}
    </div>
  )
}

export function AdminRechargesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-recharges'], queryFn: () => fetchAdminRecharges() })
  return (
    <div className="space-y-3">
      <PageTitle title="Deposit Requests" subtitle="Approve after verifying Tx Hash / UTR" />
      {(data?.data || []).map(
        (r: {
          _id: string
          amount: number
          status: string
          methodCode?: string
          proofReference?: string
          network?: string
          currency?: string
          userNote?: string
          depositSnapshot?: { originalAmount?: number; originalCurrency?: string; usdtInrRate?: number }
          userId?: { fullName?: string; email?: string }
        }) => (
          <Card key={r._id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.userId?.fullName || 'User'}</p>
                <p className="text-xs text-brand-muted">{r.userId?.email}</p>
                <p className="mt-1 text-sm font-bold">
                  {formatINR(r.amount)}
                  {r.depositSnapshot?.originalAmount && r.currency === 'USDT'
                    ? ` · ${r.depositSnapshot.originalAmount} USDT`
                    : r.currency
                      ? ` · ${r.currency}`
                      : ''}
                </p>
                <p className="text-xs text-brand-muted">
                  {(r.methodCode || 'manual').toUpperCase()}
                  {r.network ? ` · ${r.network}` : ''}
                  {r.depositSnapshot?.usdtInrRate
                    ? ` · Rate 1 USDT = Rs. ${r.depositSnapshot.usdtInrRate}`
                    : ''}
                </p>
                {r.proofReference ? (
                  <p className="mt-1 break-all text-xs">
                    Proof: <span className="font-medium">{r.proofReference}</span>
                  </p>
                ) : null}
                {r.userNote ? <p className="text-xs text-brand-muted">Note: {r.userNote}</p> : null}
              </div>
              <StatusBadge status={r.status} />
            </div>
            {r.status === 'pending' || r.status === 'awaiting_payment' ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await approveRecharge(r._id, 'Verified by admin')
                      toast.success('Deposit approved & wallet credited')
                      await qc.invalidateQueries({ queryKey: ['admin-recharges'] })
                    } catch (e) {
                      toast.error(getErrorMessage(e))
                    }
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    try {
                      await rejectRecharge(r._id, 'Rejected by admin')
                      toast.success('Rejected')
                      await qc.invalidateQueries({ queryKey: ['admin-recharges'] })
                    } catch (e) {
                      toast.error(getErrorMessage(e))
                    }
                  }}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </Card>
        )
      )}
    </div>
  )
}

export function AdminWithdrawalsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-withdrawals'], queryFn: () => fetchAdminWithdrawals() })
  return (
    <div className="space-y-3">
      <PageTitle title="Withdrawal Requests" subtitle="Approve then mark paid after payout" />
      {(data?.data || []).map(
        (w: {
          _id: string
          amount: number
          netAmount: number
          status: string
          walletType?: string
          methodCode?: string
          currency?: string
          destinationAddress?: string
          destinationUpi?: string
          destinationBankSnapshot?: {
            bankName?: string
            accountNumberLast4?: string
            ifscCode?: string
            payoutUsdt?: number
            usdtInrRate?: number
          }
          userId?: { fullName?: string; email?: string }
        }) => (
          <Card key={w._id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{w.userId?.fullName || 'User'}</p>
                <p className="text-xs text-brand-muted">{w.userId?.email}</p>
                <p className="mt-1 text-sm">
                  {formatINR(w.amount)} · net {formatINR(w.netAmount)}
                  {w.destinationBankSnapshot?.payoutUsdt
                    ? ` · ≈ ${w.destinationBankSnapshot.payoutUsdt} USDT`
                    : ''}
                </p>
                <p className="text-xs text-brand-muted">
                  From {(w.walletType || 'income').toUpperCase()} wallet · {(w.methodCode || 'bank').toUpperCase()}
                  {w.destinationBankSnapshot?.usdtInrRate
                    ? ` · Rate 1 USDT = Rs. ${w.destinationBankSnapshot.usdtInrRate}`
                    : ''}
                </p>
                {w.destinationAddress ? (
                  <p className="mt-1 break-all text-xs">To: {w.destinationAddress}</p>
                ) : null}
                {w.destinationUpi ? <p className="mt-1 text-xs">UPI: {w.destinationUpi}</p> : null}
                {w.destinationBankSnapshot?.bankName ? (
                  <p className="mt-1 text-xs">
                    Bank: {w.destinationBankSnapshot.bankName} · ****
                    {w.destinationBankSnapshot.accountNumberLast4} · {w.destinationBankSnapshot.ifscCode}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={w.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {w.status === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await approveWithdrawal(w._id)
                      await qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
                      toast.success('Approved')
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await rejectWithdrawal(w._id, 'Rejected by admin')
                      await qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
                      toast.success('Rejected')
                    }}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {w.status === 'approved' || w.status === 'processing' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await markWithdrawalPaid(w._id, `PAY-${Date.now()}`)
                    await qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
                    toast.success('Marked paid')
                  }}
                >
                  Mark Paid
                </Button>
              ) : null}
            </div>
          </Card>
        )
      )}
    </div>
  )
}

export function AdminPaymentMethodsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: fetchAdminPaymentMethods,
  })
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const startEdit = (m: {
    id: string
    depositAddress?: string
    upiId?: string
    qrCodeUrl?: string
    depositInstructions?: string
    withdrawInstructions?: string
    minDeposit?: number
    maxDeposit?: number
    minWithdraw?: number
    maxWithdraw?: number
    depositFee?: number
    withdrawFee?: number
    bankDetails?: {
      accountHolderName?: string
      accountNumber?: string
      ifscCode?: string
      bankName?: string
    }
  }) => {
    setEditing(m.id)
    setForm({
      depositAddress: m.depositAddress || '',
      upiId: m.upiId || '',
      qrCodeUrl: m.qrCodeUrl || '',
      depositInstructions: m.depositInstructions || '',
      withdrawInstructions: m.withdrawInstructions || '',
      minDeposit: String(m.minDeposit ?? ''),
      maxDeposit: String(m.maxDeposit ?? ''),
      minWithdraw: String(m.minWithdraw ?? ''),
      maxWithdraw: String(m.maxWithdraw ?? ''),
      depositFee: String(m.depositFee ?? 0),
      withdrawFee: String(m.withdrawFee ?? 0),
      accountHolderName: m.bankDetails?.accountHolderName || '',
      accountNumber: m.bankDetails?.accountNumber || '',
      ifscCode: m.bankDetails?.ifscCode || '',
      bankName: m.bankDetails?.bankName || '',
    })
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Payment Methods"
        subtitle="Manage BEP20, TRC20, UPI and Bank deposit/withdraw details"
      />
      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}
      {(data || []).map(
        (m: {
          id: string
          name: string
          code: string
          iconUrl: string
          network?: string
          depositEnabled: boolean
          withdrawEnabled: boolean
          status: string
          depositAddress?: string
          upiId?: string
          qrCodeUrl?: string
        }) => (
          <Card key={m.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={m.iconUrl} alt="" className="h-10 w-10 rounded-xl bg-brand-bg object-contain p-1" />
              <div className="flex-1">
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-brand-muted">
                  {m.code.toUpperCase()}
                  {m.network ? ` · ${m.network}` : ''}
                  {m.qrCodeUrl ? ' · QR set' : ''}
                </p>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await updateAdminPaymentMethod(m.id, { depositEnabled: !m.depositEnabled })
                  await qc.invalidateQueries({ queryKey: ['admin-payment-methods'] })
                  toast.success('Deposit toggled')
                }}
              >
                Deposit: {m.depositEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await updateAdminPaymentMethod(m.id, { withdrawEnabled: !m.withdrawEnabled })
                  await qc.invalidateQueries({ queryKey: ['admin-payment-methods'] })
                  toast.success('Withdraw toggled')
                }}
              >
                Withdraw: {m.withdrawEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button size="sm" onClick={() => startEdit(m)}>
                Edit Details
              </Button>
            </div>

            {editing === m.id ? (
              <div className="space-y-2 rounded-2xl bg-brand-bg p-3">
                {(m.code === 'bep20' || m.code === 'trc20') && (
                  <Input
                    label="Deposit Address"
                    value={form.depositAddress}
                    onChange={(e) => setForm((f) => ({ ...f, depositAddress: e.target.value }))}
                  />
                )}
                {m.code === 'inr_upi' && (
                  <Input
                    label="UPI ID"
                    value={form.upiId}
                    onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                  />
                )}
                {(m.code === 'bep20' || m.code === 'trc20' || m.code === 'inr_upi') && (
                  <div className="space-y-2">
                    <Input
                      label="QR / Barcode Image URL"
                      placeholder="https://…/qr.png"
                      value={form.qrCodeUrl}
                      onChange={(e) => setForm((f) => ({ ...f, qrCodeUrl: e.target.value }))}
                    />
                    {form.qrCodeUrl ? (
                      <div className="flex justify-center rounded-2xl bg-white p-3">
                        <img
                          src={form.qrCodeUrl}
                          alt="QR preview"
                          className="h-36 w-36 rounded-xl object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-brand-muted">
                        Paste a public image URL (Cloudinary / Imgur / CDN). Shown on user deposit page.
                      </p>
                    )}
                  </div>
                )}
                {m.code === 'inr_bank' && (
                  <>
                    <Input label="Bank Name" value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
                    <Input label="Account Holder" value={form.accountHolderName} onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))} />
                    <Input label="Account Number" value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} />
                    <Input label="IFSC" value={form.ifscCode} onChange={(e) => setForm((f) => ({ ...f, ifscCode: e.target.value }))} />
                  </>
                )}
                <Input label="Deposit Instructions" value={form.depositInstructions} onChange={(e) => setForm((f) => ({ ...f, depositInstructions: e.target.value }))} />
                <Input label="Withdraw Instructions" value={form.withdrawInstructions} onChange={(e) => setForm((f) => ({ ...f, withdrawInstructions: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Min Deposit" type="number" value={form.minDeposit} onChange={(e) => setForm((f) => ({ ...f, minDeposit: e.target.value }))} />
                  <Input label="Max Deposit" type="number" value={form.maxDeposit} onChange={(e) => setForm((f) => ({ ...f, maxDeposit: e.target.value }))} />
                  <Input label="Min Withdraw" type="number" value={form.minWithdraw} onChange={(e) => setForm((f) => ({ ...f, minWithdraw: e.target.value }))} />
                  <Input label="Max Withdraw" type="number" value={form.maxWithdraw} onChange={(e) => setForm((f) => ({ ...f, maxWithdraw: e.target.value }))} />
                  <Input label="Deposit Fee" type="number" value={form.depositFee} onChange={(e) => setForm((f) => ({ ...f, depositFee: e.target.value }))} />
                  <Input label="Withdraw Fee" type="number" value={form.withdrawFee} onChange={(e) => setForm((f) => ({ ...f, withdrawFee: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateAdminPaymentMethod(m.id, {
                          depositAddress: form.depositAddress || undefined,
                          upiId: form.upiId || undefined,
                          qrCodeUrl: form.qrCodeUrl?.trim() || '',
                          depositInstructions: form.depositInstructions,
                          withdrawInstructions: form.withdrawInstructions,
                          minDeposit: Number(form.minDeposit) || undefined,
                          maxDeposit: Number(form.maxDeposit) || undefined,
                          minWithdraw: Number(form.minWithdraw) || undefined,
                          maxWithdraw: Number(form.maxWithdraw) || undefined,
                          depositFee: Number(form.depositFee) || 0,
                          withdrawFee: Number(form.withdrawFee) || 0,
                          bankDetails: {
                            accountHolderName: form.accountHolderName,
                            accountNumber: form.accountNumber,
                            ifscCode: form.ifscCode,
                            bankName: form.bankName,
                          },
                        })
                        toast.success('Payment method updated')
                        setEditing(null)
                        await qc.invalidateQueries({ queryKey: ['admin-payment-methods'] })
                      } catch (e) {
                        toast.error(getErrorMessage(e))
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )
      )}
    </div>
  )
}

export function AdminReferralsPage() {
  const [q, setQ] = useState('')
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminReferrals>> | null>(null)
  return (
    <div className="space-y-4">
      <PageTitle title="Referral Management" />
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sponsor email / mobile / code" />
        <Button onClick={async () => setData(await fetchAdminReferrals(q))}>Search</Button>
      </div>
      {data?.summary ? (
        <Card>
          <p className="font-semibold">{data.user?.fullName}</p>
          <p className="text-sm text-brand-muted">Team: {data.summary.totalTeamMembers}</p>
          <p className="text-sm">Income: {formatINR(data.summary.totalReferralIncome)}</p>
        </Card>
      ) : null}
    </div>
  )
}

export function AdminCommissionPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['commission-settings'], queryFn: fetchCommissionSettings })
  const [rules, setRules] = useState<Array<{ level: number; percentage: number }>>([
    { level: 1, percentage: 10 },
    { level: 2, percentage: 5 },
    { level: 3, percentage: 2 },
  ])
  useEffect(() => {
    if (data?.length) {
      setRules(data.map((r: { level: number; percentage: number }) => ({ level: r.level, percentage: r.percentage })))
    }
  }, [data])
  return (
    <div className="space-y-4">
      <PageTitle title="Commission Settings" subtitle="Rules are versioned on save" />
      {(rules.length ? rules : [{ level: 1, percentage: 10 }, { level: 2, percentage: 5 }, { level: 3, percentage: 2 }]).map((r, idx) => (
        <Card key={r.level} className="grid grid-cols-2 gap-3">
          <Input label="Level" type="number" value={r.level} onChange={(e) => {
            const next = [...rules]
            next[idx] = { ...r, level: Number(e.target.value) }
            setRules(next)
          }} />
          <Input label="Percentage" type="number" value={r.percentage} onChange={(e) => {
            const next = [...rules]
            next[idx] = { ...r, percentage: Number(e.target.value) }
            setRules(next)
          }} />
        </Card>
      ))}
      <Button
        onClick={async () => {
          await updateCommissionSettings(rules)
          toast.success('Commission rules updated')
          await qc.invalidateQueries({ queryKey: ['commission-settings'] })
        }}
      >
        Save Versioned Rules
      </Button>
    </div>
  )
}

export function AdminKycPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-kyc'], queryFn: () => fetchAdminKyc({ status: 'pending' }) })
  return (
    <div className="space-y-3">
      <PageTitle title="KYC Verification" />
      {(data?.data || []).map((k: { _id: string; fullName: string; panMasked?: string; userId?: { email?: string } }) => (
        <Card key={k._id} className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{k.fullName}</p>
            <p className="text-sm text-brand-muted">{k.userId?.email} · {k.panMasked}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => { await approveKyc(k._id); await qc.invalidateQueries({ queryKey: ['admin-kyc'] }); toast.success('Approved') }}>Approve</Button>
            <Button size="sm" variant="danger" onClick={async () => { await rejectKyc(k._id, 'Documents unclear'); await qc.invalidateQueries({ queryKey: ['admin-kyc'] }); toast.success('Rejected') }}>Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function AdminSupportPage() {
  const { data } = useQuery({ queryKey: ['admin-support'], queryFn: () => fetchAdminSupport() })
  return (
    <div className="space-y-3">
      <PageTitle title="Support Tickets" />
      {(data?.data || []).map((t: { _id: string; ticketNumber: string; subject: string; status: string }) => (
        <Card key={t._id} className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{t.subject}</p>
            <p className="text-xs text-brand-muted">{t.ticketNumber}</p>
          </div>
          <StatusBadge status={t.status} />
        </Card>
      ))}
    </div>
  )
}

export function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  return (
    <div className="space-y-4">
      <PageTitle title="Notifications" subtitle="Broadcast announcements to eligible users" />
      <Card className="space-y-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Message</span>
          <textarea className="min-h-28 w-full rounded-2xl border p-3" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <Button
          onClick={async () => {
            await sendAnnouncement({ title, message })
            toast.success('Announcement sent')
            setTitle('')
            setMessage('')
          }}
        >
          Send to all users
        </Button>
      </Card>
    </div>
  )
}

export function AdminReportsPage() {
  const { data } = useQuery({ queryKey: ['admin-report-users'], queryFn: () => fetchReport('users') })
  return (
    <div>
      <PageTitle title="Reports & Analytics" subtitle="Derived from ledger/transaction records" />
      <Card>
        <h3 className="mb-3 font-semibold">User registration report</h3>
        <p className="text-sm text-brand-muted">Total rows: {data?.meta?.total || 0}</p>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.data || []).slice(0, 20).map((u: { _id: string; fullName: string; email: string; createdAt: string }) => (
            <div key={u._id} className="flex justify-between rounded-xl bg-brand-bg px-3 py-2">
              <span>{u.fullName}</span>
              <span className="text-brand-muted">{formatDate(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

export function AdminUsersRolesPage() {
  return (
    <div>
      <PageTitle title="Admin Users & Roles" subtitle="Only Super Admin can create admins via API" />
      <Card>
        <p className="text-sm text-brand-muted">
          Use `npm run create-admin` on the server or POST `/admin/admin-users` as super_admin to provision staff accounts.
        </p>
      </Card>
    </div>
  )
}

export function AdminAuditLogsPage() {
  const { data } = useQuery({ queryKey: ['audit-logs'], queryFn: () => fetchAuditLogs() })
  return (
    <div className="space-y-3">
      <PageTitle title="Audit Logs" />
      {(data?.data || []).map((log: { _id: string; action: string; entityType: string; reason?: string; createdAt: string; adminId?: { fullName?: string } }) => (
        <Card key={log._id}>
          <p className="font-semibold">{log.action}</p>
          <p className="text-sm text-brand-muted">
            {log.adminId?.fullName} · {log.entityType} · {formatDate(log.createdAt)}
          </p>
          {log.reason ? <p className="text-xs">{log.reason}</p> : null}
        </Card>
      ))}
    </div>
  )
}
