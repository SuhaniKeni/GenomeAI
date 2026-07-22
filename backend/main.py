from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

try:
    from .api.routes import router
except ImportError:
    from api.routes import router

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist"
FRONTEND_INDEX = FRONTEND_DIST_DIR / "index.html"

app = FastAPI(
    title="GenomeAI API",
    version="1.0.0",
    description="DNA Disease Prediction Backend"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to GenomeAI",
        "status": "Running"
    }


app.include_router(router)

if FRONTEND_DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST_DIR / "assets"), name="frontend-assets")


@app.get("/app", include_in_schema=False)
@app.get("/app/", include_in_schema=False)
def frontend_index():
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)

    return {
        "detail": "Frontend build not found"
    }


@app.get("/app/{path:path}", include_in_schema=False)
def frontend_spa(path: str):
    if path.startswith("assets/"):
        return {
            "detail": "Asset not found"
        }

    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)

    return {
        "detail": "Frontend build not found"
    }
