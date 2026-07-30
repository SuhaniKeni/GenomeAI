@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

echo ======================================
echo Starting GenomeAI Enterprise LIS
echo ======================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend (http://127.0.0.1:8000)...
start "GenomeAI Backend" cmd /k ".\venv\Scripts\activate && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React Frontend (http://localhost:5173)...
start "GenomeAI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================
echo GenomeAI LIS Started Successfully!
echo ======================================
echo.
echo  Frontend URL : http://localhost:5173
echo  Backend API  : http://127.0.0.1:8000
echo  API Docs     : http://127.0.0.1:8000/docs
echo.
echo Press any key to exit this window (services will continue running in separate terminals).
pause >nul