# GenomeAI Enterprise CI/CD Pipeline & DevOps Architecture

This document provides a comprehensive operational guide for the **GenomeAI** continuous integration and continuous deployment (CI/CD) pipeline built with **GitHub Actions**, **Render Cloud Infrastructure**, and **Supabase PostgreSQL**.

---

## 1. Pipeline Architecture Diagram

```
                       +-----------------------------------+
                       |    Developer Push / Pull Request  |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------+-----------------+
                       |       GitHub Actions Matrix       |
                       +-----------------+-----------------+
                                         |
         +-------------------+-----------+-----------+-------------------+
         |                   |                       |                   |
         v                   v                       v                   v
+-----------------+ +-----------------+     +-----------------+ +-----------------+
|   backend-ci    | |   database-ci   |     |   ai-module-ci  | |   frontend-ci   |
| • Python 3.11   | | • PostgreSQL 16 |     | • 1D-CNN Model  | | • Node.js 20    |
| • Ruff/Flake8   | | • SQLAlchemy    |     | • LSTM Model    | | • ESLint        |
| • Black/isort   | | • Alembic Heads |     | • FASTA Parser  | | • Vite Build    |
| • Pytest & Cov  | | • Protocol Map  |     | • SHAP Attrib.  | | • Dist Artifact |
| • App Import    | | • No SQLite     |     | • ReportLab PDF | |                 |
+--------+--------+ +--------+--------+     +--------+--------+ +--------+--------+
         |                   |                       |                   |
         +-------------------+-----------+-----------+-------------------+
                                         |
                                         v
                       +-----------------+-----------------+
                       | Security Scans & Vulnerabilities  |
                       | • CodeQL SAST Analysis            |
                       | • pip-audit (PyPI CVEs)           |
                       | • npm audit (Node Security)       |
                       | • Secret Leakage Detection        |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------+-----------------+
                       |        CI Status Gatekeeper       |
                       |  (All Jobs Must Pass 100%)        |
                       +-----------------+-----------------+
                                         |
                    [ Push to Main & All Checks Passed ]
                                         |
                                         v
                       +-----------------+-----------------+
                       |       Render Deploy Trigger       |
                       |   POST RENDER_DEPLOY_HOOK Secret  |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------+-----------------+
                       |    Render Production Container    |
                       | • FastAPI Single-URL Web App      |
                       | • Supabase PostgreSQL Database    |
                       +-----------------------------------+
```

---

## 2. Workflow Breakdown & CI Mechanics

The pipeline is organized into four separate GitHub Actions workflows located in `.github/workflows/`:

### A. Main CI Validation (`.github/workflows/ci.yml`)
Runs on every Pull Request to `main`, push to `main`, and manual dispatch. Contains four parallel jobs:

1. **`backend-ci`**:
   - **Environment**: Python 3.11 with `pip` dependency caching.
   - **Imports**: Verifies `backend.main` and `FastAPI` instance initialization without runtime exceptions.
   - **Linting & Code Quality**: Executes `ruff`, `flake8`, `black --check`, and `isort --check-only`.
   - **Testing & Coverage**: Runs `pytest` suite with `pytest-cov` and `pytest-html`, producing coverage metrics and uploading test reports as workflow artifacts (`pytest-and-coverage-reports`).

2. **`database-ci`**:
   - **Environment**: Real PostgreSQL 16 container (`postgres:16-alpine`).
   - **ORM Schema**: Executes `Base.metadata.create_all()` to ensure all SQLAlchemy models instantiate cleanly.
   - **Alembic**: Validates migration heads (`alembic heads`) and database revision consistency.
   - **Protocol Translation**: Validates string protocol conversion (`postgres://` -> `postgresql://`) for Supabase compatibility.
   - **No SQLite**: Enforces strict PostgreSQL configuration for production alignment.

3. **`ai-module-ci`**:
   - **Model Loaders**: Validates instantiation of 1D-CNN and LSTM deep learning models.
   - **Preprocessing**: Tests sequence cleaning and FASTA parser boundary enforcement (201-bp window).
   - **Tokenizer**: Verifies nucleotide tokenization mapping.
   - **SHAP & PDF**: Tests SHAP attribution logic and ReportLab vector PDF generation.

