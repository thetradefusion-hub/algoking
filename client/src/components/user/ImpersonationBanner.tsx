import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUserName, stopImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!isImpersonating) return null

  return (
    <div className="sticky top-0 z-50 border-b border-brand-accent/30 bg-[#1a1208] px-3 py-2 text-white">
      <div className="mx-auto flex max-w-[430px] items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <ShieldAlert className="h-4 w-4 shrink-0 text-brand-accent" />
          <p className="truncate">
            Viewing as <span className="font-bold text-brand-gold">{impersonatedUserName || 'user'}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 px-2.5 text-[11px]"
          onClick={async () => {
            await stopImpersonation()
            navigate('/admin/users')
          }}
        >
          <LogOut className="mr-1 h-3.5 w-3.5" />
          Exit
        </Button>
      </div>
    </div>
  )
}
