import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedAdminRoute, ProtectedUserRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { PrivacyPage, TermsPage } from '@/pages/auth/LegalPages'
import { DashboardPage } from '@/pages/user/DashboardPage'
import { PlansPage } from '@/pages/user/PlansPage'
import { PlanDetailsPage } from '@/pages/user/PlanDetailsPage'
import { MarketsPage } from '@/pages/user/MarketsPage'
import { CryptoDetailPage } from '@/pages/user/CryptoDetailPage'
import { TeamPage } from '@/pages/user/TeamPage'
import { ProfilePage } from '@/pages/user/ProfilePage'
import { WalletDetailPage, WalletOverviewPage } from '@/pages/user/WalletPages'
import { RechargePage } from '@/pages/user/RechargePage'
import { WithdrawPage } from '@/pages/user/WithdrawPage'
import { OrderDetailsPage, OrdersPage } from '@/pages/user/OrdersPage'
import {
  BanksPage,
  EditProfilePage,
  KycPage,
  NotificationsPage,
  SupportDetailPage,
  SupportPage,
} from '@/pages/user/KycBankSupportPages'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import {
  AdminAuditLogsPage,
  AdminCommissionPage,
  AdminKycPage,
  AdminNotificationsPage,
  AdminOrdersPage,
  AdminPaymentMethodsPage,
  AdminPlansPage,
  AdminRechargesPage,
  AdminReferralsPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminSupportPage,
  AdminUserDetailPage,
  AdminUsersPage,
  AdminUsersRolesPage,
  AdminWalletsPage,
  AdminWithdrawalsPage,
} from '@/pages/admin/AdminModules'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedUserRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/markets/:id" element={<CryptoDetailPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/:id" element={<PlanDetailsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/wallet" element={<WalletOverviewPage />} />
          <Route path="/wallet/recharge" element={<RechargePage />} />
          <Route path="/wallet/withdraw" element={<WithdrawPage />} />
          <Route path="/wallet/:type" element={<WalletDetailPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/kyc" element={<KycPage />} />
          <Route path="/profile/banks" element={<BanksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:id" element={<SupportDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="wallets" element={<AdminWalletsPage />} />
          <Route path="recharges" element={<AdminRechargesPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
          <Route path="referrals" element={<AdminReferralsPage />} />
          <Route path="commission-settings" element={<AdminCommissionPage />} />
          <Route path="kyc" element={<AdminKycPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="admin-users" element={<AdminUsersRolesPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
