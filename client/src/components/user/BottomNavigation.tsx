import { NavLink, useLocation } from 'react-router-dom'
import { CandlestickChart, Home, Layers3, UserRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/dashboard', label: 'Home', icon: Home, match: (p: string) => p.startsWith('/dashboard') },
  { to: '/plans', label: 'Plans', icon: Layers3, match: (p: string) => p.startsWith('/plans') },
  { to: '/markets', label: 'Market', icon: CandlestickChart, match: (p: string) => p.startsWith('/markets') },
  { to: '/team', label: 'Team', icon: Users, match: (p: string) => p.startsWith('/team') },
  { to: '/profile', label: 'Profile', icon: UserRound, match: (p: string) => p.startsWith('/profile') },
] as const

export function BottomNavigation() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-brand-primary/10 bg-white/95 pb-safe shadow-[0_-6px_20px_rgba(0,27,61,0.08)] backdrop-blur-xl">
      <div className="grid grid-cols-5 px-1 pt-1">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition',
                active ? 'text-brand-primary' : 'text-brand-muted'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl transition',
                  active && 'bg-brand-primary/10'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>
                {label}
              </span>
              {active ? (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand-primary" />
              ) : null}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
