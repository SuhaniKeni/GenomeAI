"""Persistent Evidence Cache for GenomeAI.

Stores retrieved ClinVar, NCBI, and merged evidence objects in PostgreSQL database cache table
(via backend/database/crud.py) to minimize external API latency.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

try:
    from backend.database import crud
except ImportError:
    from database import crud

logger = logging.getLogger(__name__)


class EvidenceCache:
    """Interface to get and set evidence cache entries."""

    @staticmethod
    def get(cache_key: str) -> Optional[dict[str, Any]]:
        if not cache_key:
            return None
        return crud.get_evidence_cache(cache_key)

    @staticmethod
    def set(cache_key: str, category: str, data: dict[str, Any]) -> None:
        if not cache_key or not data:
            return
        crud.set_evidence_cache(cache_key=cache_key, category=category, data=data)
