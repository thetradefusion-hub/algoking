# AlgoKing Development Checklist

## Phase status

- [x] Phase 1 – Project setup (monorepo, deps, env, docs)
- [x] Phase 2 – UI foundation (tokens, layouts, components)
- [x] Phase 3 – Authentication (JWT + refresh cookie + RBAC)
- [x] Phase 4 – User panel modules wired to APIs
- [x] Phase 5 – Admin panel modules wired to APIs
- [x] Phase 6 – Live API integration (no hardcoded balances/plans)
- [x] Phase 7 – Seed scripts + financial ledger integrity patterns
- [x] Phase 8 – README / API / deployment notes

## Before first run

1. Create MongoDB Atlas cluster (replica set / transactions enabled)
2. Copy `server/.env.example` → `server/.env` and set `MONGODB_URI`
3. `cd server && npm run seed && npm run dev`
4. `cd client && npm run dev`
5. Login with seeded admin / investor accounts

## Remaining hardening (optional next)

- [ ] Automated API tests (auth, wallet debit, duplicate purchase, commissions)
- [ ] Multer upload endpoints with private document serving
- [ ] Razorpay LIVE adapter after compliance approval
- [ ] CSV export streaming for large admin reports
- [ ] Income payout job for completed investment schedules (demo cron)
