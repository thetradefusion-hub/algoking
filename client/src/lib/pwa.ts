const DISMISS_KEY = 'algoking-pwa-install-dismissed'
const DISMISS_DAYS = 7

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallListener = (event: BeforeInstallPromptEvent | null) => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
let captureStarted = false
const listeners = new Set<InstallListener>()

function notifyListeners() {
  listeners.forEach((listener) => listener(deferredPrompt))
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return mq || iosStandalone
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function wasInstallDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const until = Number(raw)
    if (!Number.isFinite(until)) return false
    return Date.now() < until
  } catch {
    return false
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000))
  } catch {
    // ignore
  }
}

export function getDeferredInstallPrompt() {
  return deferredPrompt
}

export function subscribeInstallPrompt(listener: InstallListener) {
  listeners.add(listener)
  listener(deferredPrompt)
  return () => {
    listeners.delete(listener)
  }
}

/** Capture beforeinstallprompt once so popup + permanent button share the same event. */
export function initPwaInstallCapture() {
  if (typeof window === 'undefined' || captureStarted) return
  captureStarted = true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    dismissInstallPrompt()
    notifyListeners()
  })
}

export async function triggerPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  await event.prompt()
  const { outcome } = await event.userChoice
  deferredPrompt = null
  notifyListeners()
  if (outcome === 'accepted') dismissInstallPrompt()
  return outcome
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (err) {
    console.warn('[AlgoKing PWA] SW registration failed', err)
    return null
  }
}
