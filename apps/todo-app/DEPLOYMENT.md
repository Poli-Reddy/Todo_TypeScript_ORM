# Deployment — where to deploy what, and how

There are 3 things to deploy. Each goes to a different place:

| # | WHAT (code) | WHERE (platform) | HOW (one line) | Result |
|---|---|---|---|---|
| 1 | 🗄️ **Postgres database** (`apps/todo-app/schema.sql`) | Render Postgres — or Neon / Supabase | Create DB → run `schema.sql` (or `node apps/todo-app/setup-db.js`) | A `DATABASE_URL` connection string |
| 2 | 🖥️ **Backend API** (`apps/todo-app/src/`, served from repo root) | **Render** → Web Service (via root `render.yaml` Blueprint) | Dashboard → New → **Blueprint** → select repo → set `DATABASE_URL` → Deploy | `__PASTE_BACKEND_URL_HERE__` |
| 3 | 🖼️ **Frontend UI** (`apps/todo-app/frontend/`) | **Vercel** (or Netlify / Render Static Site) | Set `VITE_API_URL` → `npm run build` → deploy `dist/` | `__PASTE_FRONTEND_URL_HERE__` |

> 🔧 `__PASTE_BACKEND_URL_HERE__` = your backend URL with NO trailing slash,
> e.g. `https://todo-app-backend-xyz.onrender.com`.
> `__PASTE_FRONTEND_URL_HERE__` = your frontend URL,
> e.g. `https://my-todo-app.vercel.app`.
> After deploying, search this repo for `__PASTE_` — every spot that needs your
> real link is marked. There are 8 spots (list at the bottom).

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

1. Push this repo to GitHub: `__PASTE_GITHUB_REPO_URL_HERE__`.
2. Render Dashboard → New → **Blueprint** → select the repo.
   (Manual alternative: New → Web Service with the same build/start commands.)
3. Environment → add `DATABASE_URL` = the connection string from Step 1.
   (`PORT` defaults to `3000` — leave it.)
4. Deploy.
5. ✅ Done when: `__PASTE_BACKEND_URL_HERE__/health` returns `{"status":"ok"}`.

## Step 3 — Frontend UI → Vercel (~5 min)

The frontend must know the backend URL **at build time**:

1. Edit `apps/todo-app/frontend/.env.production`:
   ```
   VITE_API_URL=__PASTE_BACKEND_URL_HERE__
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
     its `/api/*` redirect already points at `__PASTE_BACKEND_URL_HERE__`,
     just replace the mark); set `VITE_API_URL` in Site settings.
   - **Render Static Site:** build command `npm run build`, publish directory `dist/`,
     set `VITE_API_URL`.
4. ✅ Done when: `__PASTE_FRONTEND_URL_HERE__` loads and shows todos from the backend.

## Step 4 — Replace all marks (~2 min)

Search the repo for `__PASTE_` and replace with your real links:

| # | File | Mark | Replace with |
|---|---|---|---|
| 1 | `README.md` (Live Demo) | `__PASTE_FRONTEND_URL_HERE__` | your Vercel/Netlify URL |
| 2 | `README.md` (Live Demo + deploy steps) | `__PASTE_BACKEND_URL_HERE__` (3×) | your Render backend URL |
| 3 | `README.md` (Quick Start) | `__PASTE_GITHUB_REPO_URL_HERE__` | your GitHub repo URL |
| 4 | `apps/todo-app/frontend/.env.production` | `__PASTE_BACKEND_URL_HERE__` | your Render backend URL |
| 5 | `apps/todo-app/frontend/netlify.toml` | `__PASTE_BACKEND_URL_HERE__` | your Render backend URL |
| 6 | `apps/todo-app/frontend/src/App.tsx` (comment) | `__PASTE_BACKEND_URL_HERE__` | — comment only, no rebuild needed |
| 7 | `apps/todo-app/DEPLOYMENT.md` | marks in this file | — docs only |
| 8 | `packages/orm/package.json` (`repository.url`) | `__PASTE_GITHUB_REPO_URL_HERE__` | your GitHub repo URL |

Then commit + push (and redeploy frontend if you changed `.env.production` after building).

## Env vars cheat-sheet

| Var | Set where | Value |
|---|---|---|
| `DATABASE_URL` | Render backend → Environment | connection string from Step 1 |
| `PORT` | Render backend | leave default `3000` |
| `VITE_API_URL` | frontend `.env.production` + Vercel/Netlify env | `__PASTE_BACKEND_URL_HERE__` (no trailing slash) |

Notes: `apps/todo-app/.env` is git-ignored — never commit it. Managed Postgres
hosts need SSL; the ORM enables it automatically. If a DB password was ever
pasted anywhere shared, rotate it.
