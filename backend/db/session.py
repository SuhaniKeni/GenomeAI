"""SQLAlchemy database session and connection setup for GenomeAI LIS.

Designed with SQLAlchemy 2.0 ORM for transparent switching between
SQLite (development/testing) and PostgreSQL (production).
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

BASE_DIR = Path(__file__).resolve().parents[2]
DB_DIR = BASE_DIR / "trained_models"
DB_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_URL = f"sqlite:///{DB_DIR / 'genomeai_lis.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# Configure connect_args for SQLite thread safety
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency yield for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
