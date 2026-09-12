# Deployment — where to deploy what, and how

There are 3 things to deploy. Each goes to a different place:

| # | WHAT (code) | WHERE (platform) | HOW (one line) | Result |
|---|---|---|---|---|
| 1 | 🗄️ **Postgres database** (`apps/todo-app/schema.sql`) | Render Postgres — or Neon / Supabase | Create DB → run `schema.sql` (or `node apps/todo-app/setup-db.js`) | A `DATABASE_URL` connection string |
| 2 | 🖥️ **Backend API** (`apps/todo-app/src/`, served from repo root) | **Render** → Web Service (via root `render.yaml` Blueprint) | Dashboard → New → **Blueprint** → select repo → set `DATABASE_URL` → Deploy | `https://todo-app-backend-7tm8.onrender.com` ✅ LIVE |
| 3 | 🖼️ **Frontend UI** (`apps/todo-app/frontend/`) | **Vercel** (or Netlify / Render Static Site) | Set `VITE_API_URL` → `npm run build` → deploy `dist/` | `__PASTE_FRONTEND_URL_HERE__` |

> ✅ Backend is live at `https://todo-app-backend-7tm8.onrender.com` (no trailing slash).
> `__PASTE_FRONTEND_URL_HERE__` = your frontend URL once deployed,
> e.g. `https://my-todo-app.vercel.app`.
> Search the repo for `__PASTE_` for the remaining spots (frontend URL only).

## Step 1 — Database (do this first, ~5 min)

1. Create a Postgres database on **Render** (Dashboard → New → PostgreSQL),
   or use **Neon** / **Supabase**.
2. Copy its connection string — this is your `DATABASE_URL`.
3. Create the table (pick one):
   ```bash
   # Option A — from your dev machine, with apps/todo-app/.env
   # containing: DATABASE_URL=<your connection string>
   node apps/todo-app/setup-db.js

   # Option B — run apps/todo-app/schema.sql directly
   # (Render SQL shell, Neon SQL editor, Supabase SQL editor, or psql).
   ```
4. ✅ Done when: `todos` table exists (the script prints `Verified: todos table exists`).

## Step 2 — Backend API → Render (~10 min)

The root `render.yaml` is the source of truth (`apps/todo-app/render.yaml` mirrors it):
build `npm ci` + build ORM + build backend, start `node apps/todo-app/dist/server.js`,
health check `/health`, Node pinned to 20.x.

1. Push this repo to GitHub: `https://github.com/Poli-Reddy/Todo_TypeScript_ORM` ✅ done.
2. Render Dashboard → New → **Blueprint** → select the repo.
   (Manual alternative: New → Web Service with the same build/start commands.)
3. Environment → add `DATABASE_URL` = the connection string from Step 1.
   (`PORT` defaults to `3000` — leave it.)
4. Deploy.
5. ✅ Done when: `https://todo-app-backend-7tm8.onrender.com/health` returns `{"status":"ok"}` ✅ verified live.

## Step 3 — Frontend UI → Vercel (~5 min)

The frontend must know the backend URL **at build time**:

1. Edit `apps/todo-app/frontend/.env.production`:
   ```
   VITE_API_URL=https://todo-app-backend-7tm8.onrender.com
   ```
2. Rebuild:
   ```bash
   cd apps/todo-app/frontend
   npm run build   # outputs dist/
   ```
3. Deploy `dist/` — pick one:
   - **Vercel (recommended):** `vercel --prod` (uses `vercel.json`);
     also set `VITE_API_URL` in Vercel Project → Settings → Environment Variables.
   - **Netlify:** drag-and-drop `dist/`, or connect the repo (uses `netlify.toml` —
     its `/api/*` redirect already points at the live backend);
     set `VITE_API_URL` in Site settings.
   - **Render Static Site:** build command `npm run build`, publish directory `dist/`,
     set `VITE_API_URL`.
4. ✅ Done when: `__PASTE_FRONTEND_URL_HERE__` loads and shows todos from the backend.

## Step 4 — Remaining mark: frontend URL

Backend + repo marks are all filled in. Only one remains:

| File | Mark | Replace with |
|---|---|---|
| `README.md` (Live Demo) | `__PASTE_FRONTEND_URL_HERE__` | your Vercel/Netlify URL after Step 3 |
| `apps/todo-app/DEPLOYMENT.md` (tables above) | `__PASTE_FRONTEND_URL_HERE__` | same |

Then commit + push.

## Env vars cheat-sheet

| Var | Set where | Value |
|---|---|---|
| `DATABASE_URL` | Render backend → Environment | connection string from Step 1 |
| `PORT` | Render backend | leave default `3000` |
| `VITE_API_URL` | frontend `.env.production` + Vercel/Netlify env | `https://todo-app-backend-7tm8.onrender.com` (no trailing slash) |

Notes: `apps/todo-app/.env` is git-ignored — never commit it. Managed Postgres
hosts need SSL; the ORM enables it automatically. If a DB password was ever
pasted anywhere shared, rotate it.
