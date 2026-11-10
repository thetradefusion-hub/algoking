import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1')

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
