# GenomeAI Docker Guide

This guide explains how to run the GenomeAI application using Docker.

## Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).
2. Ensure Docker is running.

## First-Time Setup

The repository contains everything needed to spin up the application in isolated containers.

1. **(Optional) Environment Variables**:
   By default, the backend falls back to local SQLite databases and default secure keys for local development.
   If you want to connect to a production Supabase PostgreSQL instance:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set `DATABASE_URL`.

2. **Build and Run**:
   Open a terminal (PowerShell, CMD, or bash) in the root of the project and run:
   ```bash
   docker compose up --build
   ```

## Application URLs

Once the containers are built and running, you can access the application at:

* **GenomeAI Frontend**: [http://localhost](http://localhost) (or `http://localhost:80`)
* **GenomeAI Backend (Health Check)**: [http://localhost:8000/health](http://localhost:8000/health)
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Supabase Configuration

If you configure a `DATABASE_URL` in `.env`, Docker Compose will inject it into the `backend` container. The backend automatically handles connecting to PostgreSQL. Ensure your Supabase firewall (if any) allows connections from your current IP.

## Common Docker Commands

* **Start in Background (Detached)**:
  ```bash
  docker compose up -d
  ```
* **Stop Containers**:
  ```bash
  docker compose down
  ```
* **Rebuild Containers (e.g., after installing new npm packages)**:
  ```bash
  docker compose up --build
  ```
* **View Logs**:
  ```bash
  docker compose logs -f
  ```

## Troubleshooting

1. **Port Conflicts**: If port `80` or `8000` is already in use, you can change the host port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:80" # Changes frontend to localhost:8080
   ```
2. **Database Migrations**: The backend automatically attempts to build tables on startup using `init_db()`. Manual alembic migrations are generally not needed for Docker, but can be run via:
   ```bash
   docker compose exec backend alembic upgrade head
   ```
3. **Empty `.env` warning**: If you see a warning about `.env` missing, it is harmless. You can simply create an empty `.env` file or follow the First-Time Setup to create one from `.env.example`.
