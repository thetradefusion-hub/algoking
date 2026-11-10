import { api } from './api'
import type { ApiResponse, User } from '@/types'

export async function register(payload: {
  fullName: string
  email: string
  mobile: string
  password: string
  confirmPassword: string
  referralCode?: string
  acceptTerms: true
}) {
  const { data } = await api.post<ApiResponse<{ user: User; accessToken: string }>>(
    '/auth/register',
    payload
  )
  return data.data
}

export async function login(payload: { identifier: string; password: string; rememberMe?: boolean }) {
  const { data } = await api.post<ApiResponse<{ user: User; accessToken: string }>>(
    '/auth/login',
    payload
  )
  return data.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function me() {
  const { data } = await api.get<ApiResponse<{ user: User; platformMode: string }>>('/auth/me')
  return data.data
}

export async function forgotPassword(email: string) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(payload: {
  token: string
  password: string
  confirmPassword: string
}) {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}
