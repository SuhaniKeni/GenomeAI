"""Persistent Evidence Cache for GenomeAI.

Stores retrieved ClinVar, NCBI, and merged evidence objects locally in SQLite database
to minimize external API calls and maintain fast response times.
"""
from __future__ import annotations

import json
import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent
CACHE_DB_PATH = CACHE_DIR / "evidence_cache.db"


def _get_connection() -> sqlite3.Connection:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(CACHE_DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_cache_db() -> None:
    """Initialize the SQLite cache table if it does not exist."""
    try:
        with _get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS evidence_cache (
                    cache_key TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_cache_category ON evidence_cache (category);"
            )
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize evidence cache DB: {e}")


class EvidenceCache:
    """Interface to get and set cache entries."""

    @staticmethod
    def get(cache_key: str) -> Optional[dict[str, Any]]:
        if not cache_key:
            return None
        try:
            with _get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT data_json FROM evidence_cache WHERE cache_key = ?",
                    (cache_key.lower().strip(),),
                )
                row = cursor.fetchone()
                if row and row["data_json"]:
                    return json.loads(row["data_json"])
        except Exception as e:
            logger.warning(f"Cache get error for key '{cache_key}': {e}")
        return None

    @staticmethod
    def set(cache_key: str, category: str, data: dict[str, Any]) -> None:
        if not cache_key or not data:
            return
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            data_str = json.dumps(data)
            with _get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO evidence_cache (cache_key, category, data_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        data_json = excluded.data_json,
                        updated_at = excluded.updated_at
                    """,
                    (cache_key.lower().strip(), category, data_str, now_iso, now_iso),
                )
                conn.commit()
        except Exception as e:
            logger.warning(f"Cache set error for key '{cache_key}': {e}")


# Initialize cache schema on module import
init_cache_db()