4. **`frontend-ci`**:
   - **Environment**: Node.js 20 with `npm` package caching.
   - **Build & Lint**: Runs `npm run lint` and `npm run build` using Vite.
   - **Artifacts**: Uploads `frontend/dist` production build directory (`frontend-production-dist`).

---

### B. Render Automated Deployment (`.github/workflows/deploy.yml`)
Triggers automatically when the `CI Pipeline` workflow completes successfully on the `main` branch, or via manual `workflow_dispatch`.

- **Security Gate**: Deployment **NEVER** runs if any CI job fails.
- **Webhook Execution**: Sends an HTTP `POST` request to `secrets.RENDER_DEPLOY_HOOK`.
- **Validation**: Asserts that Render responds with HTTP status `200`, `201`, `202`, or `250`.

---

### C. CodeQL SAST Security Scan (`.github/workflows/codeql.yml`)
Performs static application security testing (SAST) for Python and JavaScript/TypeScript on pushes, pull requests, and weekly schedules.

---

### D. Dependency Vulnerability & Secret Audit (`.github/workflows/dependency-scan.yml`)
- **`pip-audit`**: Scans `requirements.txt` for known PyPI security advisories (CVEs).
- **`npm audit`**: Audits `frontend/package.json` for high-severity Node package vulnerabilities.
- **`secret-scan`**: Scans all repository files to detect exposed API tokens, private keys, or credentials.

---

## 3. GitHub Secrets Configuration Checklist

To enable automated deployments and secure database access, configure the following secrets in **GitHub Repository Settings -> Secrets and variables -> Actions**:

| Secret Name | Required By | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `RENDER_DEPLOY_HOOK` | `deploy.yml` | `https://api.render.com/deploy/srv-cxxxxxx?key=yyyyyy` | Webhook URL from Render Dashboard to trigger deployment. |
| `DATABASE_URL` | `ci.yml` / Production | `postgresql://postgres:[PASSWORD]@ep-xyz.supabase.co:5432/postgres` | Supabase PostgreSQL connection string. |
| `GENOMEAI_SECRET_KEY` | Production / Tests | `genomeai_prod_secret_key_89a42f...` | Application encryption secret key. |
| `JWT_SECRET_KEY` | Production / Tests | `genomeai_jwt_prod_key_77b311...` | Secret key for signing JWT tokens. |
| `VITE_CLARITY_PROJECT_ID` | Frontend Build | `p8x9zk0q2m` | (Optional) Microsoft Clarity analytics project ID. |

---

## 4. How to Setup Render Deploy Hook

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Select your `genomeai` web service.
3. Navigate to **Settings** -> **Deploy Hook**.
4. Copy the unique URL (e.g., `https://api.render.com/deploy/srv-xyz?key=abc`).
5. Open your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
6. Click **New repository secret**.
7. Set **Name** to `RENDER_DEPLOY_HOOK` and paste the URL into **Secret**.
8. Click **Add secret**.

---

## 5. Operational Procedures

### A. How to Manually Trigger a Deployment
1. Go to your GitHub Repository -> **Actions** tab.
2. Select **Render Deployment** from the left sidebar.
3. Click **Run workflow**, select branch `main`, and click **Run workflow**.

### B. How to Disable Deployment
To pause automated deployments (e.g., during maintenance):
- Temporarily rename or clear the `RENDER_DEPLOY_HOOK` secret in GitHub Repository Settings.
- Or add `autoDeploy: false` in `render.yaml`.

### C. How to Roll Back a Release on Render
1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Select the `genomeai` web service.
3. Click on the **Events** or **Deploys** tab.
4. Locate the last known good deployment.
5. Click the three dots `...` next to the deployment and select **Rollback to this deploy**.

---

## 6. Troubleshooting & Failure Handling

If a CI job fails:
1. Open the GitHub Actions run log to identify the failing job (`backend-ci`, `database-ci`, `ai-module-ci`, or `frontend-ci`).
2. Download the `pytest-and-coverage-reports` artifact to view detailed HTML test tracebacks.
3. Resolve the error locally and push a fix. Deployment will automatically remain paused until all checks pass.
