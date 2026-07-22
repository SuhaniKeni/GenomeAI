"""Prediction history service.

Stores prediction records in a local JSON file for History, Admin Dashboard,
and Doctor Dashboard features.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]
HISTORY_FILE = BASE_DIR / "trained_models" / ".prediction_history.json"


def _load() -> list:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save(records: list):
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump(records, f, indent=2)


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
):
    """Add a prediction record to history."""
    records = _load()
    records.append({
        "id": len(records) + 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sequence": sequence[:100],  # store only first 100 bases
        "predicted_disease": predicted_disease,
        "confidence": confidence,
        "confidence_level": confidence_level,
        "model": model,
        "all_predictions": all_predictions[:5],
        "sequence_length": sequence_length,
        "inference_time_ms": inference_time_ms,
        "shap_explanation": shap_explanation,
        "mutation_summary": mutation_summary,
    })
    _save(records)
    return records[-1]["id"]


def get_history(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    model_filter: Optional[str] = None,
    disease_filter: Optional[str] = None,
) -> dict:
    """Get paginated, optionally filtered history."""
    records = _load()

    # Apply filters
    if search:
        search = search.lower()
        records = [
            r for r in records
            if search in r.get("predicted_disease", "").lower()
            or search in r.get("sequence", "").lower()
        ]
    if model_filter:
        records = [r for r in records if r.get("model", "").lower() == model_filter.lower()]
    if disease_filter:
        records = [r for r in records if r.get("predicted_disease", "").lower() == disease_filter.lower()]

    total = len(records)
    records.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    page = records[offset:offset + limit]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": page,
    }


def delete_record(record_id: int) -> bool:
    """Delete a record by ID."""
    records = _load()
    filtered = [r for r in records if r.get("id") != record_id]
    if len(filtered) == len(records):
        return False
    _save(filtered)
    return True


def clear_history():
    """Delete all history records."""
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()


def get_statistics() -> dict:
    """Aggregate statistics from all history records (for admin dashboard)."""
    records = _load()
    if not records:
        return {
            "total_predictions": 0,
            "average_confidence": 0,
            "most_predicted_disease": None,
            "model_usage": {},
            "predictions_per_day": {},
        }

    total = len(records)
    avg_confidence = round(sum(r.get("confidence", 0) for r in records) / total, 2)

    # Most predicted disease
    from collections import Counter
    disease_counts = Counter(r.get("predicted_disease") for r in records)
    most_common = disease_counts.most_common(1)

    # Model usage
    model_usage = dict(Counter(r.get("model") for r in records))

    # Predictions per day (last 30 days)
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    daily = Counter()
    for r in records:
        try:
            ts = datetime.fromisoformat(r.get("timestamp", ""))
            if ts >= thirty_days_ago:
                day_key = ts.strftime("%Y-%m-%d")
                daily[day_key] += 1
        except (ValueError, TypeError):
            pass

    return {
        "total_predictions": total,
        "average_confidence": avg_confidence,
        "most_predicted_disease": most_common[0][0] if most_common else None,
        "most_predicted_disease_count": most_common[0][1] if most_common else 0,
        "model_usage": model_usage,
        "predictions_per_day": dict(sorted(daily.items())),
    }
