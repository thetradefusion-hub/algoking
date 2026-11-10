import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { BrandLogo } from '@/components/brand/BrandLogo'

export function UserHeader({
  unread = 0,
  userId,
}: {
  unread?: number
  userId?: string
}) {
  const { user } = useAuth()
  const first = user?.fullName || 'Investor'

  return (
    <div>
      {/* Transparent navbar — no brand background */}
      <div className="flex items-center justify-between gap-3 bg-transparent px-4 pb-1 pt-3">
        <Link to="/dashboard" className="flex min-w-0 items-center">
          <BrandLogo size="sm" imgClassName="max-w-[158px]" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-deep/8 text-brand-deep ring-1 ring-brand-deep/10"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Link>
          <Link
            to="/profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full brand-accent-gradient text-sm font-bold text-brand-dark ring-2 ring-white/70"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              first.slice(0, 1).toUpperCase()
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-1 pt-3">
        <h1 className="text-lg font-bold text-brand-text">Hello, {first}</h1>
        <p className="text-xs text-brand-muted">ID: {userId || user?.referralCode || '—'}</p>
      </div>
    </div>
  )
}
