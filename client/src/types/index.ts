export type UserRole =
  | 'user'
  | 'admin'
  | 'super_admin'
  | 'finance_manager'
  | 'support_manager'
  | 'kyc_manager'

export interface User {
  id: string
  fullName: string
  username?: string
  email: string
  mobile: string
  role: UserRole
  permissions?: string[]
  referralCode: string
  status: string
  profileImage?: string
  createdAt?: string
  kycStatus?: string
}

export interface Wallet {
  _id: string
  walletType: 'main' | 'income' | 'referral'
  balance: number
  totalCredited: number
  totalDebited: number
  currency: string
}

export interface Plan {
  _id: string
  name: string
  slug: string
  description: string
  image?: string
  iconEmoji?: string
  badgeLabel?: string
  isFeatured?: boolean
  isPopular?: boolean
  investmentAmount: number
  durationDays: number
  projectedDailyIncome: number
  projectedTotalIncome: number
  status: string
  purchaseLimit?: number
  sortOrder?: number
  riskDisclosure?: string
}

export interface InvestmentOrder {
  _id: string
  orderId: string
  planId: string
  planSnapshot: {
    name: string
    investmentAmount: number
    durationDays: number
    projectedDailyIncome: number
    projectedTotalIncome: number
  }
  amount: number
  durationDays: number
  projectedIncomeSnapshot: number
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}
