"""SQLAlchemy ORM Models Forwarding for GenomeAI LIS.

Re-exports PostgreSQL models from backend/database/models.py for backward compatibility.
"""
from __future__ import annotations

try:
    from backend.database.models import (
        Laboratory, User, DNAAnalysis, Report, EvidenceCache, AnalysisHistory
    )
except ImportError:
    from database.models import (
        Laboratory, User, DNAAnalysis, Report, EvidenceCache, AnalysisHistory
    )

__all__ = [
    "Laboratory", "User", "DNAAnalysis", "Report", "EvidenceCache", "AnalysisHistory"
]
