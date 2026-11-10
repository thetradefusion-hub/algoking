import { api } from './api'

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data.data
}

export async function fetchAdminUsers(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function fetchAdminUser(id: string) {
  const { data } = await api.get(`/admin/users/${id}`)
  return data.data
}

export async function updateUserStatus(id: string, payload: { status: string; reason: string }) {
  const { data } = await api.patch(`/admin/users/${id}/status`, payload)
  return data.data
}

export async function impersonateAdminUser(id: string) {
  const { data } = await api.post(`/admin/users/${id}/impersonate`)
  return data.data as {
    user: import('@/types').User
    accessToken: string
    impersonatedBy: string
  }
}

export async function fetchAdminPlans() {
  const { data } = await api.get('/admin/plans')
  return data.data.plans
}

export async function createPlan(payload: Record<string, unknown>) {
  const { data } = await api.post('/admin/plans', payload)
  return data.data
}

export async function updatePlan(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/plans/${id}`, payload)
  return data.data
}

export async function archivePlan(id: string) {
  const { data } = await api.delete(`/admin/plans/${id}`)
  return data.data
}

export async function duplicatePlan(id: string) {
  const { data } = await api.post(`/admin/plans/${id}/duplicate`)
  return data.data
}

export async function fetchAdminOrders(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/orders', { params })
  return data
}

export async function fetchAdminRecharges(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/recharges', { params })
  return data
}

export async function approveRecharge(id: string, reason = 'Admin approved') {
  const { data } = await api.post(`/admin/recharges/${id}/approve`, { reason })
  return data.data
}

export async function fetchAdminPaymentMethods() {
  const { data } = await api.get('/admin/payment-methods')
  return data.data.methods
}

export async function updateAdminPaymentMethod(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/payment-methods/${id}`, payload)
  return data.data.method
}

export async function rejectRecharge(id: string, reason: string) {
  const { data } = await api.post(`/admin/recharges/${id}/reject`, { reason })
  return data.data
}

export async function fetchAdminWithdrawals(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/withdrawals', { params })
  return data
}

export async function approveWithdrawal(id: string) {
  const { data } = await api.post(`/admin/withdrawals/${id}/approve`, {})
  return data.data
}

export async function rejectWithdrawal(id: string, reason: string) {
  const { data } = await api.post(`/admin/withdrawals/${id}/reject`, { reason })
  return data.data
}

export async function markWithdrawalPaid(id: string, payoutReference: string) {
  const { data } = await api.post(`/admin/withdrawals/${id}/mark-paid`, { payoutReference })
  return data.data
}

export async function fetchAdminKyc(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/kyc', { params })
  return data
}

export async function approveKyc(id: string) {
  const { data } = await api.post(`/admin/kyc/${id}/approve`)
  return data.data
}

export async function rejectKyc(id: string, reason: string) {
  const { data } = await api.post(`/admin/kyc/${id}/reject`, { reason })
  return data.data
}

export async function fetchAdminSupport(params?: Record<string, unknown>) {
  const { data } = await api.get('/admin/support', { params })
  return data
}

export async function fetchAdminSettings() {
  const { data } = await api.get('/admin/settings')
  return data.data.settings
}

export async function updateAdminSettings(settings: Array<{ key: string; value: unknown; category?: string }>) {
  const { data } = await api.put('/admin/settings', { settings })
  return data.data
}

export async function fetchCommissionSettings() {
  const { data } = await api.get('/admin/commission-settings')
  return data.data.rules
}

export async function updateCommissionSettings(rules: Array<Record<string, unknown>>) {
  const { data } = await api.put('/admin/commission-settings', { rules })
  return data.data
}

export async function fetchAuditLogs(page = 1) {
  const { data } = await api.get('/admin/audit-logs', { params: { page } })
  return data
}

export async function searchWallet(q: string) {
  const { data } = await api.get('/admin/wallets', { params: { q } })
  return data.data
}

export async function adjustWallet(payload: {
  userId: string
  walletType: string
  type: 'credit' | 'debit'
  amount: number
  reason: string
}) {
  const { data } = await api.post('/admin/wallets/adjust', payload)
  return data.data
}

export async function sendAnnouncement(payload: {
  title: string
  message: string
  statusFilter?: string
}) {
  const { data } = await api.post('/admin/notifications', payload)
  return data.data
}

export async function fetchReport(type: string, params?: Record<string, unknown>) {
  const { data } = await api.get(`/admin/reports/${type}`, { params })
  return data
}

export async function fetchAdminReferrals(q: string) {
  const { data } = await api.get('/admin/referrals', { params: { q } })
  return data.data
}
