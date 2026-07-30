@echo off
echo ======================================
echo Stopping GenomeAI Enterprise LIS
echo ======================================
echo.

powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

taskkill /FI "WINDOWTITLE eq GenomeAI Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GenomeAI Frontend*" /F >nul 2>&1

echo [OK] FastAPI Backend Stopped (Port 8000)
echo [OK] React Frontend Stopped (Port 5173)
echo.
echo ======================================
echo GenomeAI Stopped Successfully
echo ======================================