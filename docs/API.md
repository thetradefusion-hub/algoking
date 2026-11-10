# AlgoKing API Overview

Base URL: `/api/v1`

Auth: `Authorization: Bearer <accessToken>`  
Refresh token: HTTP-only cookie `refreshToken` on `/api/v1/auth`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## User
- `GET /users/profile` · `PUT /users/profile` · `PUT /users/change-password`
- `GET /users/dashboard`

## Plans & Orders
- `GET /plans` · `GET /plans/:id`
- `POST /orders` · `GET /orders` · `GET /orders/:id`

## Wallets
- `GET /wallets`
- `GET /wallets/:walletType`
- `GET /wallets/:walletType/transactions`

## Recharge / Withdraw
- `POST /recharges` · `POST /recharges/verify-demo` · `GET /recharges`
- `POST /withdrawals` · `GET /withdrawals`
- `POST /payments/webhook`

## Referrals / KYC / Banks / Notifications / Support
- `/referrals/summary|team|commissions`
- `/kyc` · `/bank-accounts`
- `/notifications` · `/support/tickets`

## Admin (`/admin/*`, admin roles required)
Dashboard, users, plans, orders, wallets, recharges, withdrawals, referrals, commission-settings, kyc, support, notifications, reports, settings, admin-users, audit-logs, transactions
