# AlgoKing – Development Plan & Checklist

## Repository Status
- Empty monorepo bootstrapped into `client/` (Vite React TS) and `server/` (Express TS)
- Node.js v24.12.0 / npm 11.6.2

## Final Folder Structure

```
algoking/
├── client/                 # User + Admin SPA (Vite React TS)
│   └── src/
│       ├── components/     # user/ + admin/ + ui/
│       ├── layouts/
│       ├── pages/          # auth/ + user/ + admin/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── utils/
│       ├── routes/
│       ├── assets/
│       ├── lib/
│       ├── types/
│       └── main.tsx
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── validators/
│       ├── utils/
│       ├── jobs/
│       ├── scripts/
│       └── app.ts
├── docs/
├── .gitignore
└── README.md
```

## Environment Variables

### Server
| Variable | Purpose |
|---|---|
| `NODE_ENV` | development / production |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES` | e.g. 15m |
| `JWT_REFRESH_EXPIRES` | e.g. 7d |
| `CLIENT_URL` | Frontend origin for CORS |
| `COOKIE_SECURE` | true in production |
| `PLATFORM_MODE` | DEMO \| LIVE |
| `ENCRYPTION_KEY` | 32-byte key for PAN/bank encryption |
| `CLOUDINARY_CLOUD_NAME` | Optional uploads |
| `CLOUDINARY_API_KEY` | Optional |
| `CLOUDINARY_API_SECRET` | Optional |
| `PAYMENT_GATEWAY` | demo \| razorpay |
| `RAZORPAY_KEY_ID` | Sandbox/live key |
| `RAZORPAY_KEY_SECRET` | Server-only secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification |
| `UPLOAD_DIR` | Local private upload path |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window |
| `RATE_LIMIT_MAX` | Max requests per window |
| `SUPER_ADMIN_EMAIL` | Seed admin email |
| `SUPER_ADMIN_PASSWORD` | Seed admin password |
| `SUPER_ADMIN_MOBILE` | Seed admin mobile |

### Client
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base (e.g. http://localhost:5000/api/v1) |
| `VITE_APP_NAME` | AlgoKing |
| `VITE_PLATFORM_MODE` | DEMO (display-only hint) |

## MongoDB Collection Relationships

```
users ──┬── wallets (1:3 by walletType)
        ├── wallettransactions (1:N)
        ├── userkycs (1:1)
        ├── bankAccounts (1:N)
        ├── investmentOrders (1:N) ──► plans
        ├── rechargeRequests (1:N) ──► paymentTransactions
        ├── withdrawalRequests (1:N) ──► bankAccounts
        ├── referrals (as userId & sponsorId)
        ├── commissionLedger (as earner & source)
        ├── notifications (1:N)
        └── supportTickets (1:N) ──► supportMessages

commissionRules (versioned settings)
appSettings (key/value CMS)
adminAuditLogs (admin actions)
```

Financial integrity rules:
- Wallet balance changes **only** via ledger + MongoDB transactions
- Orders snapshot plan/projection at purchase time
- Commission rules snapshotted per qualifying event
- Idempotency keys on recharge/webhook/purchase

## API Architecture

Base: `/api/v1`

| Module | Prefix | Auth |
|---|---|---|
| Auth | `/auth` | Public + refresh |
| Users | `/users` | User JWT |
| Plans | `/plans` | Public/auth |
| Orders | `/orders` | User |
| Wallets | `/wallets` | User |
| Recharges | `/recharges` | User |
| Withdrawals | `/withdrawals` | User |
| Referrals | `/referrals` | User |
| KYC | `/kyc` | User |
| Bank Accounts | `/bank-accounts` | User |
| Notifications | `/notifications` | User |
| Support | `/support` | User |
| Payments | `/payments` | Webhook + user |
| Admin | `/admin/*` | Admin RBAC |

## UI Design System

Brand: **AlgoKing** — *Grow Your Future.*

| Token | Value |
|---|---|
| Primary | `#302137` |
| Secondary | `#463347` |
| Accent | `#77264E` |
| Background | `#F7F6F8` |
| Dark BG | `#17131D` |
| Card | `#FFFFFF` |
| Success | `#16A36A` |
| Warning | `#E7A23B` |
| Danger | `#DC4C4C` |
| Text Primary | `#24202A` |
| Text Secondary | `#85808B` |

User app: mobile-first, max-width ~480px centered, sticky bottom nav (Home / Plans / Team / Profile).
Admin: desktop-first sidebar layout, light theme with brand accents.

## Phase Checklist

### Phase 1 – Project Setup
- [x] Inspect repository
- [x] Check Node version
- [x] Create monorepo structure
- [x] Install client & server dependencies
- [x] Configure Tailwind / Vite / Express / Mongoose
- [x] `.env.example`, `.gitignore`, README, docs

### Phase 2 – UI Foundation
- [x] Design tokens / CSS variables
- [x] User layout + bottom nav
- [x] Admin layout + sidebar
- [x] Shared UI primitives

### Phase 3 – Authentication
- [x] Models, validators, services
- [x] Register / login / refresh / logout
- [x] Protected routes (user + admin)

### Phase 4 – User Panel
- [x] Dashboard, plans, orders, wallets
- [x] Recharge, withdrawal, team, KYC
- [x] Profile, bank, notifications, support

### Phase 5 – Admin Panel
- [x] All admin modules + RBAC

### Phase 6 – Integration
- [x] Wire every page to live APIs

### Phase 7 – Security & Testing
- [x] Seed scripts + ledger integrity patterns
- [ ] Broader automated test suite (next iteration)

### Phase 8 – Deployment
- [x] Docs for Atlas / Vercel / VPS

## Platform Mode
- Default: **DEMO** — sandbox payments, simulated projections clearly labeled
- **LIVE** remains disabled until compliance review
