import { api } from './api'
import type { ApiResponse, InvestmentOrder, Plan, Wallet } from '@/types'

export async function fetchDashboard() {
  const { data } = await api.get('/users/dashboard')
  return data.data
}

export async function fetchProfile() {
  const { data } = await api.get('/users/profile')
  return data.data
}

export async function fetchPlans() {
  const { data } = await api.get<ApiResponse<{ plans: Plan[] }>>('/plans')
  return data.data
}

export async function fetchPlan(id: string) {
  const { data } = await api.get<ApiResponse<{ plan: Plan }>>(`/plans/${id}`)
  return data.data.plan
}

export async function purchasePlan(planId: string, idempotencyKey: string) {
  const { data } = await api.post('/orders', { planId, idempotencyKey })
  return data.data
}

export async function fetchOrders(params?: { page?: number; status?: string }) {
  const { data } = await api.get('/orders', { params })
  return data
}

export async function fetchOrder(id: string) {
  const { data } = await api.get<ApiResponse<{ order: InvestmentOrder }>>(`/orders/${id}`)
  return data.data.order
}

export async function fetchWallets() {
  const { data } = await api.get<ApiResponse<{ wallets: Wallet[]; limits: Record<string, number | string> }>>(
    '/wallets'
  )
  return data.data
}

export async function fetchWalletTransactions(walletType: string, page = 1) {
  const { data } = await api.get(`/wallets/${walletType}/transactions`, { params: { page } })
  return data
}

export type PaymentMethod = {
  id: string
  code: 'bep20' | 'trc20' | 'inr_upi' | 'inr_bank'
  name: string
  kind: 'crypto' | 'fiat'
  network?: string
  currency: string
  iconUrl: string
  depositEnabled: boolean
  withdrawEnabled: boolean
  depositAddress?: string
  upiId?: string
  bankDetails?: {
    accountHolderName?: string
    accountNumber?: string
    ifscCode?: string
    bankName?: string
  }
  depositInstructions?: string
  withdrawInstructions?: string
  minDeposit: number
  maxDeposit: number
  minWithdraw: number
  maxWithdraw: number
  depositFee: number
  withdrawFee: number
}

export async function fetchPaymentMethods(forType?: 'deposit' | 'withdraw') {
  const { data } = await api.get('/payment-methods', { params: forType ? { for: forType } : undefined })
  return data.data.methods as PaymentMethod[]
}

export async function initiateRecharge(amount: number, idempotencyKey: string) {
  const { data } = await api.post('/recharges', { amount, idempotencyKey })
  return data.data
}

export async function submitManualDeposit(payload: {
  amount: number
  paymentMethodId: string
  proofReference: string
  userNote?: string
  idempotencyKey: string
}) {
  const { data } = await api.post('/recharges/manual', payload)
  return data.data
}

export async function verifyDemoRecharge(providerOrderId: string) {
  const { data } = await api.post('/recharges/verify-demo', { providerOrderId })
  return data.data
}

export async function fetchRecharges(page = 1) {
  const { data } = await api.get('/recharges', { params: { page } })
  return data
}

export async function requestWithdrawal(payload: {
  amount: number
  walletType: 'main' | 'income' | 'referral'
  paymentMethodId?: string
  bankAccountId?: string
  destinationAddress?: string
  destinationUpi?: string
  idempotencyKey: string
}) {
  const { data } = await api.post('/withdrawals', payload)
  return data.data
}

export async function fetchWithdrawals(page = 1) {
  const { data } = await api.get('/withdrawals', { params: { page } })
  return data
}

export async function fetchReferralSummary() {
  const { data } = await api.get('/referrals/summary')
  return data.data
}

export async function fetchTeam(level?: number, page = 1) {
  const { data } = await api.get('/referrals/team', { params: { level, page } })
  return data
}

export async function fetchKyc() {
  const { data } = await api.get('/kyc')
  return data.data
}

export async function submitKyc(payload: Record<string, unknown>) {
  const { data } = await api.post('/kyc', payload)
  return data.data
}

export async function fetchBanks() {
  const { data } = await api.get('/bank-accounts')
  return data.data.accounts
}

export async function addBank(payload: Record<string, unknown>) {
  const { data } = await api.post('/bank-accounts', payload)
  return data.data.account
}

export async function deleteBank(id: string) {
  const { data } = await api.delete(`/bank-accounts/${id}`)
  return data.data
}

export async function fetchNotifications(page = 1) {
  const { data } = await api.get('/notifications', { params: { page } })
  return data
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data.data
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export async function fetchTickets(page = 1) {
  const { data } = await api.get('/support/tickets', { params: { page } })
  return data
}

export async function createTicket(payload: {
  subject: string
  category: string
  message: string
}) {
  const { data } = await api.post('/support/tickets', payload)
  return data.data
}

export async function fetchTicket(id: string) {
  const { data } = await api.get(`/support/tickets/${id}`)
  return data.data
}

export async function replyTicket(id: string, message: string) {
  const { data } = await api.post(`/support/tickets/${id}/messages`, { message })
  return data.data
}

export async function fetchPublicSettings() {
  const { data } = await api.get('/settings/public')
  return data.data
}
