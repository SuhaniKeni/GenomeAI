# GenomeAI Enterprise LIS — Production Deployment Guide

This guide provides complete instructions for running, testing, and deploying **GenomeAI** on [Render](https://render.com) with [Supabase PostgreSQL](https://supabase.com) as the production cloud database.

---

## 🌐 Single Public URL Architecture

GenomeAI is deployed as a single, unified web application on Render. FastAPI acts as the primary web application server:
- **Client Application**: Serves the compiled React 19 SPA (`frontend/dist`) directly at `https://genomeai.onrender.com`.
- **API Services**: Serves REST endpoints under `/api/*` and `/health` from the same origin, eliminating CORS issues and multi-domain configurations.
- **Database Engine**: Serverless Supabase PostgreSQL Database connected via `DATABASE_URL`.

---

## 🛠️ 1. Local Development Workflow

To run the application locally on your workstation:

```powershell
# Option 1: One-click local launch
.\run_genomeai.bat

# Option 2: Independent terminal commands
# Terminal 1 - FastAPI Backend
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 - React Frontend
cd frontend
npm run dev
```

Local URLs:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:8000`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs`

---

## ⚡ 2. Supabase PostgreSQL Database Provisioning

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Name your project `GenomeAI-Production` and set your database password and cloud region.
4. Copy your PostgreSQL connection string from **Project Settings → Database → Connection String**.
   - Example format (Transaction Pooler): `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Example format (Direct Connection): `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
   - *Note*: Both `postgresql://` and `postgres://` prefixes are automatically handled by GenomeAI.

---

## ⚙️ 3. Render Setup (Blueprints / Manual Web Service)

### Method A: Render Blueprint (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository (`SuhaniKeni/GenomeAI`).
4. Render will detect `render.yaml` and prompt for required environment variables (`DATABASE_URL`).
5. Paste your **Supabase PostgreSQL connection string** into the `DATABASE_URL` field.
6. Click **Apply**.

### Method B: Manual Web Service Setup
1. Provision your database on [Supabase.com](https://supabase.com) and copy your connection string.
2. Create a **Web Service** on Render:
   - Environment: `Python`
   - Build Command: `./build.sh`
   - Start Command: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Under **Environment Variables**, set `DATABASE_URL` to your Supabase PostgreSQL connection string.
