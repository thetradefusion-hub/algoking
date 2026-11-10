import { useEffect, useId, useRef } from 'react'

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => { remove?: () => void }
    }
  }
}

type Props = {
  symbol: string
  height?: number
}

let tvScriptPromise: Promise<void> | null = null

function loadTradingViewScript() {
  if (window.TradingView) return Promise.resolve()
  if (tvScriptPromise) return tvScriptPromise

  tvScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('tradingview-widget-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('TradingView failed to load')))
      if (window.TradingView) resolve()
      return
    }

    const script = document.createElement('script')
    script.id = 'tradingview-widget-script'
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('TradingView failed to load'))
    document.body.appendChild(script)
  })

  return tvScriptPromise
}

export function TradingViewChart({ symbol, height = 420 }: Props) {
  const reactId = useId().replace(/:/g, '')
  const containerId = `tv_chart_${reactId}`
  const widgetRef = useRef<{ remove?: () => void } | null>(null)

  useEffect(() => {
    let cancelled = false

    const mount = async () => {
      try {
        await loadTradingViewScript()
        if (cancelled || !window.TradingView) return

        const el = document.getElementById(containerId)
        if (el) el.innerHTML = ''

        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: '15',
          timezone: 'Asia/Kolkata',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#F7F4FB',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          hide_side_toolbar: true,
          allow_symbol_change: false,
          withdateranges: true,
          details: false,
          hotlist: false,
          calendar: false,
          support_host: 'https://www.tradingview.com',
        })
      } catch {
        // Widget load failure is non-fatal; page still shows price + CTA
      }
    }

    void mount()

    return () => {
      cancelled = true
      try {
        widgetRef.current?.remove?.()
      } catch {
        /* ignore */
      }
      widgetRef.current = null
      const el = document.getElementById(containerId)
      if (el) el.innerHTML = ''
    }
  }, [symbol, containerId])

  return (
    <div className="overflow-hidden rounded-[22px] border border-brand-primary/10 bg-white shadow-[0_10px_28px_rgba(0,27,61,0.08)]">
      <div id={containerId} style={{ height, width: '100%' }} />
      <div className="border-t border-brand-primary/5 px-3 py-2 text-center text-[10px] text-brand-muted">
        Live chart by{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-primary"
        >
          TradingView
        </a>
      </div>
    </div>
  )
}
