import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BottomNavigation } from '@/components/user/BottomNavigation'
import { ImpersonationBanner } from '@/components/user/ImpersonationBanner'
import { fetchPublicSettings } from '@/services/userService'

export function UserLayout() {
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-dvh bg-[#b8c4d6]">
      <div className="app-shell">
        <ImpersonationBanner />
        {settings?.maintenanceMode ? (
          <div className="bg-[#9a6510] px-4 py-2 text-center text-xs font-semibold text-white">
            Maintenance in progress
            {settings.supportEmail ? ` · ${settings.supportEmail}` : ''}
            {settings.supportPhone ? ` · ${settings.supportPhone}` : ''}
          </div>
        ) : null}
        <div className="safe-bottom min-h-dvh bg-brand-bg">
          <Outlet />
        </div>
        <BottomNavigation />
      </div>
    </div>
  )
}
