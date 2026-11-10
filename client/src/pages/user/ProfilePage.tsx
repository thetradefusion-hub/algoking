import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronRight,
  Copy,
  CreditCard,
  Crown,
  HandCoins,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Users,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchProfile, fetchWallets } from '@/services/userService'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/types'

const menu = [
  {
    to: '/orders',
    label: 'My Orders',
    icon: ShoppingBag,
    hint: 'View investments',
    tone: 'bg-[#E7F1FF] text-brand-primary',
  },
  {
    to: '/profile/kyc',
    label: 'KYC Verification',
    icon: ShieldCheck,
    hint: 'Verify identity',
    tone: 'bg-[#E6F7EF] text-brand-success',
  },
  {
    to: '/profile/banks',
    label: 'Bank Accounts',
    icon: Building2,
    hint: 'Payout accounts',
    tone: 'bg-[#FFF4D6] text-[#B8860B]',
  },
  {
    to: '/wallet',
    label: 'Transactions',
    icon: CreditCard,
    hint: 'Wallet activity',
    tone: 'bg-[#E7F1FF] text-brand-primary',
  },
  {
    to: '/team',
    label: 'My Team',
    icon: Users,
    hint: 'Referral network',
    tone: 'bg-[#FCE7F3] text-[#BE185D]',
  },
  {
    to: '/support',
    label: 'Help & Support',
    icon: LifeBuoy,
    hint: 'Get assistance',
    tone: 'bg-[#E0F2FE] text-[#0284C7]',
  },
]

const walletMeta: Record<
  Wallet['walletType'],
  { label: string; icon: typeof WalletCards; chip: string }
> = {
  main: { label: 'Main', icon: WalletCards, chip: 'bg-[#E7F1FF] text-brand-primary' },
  income: { label: 'Income', icon: HandCoins, chip: 'bg-[#E6F7EF] text-brand-success' },
  referral: { label: 'Referral', icon: UsersRound, chip: 'bg-[#FFF4D6] text-[#B8860B]' },
}

export function ProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile })
  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const user = data?.user
  const wallets = walletsQuery.data?.wallets || []
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)

  const copyId = async () => {
    if (!user?.referralCode) return
    await navigator.clipboard.writeText(user.referralCode)
    toast.success('ID copied')
  }

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-16 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <Crown className="pointer-events-none absolute -right-2 top-8 h-24 w-24 text-brand-gold/15" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
            AlgoKing Account
          </p>

          {isLoading ? (
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full bg-white/15" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40 rounded-lg bg-white/15" />
                <Skeleton className="h-4 w-28 rounded-lg bg-white/15" />
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold ring-2 ring-brand-gold/50 backdrop-blur-sm">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    user?.fullName?.slice(0, 1)?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-brand-dark shadow">
                  <Crown className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-extrabold tracking-tight">
                  {user?.fullName || '—'}
                </h1>
                <button
                  onClick={copyId}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-brand-gold ring-1 ring-white/15"
                >
                  ID: {user?.referralCode || '—'}
                  <Copy className="h-3 w-3" />
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={user?.kycStatus || 'not_submitted'} />
                  <StatusBadge status={user?.status || 'inactive'} />
                </div>
              </div>
            </div>
          )}

          {!isLoading && (
            <div className="mt-4 space-y-1 text-xs text-white/70">
              <p className="truncate">{user?.email || '—'}</p>
              <p>{user?.mobile || '—'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 -mt-12 space-y-4 px-4">
        {/* Balance card */}
        <div className="ak-card overflow-hidden p-0 shadow-[0_14px_32px_rgba(0,27,61,0.12)]">
          <div className="brand-gradient-soft px-4 py-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Total Balance
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">
              {walletsQuery.isLoading ? '—' : formatINR(totalBalance)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to="/wallet/recharge"
                className="rounded-2xl bg-white py-2.5 text-center text-sm font-semibold text-brand-primary"
              >
                Deposit
              </Link>
              <Link
                to="/wallet/withdraw"
                className="rounded-2xl border border-white/40 bg-white/10 py-2.5 text-center text-sm font-semibold text-white"
              >
                Withdraw
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            {(['main', 'income', 'referral'] as const).map((type) => {
              const meta = walletMeta[type]
              const Icon = meta.icon
              const wallet = wallets.find((w) => w.walletType === type)
              return (
                <Link
                  key={type}
                  to={`/wallet/${type}`}
                  className="rounded-2xl bg-brand-bg p-2.5 text-center transition hover:-translate-y-0.5"
                >
                  <span
                    className={cn(
                      'mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl',
                      meta.chip
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[10px] font-medium text-brand-muted">{meta.label}</p>
                  <p className="mt-0.5 text-[12px] font-bold leading-tight text-brand-text">
                    {formatINR(wallet?.balance || 0)}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="mb-2 px-0.5 text-sm font-bold text-brand-text">Account</h2>
          <div className="ak-card divide-y divide-brand-bg/80 overflow-hidden p-0">
            {menu.map(({ to, label, icon: Icon, hint, tone }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between px-3.5 py-3.5 transition hover:bg-brand-bg/50"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl',
                      tone
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-brand-text">{label}</span>
                    <span className="block text-[11px] text-brand-muted">{hint}</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-brand-muted" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          className="ak-card flex w-full items-center justify-center gap-2 p-3.5 text-sm font-semibold text-brand-danger transition hover:bg-brand-danger/5"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
