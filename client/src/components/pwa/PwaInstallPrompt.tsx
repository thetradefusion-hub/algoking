import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  wasInstallDismissed,
} from '@/lib/pwa'
import { cn } from '@/lib/utils'

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplay() || wasInstallDismissed()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setOpen(true)
      setIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS Safari has no beforeinstallprompt — show Add to Home Screen tip
    if (isIosDevice()) {
      const t = window.setTimeout(() => {
        if (!isStandaloneDisplay() && !wasInstallDismissed()) {
          setIosHint(true)
          setOpen(true)
        }
      }, 1800)
      return () => {
        window.clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      }
    }

    // Desktop/Android: if event already missed, still allow a soft prompt later via custom event
    const t = window.setTimeout(() => {
      // Keep closed until beforeinstallprompt; no forced fake popup on desktop without prompt
    }, 0)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  useEffect(() => {
    const onInstalled = () => {
      setOpen(false)
      setDeferred(null)
      dismissInstallPrompt()
    }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  if (!open || isStandaloneDisplay()) return null

  const close = () => {
    dismissInstallPrompt()
    setOpen(false)
  }

  const install = async () => {
    if (!deferred) {
      setIosHint(true)
      return
    }
    setInstalling(true)
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setOpen(false)
        dismissInstallPrompt()
      } else {
        dismissInstallPrompt()
        setOpen(false)
      }
      setDeferred(null)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-4">
      <div
        className={cn(
          'ak-pwa-popup mx-auto flex max-w-md gap-3 rounded-[24px] border border-brand-primary/15 bg-white p-3.5 shadow-[0_18px_48px_rgba(0,27,61,0.22)]'
        )}
        role="dialog"
        aria-label="Install AlgoKing app"
      >
        <img
          src="/pwa-icon-192.png"
          alt="AlgoKing"
          className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-brand-primary/10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                Install App
              </p>
              <h3 className="text-base font-bold text-brand-text">AlgoKing on your home screen</h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-xl p-1.5 text-brand-muted hover:bg-brand-bg"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {iosHint ? (
            <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
              Tap <Share className="inline h-3.5 w-3.5 text-brand-primary" /> Share, then{' '}
              <span className="font-semibold text-brand-text">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
              Install AlgoKing for faster access, full-screen experience, and offline shell support.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {!iosHint ? (
              <Button size="sm" className="flex-1" loading={installing} onClick={() => void install()}>
                <Download className="h-4 w-4" />
                Install
              </Button>
            ) : null}
            <Button size="sm" variant="outline" className={iosHint ? 'flex-1' : ''} onClick={close}>
              {iosHint ? 'Got it' : 'Not now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
