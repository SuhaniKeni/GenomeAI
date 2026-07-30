#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "Starting GenomeAI Render Production Build"
echo "=========================================="

# 1. Install Python Backend Dependencies
echo "[1/3] Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 2. Install Node.js Frontend Dependencies & Build React Bundle
echo "[2/3] Building React Frontend SPA..."
cd frontend
npm install
npm run build
cd ..

# 3. Execute Alembic Database Migrations
echo "[3/3] Executing PostgreSQL Database Migrations..."
alembic upgrade head

echo "=========================================="
echo "✓ GenomeAI Render Build Completed Successfully!"
echo "=========================================="
