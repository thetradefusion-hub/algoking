import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '@/services/authService'
import type { User, UserRole } from '@/types'
import { getErrorMessage } from '@/services/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  platformMode: string
  isAuthenticated: boolean
  isAdmin: boolean
  isImpersonating: boolean
  impersonatedUserName: string | null
  login: (identifier: string, password: string) => Promise<User>
  register: (payload: Parameters<typeof authService.register>[0]) => Promise<User>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
  startImpersonation: (accessToken: string, user: User) => void
  stopImpersonation: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ADMIN_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'finance_manager',
  'support_manager',
  'kyc_manager',
]

const ADMIN_TOKEN_KEY = 'adminAccessToken'
const IMPERSONATION_NAME_KEY = 'impersonationName'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [platformMode, setPlatformMode] = useState(import.meta.env.VITE_PLATFORM_MODE || 'LIVE')
  const [isImpersonating, setIsImpersonating] = useState(
    () => !!localStorage.getItem(ADMIN_TOKEN_KEY)
  )
  const [impersonatedUserName, setImpersonatedUserName] = useState<string | null>(
    () => localStorage.getItem(IMPERSONATION_NAME_KEY)
  )

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const data = await authService.me()
      setUser(data.user)
      setPlatformMode(data.platformMode)
      setIsImpersonating(!!localStorage.getItem(ADMIN_TOKEN_KEY))
      setImpersonatedUserName(localStorage.getItem(IMPERSONATION_NAME_KEY))
    } catch {
      localStorage.removeItem('accessToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await authService.login({ identifier, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(IMPERSONATION_NAME_KEY)
    setIsImpersonating(false)
    setImpersonatedUserName(null)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload: Parameters<typeof authService.register>[0]) => {
    const data = await authService.register(payload)
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(IMPERSONATION_NAME_KEY)
    setIsImpersonating(false)
    setImpersonatedUserName(null)
    setUser(null)
  }, [])

  const startImpersonation = useCallback((accessToken: string, nextUser: User) => {
    const currentAdminToken = localStorage.getItem('accessToken')
    if (currentAdminToken && !localStorage.getItem(ADMIN_TOKEN_KEY)) {
      localStorage.setItem(ADMIN_TOKEN_KEY, currentAdminToken)
    }
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem(IMPERSONATION_NAME_KEY, nextUser.fullName)
    setIsImpersonating(true)
    setImpersonatedUserName(nextUser.fullName)
    setUser(nextUser)
  }, [])

  const stopImpersonation = useCallback(async () => {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(IMPERSONATION_NAME_KEY)
    setIsImpersonating(false)
    setImpersonatedUserName(null)
    if (adminToken) {
      localStorage.setItem('accessToken', adminToken)
      await refreshMe()
      return
    }
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [refreshMe])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      platformMode,
      isAuthenticated: !!user,
      isAdmin: !!user && ADMIN_ROLES.includes(user.role) && !isImpersonating,
      isImpersonating,
      impersonatedUserName,
      login,
      register,
      logout,
      refreshMe,
      startImpersonation,
      stopImpersonation,
    }),
    [
      user,
      loading,
      platformMode,
      isImpersonating,
      impersonatedUserName,
      login,
      register,
      logout,
      refreshMe,
      startImpersonation,
      stopImpersonation,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { getErrorMessage }
