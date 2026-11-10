# Deploy AlgoKing (GitHub → Vercel + API)

Vercel hosts the **React SPA**. The Express API needs a Node host (Render / Railway / Fly). MongoDB stays on Atlas.

> Never commit `server/.env` or `client/.env` (secrets). Use dashboard env vars.

## 1. Push to GitHub

```bash
cd algoking
git init
git add .
git commit -m "Prepare AlgoKing for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USER/algoking.git
git push -u origin main
```

## 2. Deploy API (Render — recommended)

1. [Render](https://render.com) → New → Blueprint → select this repo (`render.yaml`)
   - Or New Web Service → root directory `server`
2. Build: `npm install && npm run build`
3. Start: `npm run start`
4. Set env vars (from `server/.env.example`):

| Key | Example |
|---|---|
| `MONGODB_URI` | your Atlas URI |
| `JWT_ACCESS_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `ENCRYPTION_KEY` | 32+ chars |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
| `ALLOW_VERCEL_PREVIEWS` | `true` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `none` |
| `PLATFORM_MODE` | `DEMO` |
| `NODE_ENV` | `production` |

5. After deploy, note API URL e.g. `https://algoking-api.onrender.com`
6. Health check: `GET https://…/health`

Optional seed (one-time, via Render shell or local against Atlas):

```bash
cd server
npm run seed
npm run create-admin
```

## 3. Deploy frontend (Vercel)

1. [Vercel](https://vercel.com) → Add New Project → import GitHub repo
2. Vercel auto-reads root `vercel.json` (builds `client/`)
3. Environment Variables:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://YOUR_API_HOST/api/v1` |
| `VITE_APP_NAME` | `AlgoKing` |
| `VITE_PLATFORM_MODE` | `DEMO` |

4. Deploy → copy the Vercel URL
5. Update API `CLIENT_URL` / `ALLOWED_ORIGINS` to that Vercel URL, then restart API

## 4. Checklist

- [ ] Atlas Network Access allows Render (or `0.0.0.0/0` for demo)
- [ ] API `/health` returns OK
- [ ] Vercel login works against live API
- [ ] No `.env` files in GitHub

## Local vs Production

| | Local | Production |
|---|---|---|
| Client | `npm run dev` → `:5173` | Vercel |
| API | `npm run dev` → `:5000` | Render |
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | `https://api…/api/v1` |
| Cookies | `COOKIE_SECURE=false`, `lax` | `true`, `none` |
