import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

try:
    from backend.api.routes import router
    from backend.database.connection import SessionLocal, init_db
    from backend.database.crud import seed_initial_data
    from backend.services.model_loader import preload_models
except ImportError:
    try:
        from database.connection import SessionLocal, init_db
        from database.crud import seed_initial_data
        from services.model_loader import preload_models

        from .api.routes import router
    except ImportError:
        from api.routes import router
        from database.connection import SessionLocal, init_db
        from database.crud import seed_initial_data
        from services.model_loader import preload_models

logger = logging.getLogger("genomeai.main")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist"
FRONTEND_INDEX = FRONTEND_DIST_DIR / "index.html"

app = FastAPI(
    title="GenomeAI Enterprise LIS API",
    version="1.0.0",
    description="DNA Disease Prediction & Enterprise Laboratory Information System (LIS)",
)

# CORS configuration for Render single-domain and local dev
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Automatic Startup Task: Initialize Database Schema, Seed Users, and Preload AI Model."""
    logger.info("Initializing GenomeAI LIS Production Application...")
    try:
        init_db()
        with SessionLocal() as db:
            seed_initial_data(db)
    except Exception as err:
        logger.warning(f"Database initialization warning: {err}")

    try:
        preload_models()
    except Exception as err:
        logger.warning(f"AI Model preloading warning: {err}")


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    """Application Health Endpoint."""
    return {
        "status": "Online",
        "service": "GenomeAI LIS Engine",
        "version": "1.0.0",
        "database": "PostgreSQL",
        "model": "GenomeAI 1D-CNN v2.0",
    }


# Include API Router under /api prefix and root
app.include_router(router, prefix="/api")

# Serve React static assets if frontend dist directory exists
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_single_page_app(full_path: str, request: Request):
    """
    Production Single-URL SPA Routing:
    - Passes API, Health, Docs, and OpenAPI paths to FastAPI router handlers.
    - Serves static asset files directly if found in dist folder.
    - Returns index.html for all client-side React routes.
    """
    # Exclude API endpoints, Swagger UI, and OpenAPI schema
    api_prefixes = ("api/", "api", "health", "docs", "openapi.json", "redoc")
    if full_path.startswith(api_prefixes) or full_path in (
        "health",
        "docs",
        "openapi.json",
        "redoc",
    ):
        return JSONResponse(
            status_code=404, content={"detail": f"API Endpoint '{full_path}' not found."}
        )

    # Serve static root files if present (e.g., favicon.ico, dna-hero.svg)
    file_path = FRONTEND_DIST_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Fallback to index.html for React SPA client routing
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)

    return JSONResponse(status_code=404, content={"detail": "Frontend build not found."})
