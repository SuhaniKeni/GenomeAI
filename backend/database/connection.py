"""SQLAlchemy Database Connection & Session Management for GenomeAI LIS.

Primary Target: PostgreSQL (configured via DATABASE_URL environment variable).
Fallback: SQLite (for zero-configuration local development/testing if PostgreSQL is un-reachable).
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

logger = logging.getLogger("genomeai.database")

BASE_DIR = Path(__file__).resolve().parents[2]
DB_DIR = BASE_DIR / "trained_models"
DB_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_POSTGRES_URL = "postgresql://postgres:postgres@localhost:5432/genomeai"
DEFAULT_SQLITE_URL = f"sqlite:///{DB_DIR / 'genomeai_lis.db'}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_POSTGRES_URL)

# Normalize postgres:// scheme to postgresql:// for SQLAlchemy 1.4+ / 2.0 (common in Neon PostgreSQL URLs)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure SQLAlchemy engine depending on PostgreSQL vs SQLite driver
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = None

try:
    if not is_sqlite:
        logger.info(f"Connecting to PostgreSQL database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        engine = create_engine(
            DATABASE_URL,
            connect_args=connect_args,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300,
        )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ PostgreSQL Database connection verified.")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite for local development: {DEFAULT_SQLITE_URL}")
    DATABASE_URL = DEFAULT_SQLITE_URL
    is_sqlite = True
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        pool_pre_ping=True
    )

if engine is None:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency yielding SQLAlchemy database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Automatic Database Initialization (creates all tables and seeds default admin data)."""
    try:
        from backend.database import models  # Ensure models are imported
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database schema tables created/verified successfully.")
    except Exception as err:
        logger.error(f"Database initialization error: {err}")
