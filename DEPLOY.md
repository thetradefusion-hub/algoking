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

> **Important:** API lives in `/server`. Do **not** use repo-root `yarn install && yarn build`
> (that tries to build the Vite client and fails). Use Root Directory = `server`.

1. [Render](https://render.com) → New → Blueprint → select this repo (`render.yaml`)
   - Or **New Web Service** → connect repo, then set:
     - **Root Directory:** `server`
     - **Build Command:** `NPM_CONFIG_PRODUCTION=false npm install && npm run build`
     - **Start Command:** `npm run start`
     - **Node version:** `20` (or set `NODE_VERSION=20.20.0`)
2. Health check path: `/health`
3. Set env vars (from `server/.env.example`):

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
3. Environment Variables (**Production** + Preview).  
   **Do not** set `VITE_API_BASE_URL` to `localhost` — Vite bakes this in at build time.

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://YOUR_RAILWAY_OR_RENDER_HOST/api/v1` |
| `VITE_APP_NAME` | `AlgoKing` |
| `VITE_PLATFORM_MODE` | `DEMO` |

4. **Redeploy** after saving env vars (required — old build still has localhost)
5. Copy the Vercel URL (e.g. `https://algoking.vercel.app`)
6. On Railway/Render API set:
   - `CLIENT_URL=https://algoking.vercel.app`
   - `ALLOWED_ORIGINS=https://algoking.vercel.app`
   - `ALLOW_VERCEL_PREVIEWS=true`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=none`
   then restart the API

### Login still fails? Check
- Browser Network tab: requests must go to Railway/Render, **not** `localhost:5000`
- API `/health` opens in browser
- MongoDB Atlas allows Railway/Render IPs (or `0.0.0.0/0` for demo)
- Admin user exists (`npm run create-admin` / seed on the server)

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
