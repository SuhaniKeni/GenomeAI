"""SQLAlchemy Database Session Forwarding for GenomeAI LIS.

Re-exports session management from backend/database/connection.py for backward compatibility.
"""
from __future__ import annotations

try:
    from backend.database.connection import (
        engine, SessionLocal, Base, get_db, init_db, DATABASE_URL
    )
except ImportError:
    from database.connection import (
        engine, SessionLocal, Base, get_db, init_db, DATABASE_URL
    )

__all__ = ["engine", "SessionLocal", "Base", "get_db", "init_db", "DATABASE_URL"]
