import { useEffect, useState } from 'react'
import { Download, Share, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  type BeforeInstallPromptEvent,
  isIosDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  triggerPwaInstall,
} from '@/lib/pwa'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function PwaInstallButton({ className }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [iosTip, setIosTip] = useState(false)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    setStandalone(isStandaloneDisplay())
    return subscribeInstallPrompt(setDeferred)
  }, [])

  if (standalone) return null

  const onInstall = async () => {
    if (isIosDevice()) {
      setIosTip(true)
      toast.message('Add to Home Screen', {
        description: 'Tap Share, then Add to Home Screen.',
      })
      return
    }

    if (!deferred) {
      toast.message('Install not ready yet', {
        description:
          'Open this site in Chrome/Edge, or use the browser menu → Install App / Add to Home screen.',
      })
      return
    }

    setInstalling(true)
    try {
      const outcome = await triggerPwaInstall()
      if (outcome === 'accepted') {
        toast.success('AlgoKing installed')
        setStandalone(true)
      }
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <button
        type="button"
        disabled={installing}
        onClick={() => void onInstall()}
        className={cn(
          'ak-install-btn brand-gradient flex w-full items-center gap-3 rounded-[22px] px-3.5 py-3.5 text-left text-white',
          'shadow-[0_14px_32px_rgba(0,102,255,0.32)] transition disabled:opacity-70'
        )}
        aria-label="Install AlgoKing App"
      >
        <span className="ak-install-icon relative z-[2] flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <img
            src="/pwa-icon-192.png"
            alt=""
            className="h-9 w-9 rounded-xl object-cover"
          />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-brand-dark shadow-md ring-2 ring-white/80">
            <Download className="ak-install-arrow h-3 w-3" strokeWidth={2.75} />
          </span>
        </span>

        <span className="relative z-[2] min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
            <Sparkles className="h-3 w-3 text-brand-accent" />
            Home screen
          </span>
          <span className="mt-0.5 block text-[15px] font-extrabold leading-tight tracking-tight">
            {installing ? 'Opening installer…' : 'Install AlgoKing App'}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium text-white/75">
            Faster access · Full screen · One tap open
          </span>
        </span>

        <span className="relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Download className="ak-install-arrow h-5 w-5" />
        </span>
      </button>

      {iosTip ? (
        <p className="text-center text-[11px] leading-relaxed text-brand-muted">
          Tap <Share className="inline h-3.5 w-3.5 text-brand-primary" /> Share, then{' '}
          <span className="font-semibold text-brand-text">Add to Home Screen</span>.
        </p>
      ) : (
        <p className="text-center text-[11px] text-brand-muted">
          No popup? Install the app from this button anytime
        </p>
      )}
    </div>
  )
}
