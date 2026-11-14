# AlgoKing — Grow Your Future.

Premium full-stack investment & referral platform.

- **User app**: mobile-first fintech UI (max-width ~480px)
- **Admin panel**: desktop sidebar control center
- **API**: Node.js + Express + MongoDB (Mongoose)
- **Auth**: JWT access + HTTP-only refresh cookies + RBAC

> Projected income, ROI, and commissions are illustrative and non-guaranteed. Review risks before investing.

## Monorepo

```
algoking/
├── client/     # React + Vite + Tailwind (user + admin SPA)
├── server/     # Express REST API
└── docs/       # Architecture & development plan
```

## Prerequisites

- Node.js 20+ (tested on 24)
- MongoDB Atlas **or** local MongoDB (replica set recommended for transactions)

## Quick start

### 1. Backend

```bash
cd server
cp .env.example .env
# Set MONGODB_URI to your Atlas/local connection string
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000` · Health: `GET /health` · Base: `/api/v1`

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Demo accounts (after seed)

| Role | Login | Password |
|---|---|---|
| Super Admin | `admin@algoking.local` | `Admin@12345` |
| Investor | `investor@algoking.local` | `Investor@123` |

Demo investor is seeded with Main ₹10,000 and Income ₹2,000 for workflow testing.

## Deploy (GitHub → Vercel)

Frontend is **Vercel-ready** (`vercel.json`). API runs on Render/Railway (see **[DEPLOY.md](./DEPLOY.md)**).

Quick flow:

1. Push repo to GitHub (do **not** commit `.env`)
2. Deploy `server/` on Render → set Atlas + JWT env vars
3. Import repo on Vercel → set `VITE_API_BASE_URL=https://YOUR_API/api/v1`
4. Point API `CLIENT_URL` to your Vercel URL

## Environment

See `server/.env.example` and `client/.env.example` / `client/.env.production.example`.

Critical server vars:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY` (32 chars for PAN/bank encryption)
- `PLATFORM_MODE=LIVE`
- `CLIENT_URL=http://localhost:5173`

## Core modules

**User**: Dashboard, Plans, Orders, Wallets, Recharge (demo gateway), Withdrawals, Team/Referrals, KYC, Banks, Notifications, Support

**Admin**: KPIs, Users, Plans, Orders, Wallet ledger adjustments, Recharges, Withdrawals, Referrals, Commission versioning, KYC, Support, Announcements, Reports, Settings, Audit logs

## Financial integrity

- Wallet balances never trusted from the client
- Credits/debits go through immutable `WalletTransaction` ledger
- Purchases / recharges / withdrawals use MongoDB transactions where supported
- Idempotency keys on sensitive operations
- Payment success requires server-side verification (demo adapter included)

## Scripts

```bash
# server
npm run dev
npm run build
npm run seed
npm run create-admin -- email@x.com 'StrongPass1!' 9000000001 'Name'

# client
npm run dev
npm run build
```

## Docs

- [Development plan & checklist](docs/DEVELOPMENT_PLAN.md)
- [API overview](docs/API.md)

## Deployment notes

- Frontend: static host (Vercel / Netlify / Hostinger)
- Backend: Node host (Railway / Render / VPS)
- Database: MongoDB Atlas (replica set for transactions)
- Set `COOKIE_SECURE=true` and strong secrets in production
- Keep payment gateway keys and compliance flows configured before enabling real payouts
