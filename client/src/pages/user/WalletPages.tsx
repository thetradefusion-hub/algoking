import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  ChevronRight,
  HandCoins,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { fetchWalletTransactions, fetchWallets } from '@/services/userService'
import { formatDate, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/types'

const walletMeta: Record<
  Wallet['walletType'],
  {
    label: string
    hint: string
    icon: typeof WalletCards
    accent: string
  }
> = {
  main: {
    label: 'Main Wallet',
    hint: 'Deposit & investments',
    icon: WalletCards,
    accent: 'from-[#0066FF] to-[#0052CC]',
  },
  income: {
    label: 'Income Wallet',
    hint: 'Daily plan earnings',
    icon: HandCoins,
    accent: 'from-[#16A36A] to-[#0F8A56]',
  },
  referral: {
    label: 'Referral Wallet',
    hint: 'Team commission income',
    icon: UsersRound,
    accent: 'from-[#E7A23B] to-[#C4691A]',
  },
}

const walletOrder: Wallet['walletType'][] = ['main', 'income', 'referral']

export function WalletOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const wallets = data?.wallets || []
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0)
  const totalIn = wallets.reduce((sum, w) => sum + Number(w.totalCredited || 0), 0)
  const totalOut = wallets.reduce((sum, w) => sum + Number(w.totalDebited || 0), 0)

  const sorted = walletOrder
    .map((type) => wallets.find((w) => w.walletType === type))
    .filter(Boolean) as Wallet[]

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-44 rounded-[18px]" />
        <Skeleton className="h-28 rounded-[18px]" />
        <Skeleton className="h-28 rounded-[18px]" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-14 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <Link to="/profile" className="text-sm font-semibold text-white/80">
            ← Profile
          </Link>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                AlgoKing Wallet
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">My Wallets</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <WalletCards className="h-6 w-6 text-brand-gold" />
            </div>
          </div>

          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-white/65">
            Total Balance
          </p>
          <p className="mt-0.5 text-3xl font-extrabold tracking-tight">{formatINR(totalBalance)}</p>
        </div>
      </div>

      {/* Overlapping summary card — avoids text clipping */}
      <div className="relative z-10 -mt-10 space-y-4 px-4">
        <div className="ak-card overflow-hidden p-0 shadow-[0_14px_32px_rgba(0,27,61,0.12)]">
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-2xl bg-[#E6F7EF] px-3 py-3">
              <p className="text-[10px] font-medium text-brand-muted">Total In</p>
              <p className="mt-0.5 text-sm font-bold text-brand-success">{formatINR(totalIn)}</p>
            </div>
            <div className="rounded-2xl bg-[#FCEAEA] px-3 py-3">
              <p className="text-[10px] font-medium text-brand-muted">Total Out</p>
              <p className="mt-0.5 text-sm font-bold text-brand-danger">{formatINR(totalOut)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-brand-bg px-3 pb-3 pt-1">
            <Link
              to="/wallet/recharge"
              className="brand-gradient flex h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,102,255,0.22)]"
            >
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </Link>
            <Link
              to="/wallet/withdraw"
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border-2 border-brand-primary/20 text-sm font-semibold text-brand-primary"
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-brand-text">Wallet Breakdown</h2>
          <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
            {sorted.length} wallets
          </span>
        </div>

        {sorted.length ? (
          <div className="space-y-3">
            {sorted.map((w) => {
              const meta = walletMeta[w.walletType] || walletMeta.main
              const Icon = meta.icon
              return (
                <Link
                  key={w._id}
                  to={`/wallet/${w.walletType}`}
                  className="ak-card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,27,61,0.12)]"
                >
                  <div className={cn('h-1.5 w-full bg-gradient-to-r', meta.accent)} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_18px_rgba(0,27,61,0.18)]',
                          meta.accent
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[15px] font-bold text-brand-text">{meta.label}</p>
                            <p className="text-[11px] text-brand-muted">{meta.hint}</p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 text-brand-muted" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-text">
                          {formatINR(w.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-[#E6F7EF] px-3 py-2.5">
                        <p className="text-[10px] text-brand-muted">Credited</p>
                        <p className="mt-0.5 text-sm font-bold text-brand-success">
                          {formatINR(w.totalCredited)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#FCEAEA] px-3 py-2.5">
                        <p className="text-[10px] text-brand-muted">Debited</p>
                        <p className="mt-0.5 text-sm font-bold text-brand-danger">
                          {formatINR(w.totalDebited)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState title="No wallets found" />
        )}
      </div>
    </div>
  )
}

export function WalletDetailPage() {
  const { type } = useParams()
  const walletType = (type || 'main') as Wallet['walletType']
  const meta = walletMeta[walletType] || walletMeta.main
  const Icon = meta.icon

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const txns = useQuery({
    queryKey: ['wallet-txns', walletType],
    queryFn: () => fetchWalletTransactions(walletType),
  })
  const wallet = wallets.data?.wallets?.find((w) => w.walletType === walletType)
  const transactions = txns.data?.data || []

  return (
    <div className="pb-4">
      <div className={cn('relative overflow-hidden bg-gradient-to-br px-4 pb-14 pt-5 text-white', meta.accent)}>
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <Link to="/wallet" className="relative z-10 text-sm font-semibold text-white/80">
          ← Wallets
        </Link>

        <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {meta.label}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatINR(wallet?.balance)}</p>
            <p className="mt-1 text-xs text-white/70">{meta.hint}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-10 space-y-4 px-4">
        <div className="ak-card overflow-hidden p-0 shadow-[0_14px_32px_rgba(0,27,61,0.12)]">
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-2xl bg-[#E6F7EF] px-3 py-3">
              <p className="text-[10px] text-brand-muted">Credited</p>
              <p className="mt-0.5 text-sm font-bold text-brand-success">
                {formatINR(wallet?.totalCredited)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FCEAEA] px-3 py-3">
              <p className="text-[10px] text-brand-muted">Debited</p>
              <p className="mt-0.5 text-sm font-bold text-brand-danger">
                {formatINR(wallet?.totalDebited)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-brand-bg px-3 pb-3 pt-1">
            {walletType === 'main' ? (
              <Link
                to="/wallet/recharge"
                className="brand-gradient flex h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white"
              >
                <ArrowDownToLine className="h-4 w-4" /> Deposit
              </Link>
            ) : (
              <div />
            )}
            <Link
              to={`/wallet/withdraw?wallet=${walletType}`}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold',
                walletType === 'main'
                  ? 'border-2 border-brand-primary/20 text-brand-primary'
                  : 'brand-gradient col-span-2 text-white'
              )}
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-brand-text">Transactions</h2>
          <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
            {transactions.length} shown
          </span>
        </div>

        {txns.isLoading || wallets.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-[18px]" />
            <Skeleton className="h-20 rounded-[18px]" />
          </div>
        ) : transactions.length ? (
          <div className="space-y-2">
            {transactions.map(
              (tx: {
                _id: string
                transactionId: string
                type: string
                amount: number
                description: string
                status: string
                createdAt: string
              }) => {
                const isCredit = tx.type === 'credit'
                return (
                  <div key={tx._id} className="ak-card p-3.5">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                          isCredit ? 'bg-[#E6F7EF] text-brand-success' : 'bg-[#FCEAEA] text-brand-danger'
                        )}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-brand-text">{tx.description}</p>
                          <p
                            className={cn(
                              'shrink-0 text-sm font-bold',
                              isCredit ? 'text-brand-success' : 'text-brand-danger'
                            )}
                          >
                            {isCredit ? '+' : '-'}
                            {formatINR(tx.amount)}
                          </p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusBadge status={tx.status} />
                          <span className="text-[11px] text-brand-muted">{formatDate(tx.createdAt)}</span>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-brand-muted">{tx.transactionId}</p>
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        ) : (
          <EmptyState title="No transactions" description="Activity for this wallet will appear here." />
        )}
      </div>
    </div>
  )
}
