import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicSettings } from '@/services/userService'
import {
  getCurrencyConfig,
  setCurrencyConfig,
  subscribeCurrency,
  type CurrencyConfig,
  type ProjectCurrency,
} from '@/lib/currencyStore'
import { useSyncExternalStore } from 'react'

interface CurrencyContextValue extends CurrencyConfig {
  refresh: () => void
  setLocalCurrency: (currency: ProjectCurrency) => void
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['public-settings', 'currency'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!query.data) return
    setCurrencyConfig({
      projectCurrency: query.data.projectCurrency === 'USDT' ? 'USDT' : 'INR',
      usdtInrRate: Number(query.data.usdtInrRate) || 90,
    })
  }, [query.data])

  const live = useSyncExternalStore(subscribeCurrency, getCurrencyConfig, getCurrencyConfig)

  const value = useMemo<CurrencyContextValue>(
    () => ({
      ...live,
      refresh: () => {
        void query.refetch()
      },
      setLocalCurrency: (currency) => setCurrencyConfig({ projectCurrency: currency }),
    }),
    [live, query]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    return {
      ...getCurrencyConfig(),
      refresh: () => undefined,
      setLocalCurrency: (currency: ProjectCurrency) => setCurrencyConfig({ projectCurrency: currency }),
    }
  }
  return ctx
}
