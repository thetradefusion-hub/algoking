import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Layers3,
  ShoppingBag,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  GitBranch,
  Percent,
  ShieldCheck,
  LifeBuoy,
  Bell,
  BarChart3,
  Settings,
  UserCog,
  ScrollText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/plans', label: 'Plans', icon: Layers3 },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { to: '/admin/recharges', label: 'Deposits', icon: ArrowDownToLine },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { to: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { to: '/admin/referrals', label: 'Referrals', icon: GitBranch },
  { to: '/admin/commission-settings', label: 'Commissions', icon: Percent },
  { to: '/admin/kyc', label: 'KYC', icon: ShieldCheck },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/admin-users', label: 'Admin Users', icon: UserCog },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-[#C5D0E0] text-brand-text">
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-72 transform bg-brand-deep text-white transition lg:static lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
            <div className="min-w-0 flex-1">
              {/* Light plate — ribbon wordmark has dark “Algo” text */}
              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.18)] ring-1 ring-white/40">
                <BrandLogo size="md" imgClassName="h-10 max-w-[168px]" />
              </div>
              <p className="mt-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-secondary">
                Admin Control
              </p>
            </div>
            <button
              className="shrink-0 rounded-xl p-2 text-white/80 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="admin-scroll h-[calc(100dvh-96px)] space-y-1 overflow-y-auto px-3 py-4">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-primary text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-primary/10 bg-white/90 px-4 py-3 backdrop-blur">
            <button className="rounded-xl p-2 hover:bg-brand-bg lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs capitalize text-brand-muted">{user?.role?.replaceAll('_', ' ')}</p>
            </div>
            <div className="rounded-full brand-accent-gradient px-3 py-1 text-xs font-bold text-brand-dark">
              Admin
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}
    </div>
  )
}
