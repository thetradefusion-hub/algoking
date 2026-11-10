import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  binanceWsUrl,
  fetchCryptoMarkets,
  mergeLiveTicker,
  readMarketsCache,
  writeMarketsCache,
  type CryptoMarketQuote,
} from '@/services/cryptoService'

const QUERY_KEY = ['crypto-markets'] as const

/**
 * Instant cache/placeholder → REST (Binance 3s then CoinGecko) → optional Binance WS.
 * Polling keeps prices fresh when WebSocket is blocked (common in some regions).
 */
export function useLiveCryptoMarkets() {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const flashTimers = useRef<Map<string, number>>(new Map())
  const [wsLive, setWsLive] = useState(false)

  const query = useQuery<CryptoMarketQuote[]>({
    queryKey: QUERY_KEY,
    queryFn: fetchCryptoMarkets,
    placeholderData: () => readMarketsCache() ?? undefined,
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 800,
  })

  useEffect(() => {
    if (query.data?.some((r) => r.currentPrice > 0)) {
      writeMarketsCache(query.data)
    }
  }, [query.data])

  useEffect(() => {
    let closed = false
    let retryTimer: number | undefined
    let attempt = 0

    const clearFlash = (symbol: string) => {
      const existing = flashTimers.current.get(symbol)
      if (existing) window.clearTimeout(existing)
      const timer = window.setTimeout(() => {
        qc.setQueryData<CryptoMarketQuote[]>(QUERY_KEY, (prev) => {
          if (!prev) return prev
          return prev.map((row) => (row.binanceSymbol === symbol ? { ...row, flash: null } : row))
        })
        flashTimers.current.delete(symbol)
      }, 650)
      flashTimers.current.set(symbol, timer)
    }

    const connect = () => {
      if (closed) return
      let ws: WebSocket
      try {
        ws = new WebSocket(binanceWsUrl())
      } catch {
        setWsLive(false)
        return
      }
      wsRef.current = ws

      const openTimer = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
        }
      }, 4000)

      ws.onopen = () => {
        window.clearTimeout(openTimer)
        attempt = 0
        setWsLive(true)
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as {
            data?: {
              s: string
              c: string
              P: string
              p: string
              h: string
              l: string
              v: string
              q: string
              E: number
            }
          }
          const msg = payload.data
          if (!msg?.s || !msg?.c) return

          qc.setQueryData<CryptoMarketQuote[]>(QUERY_KEY, (prev) => {
            const base = prev?.length ? prev : []
            const next = mergeLiveTicker(base, msg)
            return next
          })
          clearFlash(msg.s)
        } catch {
          /* ignore */
        }
      }

      ws.onclose = () => {
        window.clearTimeout(openTimer)
        wsRef.current = null
        setWsLive(false)
        if (closed) return
        attempt += 1
        if (attempt > 3) return // stop hammering if blocked; REST polling covers updates
        const delay = Math.min(1500 * 2 ** attempt, 20_000)
        retryTimer = window.setTimeout(connect, delay)
      }

      ws.onerror = () => {
        setWsLive(false)
        try {
          ws.close()
        } catch {
          /* ignore */
        }
      }
    }

    connect()

    return () => {
      closed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      flashTimers.current.forEach((t) => window.clearTimeout(t))
      flashTimers.current.clear()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [qc])

  const data = query.data
  const hasPrices = !!data?.some((r) => r.currentPrice > 0)

  return {
    data: data as CryptoMarketQuote[] | undefined,
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    wsLive,
    hasPrices,
    isLive: hasPrices,
  }
}

export function useLiveCryptoQuote(idOrSymbol?: string) {
  const markets = useLiveCryptoMarkets()
  const key = (idOrSymbol || '').toLowerCase()
  const quote = markets.data?.find(
    (c) =>
      c.id === key ||
      c.symbol.toLowerCase() === key ||
      c.binanceSymbol.toLowerCase() === key
  )
  return { quote, ...markets }
}
