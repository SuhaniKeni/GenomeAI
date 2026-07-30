"""Prediction History Service for GenomeAI LIS.

Uses PostgreSQL SQLAlchemy CRUD operations (via backend/database/crud.py) for
History, Admin Dashboard, and LIS User/Laboratory management.
"""
from __future__ import annotations

from typing import Optional, List, Dict, Any

try:
    from backend.database import crud
except ImportError:
    from database import crud


def add_record(
    sequence: str,
    predicted_disease: str,
    confidence: float,
    confidence_level: str,
    model: str,
    all_predictions: list,
    sequence_length: int,
    inference_time_ms: Optional[float] = None,
    shap_explanation: Optional[str] = None,
    mutation_summary: Optional[str] = None,
    blast_data: Optional[dict] = None,
) -> int:
    """Add a prediction record to history database."""
    return crud.add_history_record(
        sequence=sequence,
        predicted_disease=predicted_disease,
        confidence=confidence,
        confidence_level=confidence_level,
        model=model,
        all_predictions=all_predictions,
        sequence_length=sequence_length,
        inference_time_ms=inference_time_ms,
        shap_explanation=shap_explanation,
        mutation_summary=mutation_summary,
        blast_data=blast_data,
    )


def get_history(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    model_filter: Optional[str] = None,
    disease_filter: Optional[str] = None,
) -> dict:
    """Get paginated, optionally filtered history."""
    return crud.get_history_records(
        limit=limit,
        offset=offset,
        search=search,
        model_filter=model_filter,
        disease_filter=disease_filter,
    )


def delete_record(record_id: int) -> bool:
    """Delete a history record by ID."""
    return crud.delete_history_record_by_id(record_id)


def clear_history() -> bool:
    """Delete all history records."""
    return crud.clear_all_history_records()


def get_statistics() -> dict:
    """Aggregate statistics from history records for Admin Dashboard."""
    return crud.get_history_statistics()


# LIS Multi-Tenant Management Functions
def create_laboratory(name: str, lab_code: str, institution: str = "") -> dict:
    return crud.create_laboratory(name=name, lab_code=lab_code, institution=institution)


def get_laboratory_by_id(lab_id: int) -> Optional[dict]:
    return crud.get_laboratory_by_id(lab_id)


def create_user_record(lab_id: int, email: str, full_name: str, password_hash: str, role: str) -> dict:
    return crud.create_user_record(lab_id=lab_id, email=email, full_name=full_name, password_hash=password_hash, role=role)


def get_user_by_email(email: str) -> Optional[dict]:
    return crud.get_user_by_email(email)


def get_users_by_lab(lab_id: int) -> list[dict]:
    return crud.get_users_by_lab(lab_id)


def delete_user_by_id(user_id: int, lab_id: int) -> bool:
    return crud.delete_user_by_id(user_id=user_id, lab_id=lab_id)
