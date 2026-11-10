import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Crown } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { fetchPublicSettings } from '@/services/userService'

export function AuthLayout() {
  const { pathname } = useLocation()
  const isRegister = pathname.includes('register')
  const isLogin = pathname === '/login' || pathname.endsWith('/login')
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-dvh bg-[#b8c4d6]">
      <div className="app-shell relative min-h-dvh overflow-hidden bg-brand-bg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-40 h-64 w-64 rounded-full bg-brand-accent/15 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-brand-secondary/10 blur-3xl" />
        </div>

        {/* Light header — no dark bar so ribbon logo stays clear */}
        <div className="relative bg-transparent px-5 pb-8 pt-10 text-center">
          <div className="relative z-10 mx-auto flex max-w-[280px] items-center justify-center">
            <BrandLogo size="lg" />
          </div>

          <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-deep/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary ring-1 ring-brand-primary/15">
            <Crown className="h-3.5 w-3.5 text-brand-accent" />
            {settings?.platformName || 'AlgoKing'}
          </div>

          <p className="relative z-10 mx-auto mt-3 max-w-[260px] text-sm font-medium text-brand-muted">
            {isRegister
              ? settings?.tagline || 'Create your account'
              : isLogin
                ? 'Welcome back'
                : settings?.tagline || 'Secure your account'}
          </p>
        </div>

        <div className="relative z-10 px-4 pb-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
