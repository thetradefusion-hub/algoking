import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

function resolveApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  const isLocal =
    !fromEnv ||
    /localhost|127\.0\.0\.1/i.test(fromEnv)

  // Production builds must never call the developer's machine.
  if (import.meta.env.PROD) {
    if (!fromEnv || isLocal) {
      console.error(
        '[AlgoKing] VITE_API_BASE_URL is missing or points to localhost. ' +
          'Set it in Vercel → Settings → Environment Variables to your Railway/Render API, e.g. ' +
          'https://your-api.up.railway.app/api/v1 — then Redeploy.'
      )
      // Prefer relative path over localhost so the failure is obvious in Network tab.
      return fromEnv && !isLocal ? fromEnv.replace(/\/$/, '') : '/api/v1'
    }
    return fromEnv.replace(/\/$/, '')
  }

  return (fromEnv || 'http://localhost:5000/api/v1').replace(/\/$/, '')
}

export const baseURL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    )
    const token = data?.data?.accessToken as string | undefined
    if (token) {
      localStorage.setItem('accessToken', token)
      return token
    }
    return null
  } catch {
    localStorage.removeItem('accessToken')
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry) {
      if (original.url?.includes('/auth/login') || original.url?.includes('/auth/register')) {
        return Promise.reject(error)
      }
      original._retry = true
      refreshing = refreshing || refreshAccessToken()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message || err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
