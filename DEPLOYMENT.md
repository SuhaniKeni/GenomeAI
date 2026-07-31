# GenomeAI Enterprise LIS — Production Deployment Guide & CI/CD Manual

This guide provides complete instructions for running, testing, and automatically deploying **GenomeAI** on [Render](https://render.com) using Continuous Deployment (CI/CD) via GitHub and [Supabase PostgreSQL](https://supabase.com) as the production cloud database.

---

## 🌐 Single Public URL Architecture

GenomeAI is deployed as a single, unified web application on Render. FastAPI acts as the primary web application server:
- **Client Application**: Serves the compiled React 19 SPA (`frontend/dist`) directly at `https://genomeai.onrender.com`.
- **API Services**: Serves REST endpoints under `/api/*` and `/health` from the same origin, eliminating CORS issues and multi-domain configurations.
- **Database Engine**: Serverless Supabase PostgreSQL Database connected via `DATABASE_URL`.

---

## 🚀 1. Continuous Deployment Workflow (CI/CD)

GenomeAI uses automated GitHub → Render Continuous Deployment.

```
Local Development  →  Test Locally  →  git commit  →  git push origin main  →  Render Auto Build  →  Render Auto Deploy (Same Public URL)
```

### Step-by-Step CI/CD Steps:
1. Make your code or UI changes locally.
2. Verify frontend compilation and backend endpoints locally:
   ```powershell
   cd frontend
   npm run build
   ```
3. Commit your changes to Git:
   ```powershell
   git add .
   git commit -m "Refine LIS disease prediction workflow"
   ```
4. Push your commit to the `main` branch on GitHub:
   ```powershell
   git push origin main
   ```
5. **Automatic Trigger**: Render detects the new commit on GitHub, initiates `./build.sh`, executes database migrations (`alembic upgrade head`), loads the pre-trained 1D-CNN TensorFlow model, and deploys the updated code to `https://genomeai.onrender.com` without changing the public URL.

---

## 🛠️ 2. Local Development Workflow

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

## ⚡ 3. Supabase PostgreSQL Database Provisioning

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Name your project `GenomeAI-Production` and set your database password and cloud region.
4. Copy your PostgreSQL connection string from **Project Settings → Database → Connection String**.
   - Example format (Transaction Pooler): `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Example format (Direct Connection): `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
   - *Note*: Both `postgresql://` and `postgres://` prefixes are automatically handled by GenomeAI.

---

## ⚙️ 4. Initial Render Setup (Blueprints / Manual Web Service)

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

---

## 🔐 5. Environment Variables Configuration

The following environment variables should be configured on Render:

| Variable Name | Example Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres` | Supabase PostgreSQL connection string |
| `GENOMEAI_SECRET_KEY` | `secure_random_string_here` | JWT Token signing key |
| `ALLOWED_ORIGINS` | `*` | Allowed CORS origins |
| `PYTHON_VERSION` | `3.11.9` | Python runtime version |
| `NODE_VERSION` | `20.12.2` | Node.js build version |

To update environment variables:
1. Go to **Render Dashboard** → Select **genomeai** service.
2. Click **Environment** in the left sidebar.
3. Edit or add keys and click **Save Changes**. Render will trigger an automatic zero-downtime redeploy.

---

## 📊 5. Monitoring & Deployment Logs

1. **Build Logs**: View step-by-step progress of Node.js build and Python dependency installation under **Logs** → **Build Logs**.
2. **Runtime Logs**: View uvicorn server output, database connection logs, and model pre-warming confirmation under **Logs** → **Events / Application Logs**.
3. **Health Check**: Render monitors `/health` (HTTP 200 OK) to ensure zero-downtime traffic switching.

---

## ⏪ 6. Rollback to Previous Deployment

If a commit introduces an issue in production:
1. Go to **Render Dashboard** → Select **genomeai**.
2. Click **Deploys**.
3. Find the last known working deployment.
4. Click the `...` menu next to that deployment and select **Rollback to this deploy**.

---

## 🔄 7. Manual Redeployment

If you need to trigger a fresh build without making code changes:
1. Go to **Render Dashboard** → **genomeai**.
2. Click **Manual Deploy** in the top right.
3. Select **Clear build cache & deploy**.
