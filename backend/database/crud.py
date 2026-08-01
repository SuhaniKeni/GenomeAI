"""SQLAlchemy CRUD Operations & Transaction Management for GenomeAI LIS.

Replaces legacy raw sqlite3 calls with type-safe PostgreSQL / SQLAlchemy ORM operations.
"""

from __future__ import annotations

import json
import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

try:
    from backend.database.connection import SessionLocal
    from backend.database.models import (
        AnalysisHistory,
        DNAAnalysis,
        EvidenceCache,
        Laboratory,
        Report,
        User,
    )
    from backend.services.auth_service import get_password_hash
except ImportError:
    from connection import SessionLocal
    from models import AnalysisHistory, EvidenceCache, Laboratory, User
    from services.auth_service import get_password_hash

logger = logging.getLogger("genomeai.crud")


def current_iso_time():
    return datetime.now(timezone.utc).isoformat()


# ============================================================
# Seed Initial Data (Default Lab & Default Users)
# ============================================================


def seed_initial_data(db: Session) -> None:
    """Seeds default LIS Laboratory and Admin User if database is empty."""
    try:
        lab_count = db.scalar(select(func.count(Laboratory.lab_id)))
        if lab_count == 0:
            logger.info(
                "Database is empty. Seeding default Central Genomics Institute laboratory & admin users..."
            )
            default_lab = Laboratory(
                lab_code="LAB-CENTRAL-01",
                laboratory_name="Central Genomics Institute",
                registration_number="REG-2026-CENTRAL",
                institution="National Bioinformatics Center",
                email="admin@genomeai.lab",
                city="Boston",
                country="United States",
            )
            db.add(default_lab)
            db.flush()

            users = [
                User(
                    lab_id=default_lab.lab_id,
                    email="admin@genomeai.lab",
                    full_name="Dr. Sarah Jenkins",
                    password_hash=get_password_hash("admin123"),
                    role="Administrator",
                    department="Genomic Medicine",
                ),
                User(
                    lab_id=default_lab.lab_id,
                    email="tech@genomeai.lab",
                    full_name="Alex Vance",
                    password_hash=get_password_hash("tech123"),
                    role="Laboratory Technician",
                    department="Molecular Sequencing",
                ),
                User(
                    lab_id=default_lab.lab_id,
                    email="manager@genomeai.lab",
                    full_name="Elena Rostova",
                    password_hash=get_password_hash("manager123"),
                    role="Laboratory Manager",
                    department="Quality Operations",
                ),
            ]
            db.add_all(users)
            db.commit()
            logger.info("✓ Initial laboratory and default user accounts seeded successfully.")
    except Exception as err:
        db.rollback()
        logger.error(f"Error seeding initial database data: {err}")


# ============================================================
# User & Auth CRUD
# ============================================================


def get_user_by_email(email: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Fetch user account by email address."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        user = db.scalar(select(User).where(func.lower(User.email) == email.lower().strip()))
        if not user:
            return None
        return {
            "id": user.user_id,
            "user_id": user.user_id,
            "lab_id": user.lab_id,
            "email": user.email,
            "full_name": user.full_name,
            "password_hash": user.password_hash,
            "role": user.role,
            "department": user.department,
            "status": user.status,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        }
    finally:
        if close_session:
            db.close()


def create_user_record(
    lab_id: int,
    email: str,
    full_name: str,
    password_hash: str,
    role: str,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Create new LIS user account inside a laboratory."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        user = User(
            lab_id=lab_id,
            email=email.lower().strip(),
            full_name=full_name,
            password_hash=password_hash,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "id": user.user_id,
            "user_id": user.user_id,
            "lab_id": user.lab_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        }
    except Exception as err:
        db.rollback()
        logger.error(f"Error creating user record: {err}")
        raise err
    finally:
        if close_session:
            db.close()


def get_users_by_lab(lab_id: int, db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """Get all user accounts belonging to a specific laboratory."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        users = db.scalars(select(User).where(User.lab_id == lab_id)).all()
        return [
            {
                "id": u.user_id,
                "user_id": u.user_id,
                "lab_id": u.lab_id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "department": u.department,
                "created_at": u.created_at.isoformat() if u.created_at else "",
            }
            for u in users
        ]
    finally:
        if close_session:
            db.close()


def delete_user_by_id(user_id: int, lab_id: int, db: Optional[Session] = None) -> bool:
    """Delete a user account by ID."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        user = db.scalar(select(User).where(User.user_id == user_id, User.lab_id == lab_id))
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False
    finally:
        if close_session:
            db.close()


# ============================================================
# Laboratory CRUD
# ============================================================


def create_laboratory(
    name: str, lab_code: str, institution: str = "", db: Optional[Session] = None
) -> Dict[str, Any]:
    """Create a new multi-tenant Laboratory."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        lab = Laboratory(
            lab_code=lab_code,
            laboratory_name=name,
            institution=institution,
            email=f"info@{lab_code.lower()}.lab",
        )
        db.add(lab)
        db.commit()
        db.refresh(lab)
        return {
            "id": lab.lab_id,
            "lab_id": lab.lab_id,
            "lab_code": lab.lab_code,
            "name": lab.laboratory_name,
            "institution": lab.institution,
            "created_at": lab.created_at.isoformat() if lab.created_at else "",
        }
    except Exception as err:
        db.rollback()
        raise err
    finally:
        if close_session:
            db.close()


def get_laboratory_by_id(lab_id: int, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Fetch laboratory details by lab ID."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        lab = db.scalar(select(Laboratory).where(Laboratory.lab_id == lab_id))
        if not lab:
            return None
        return {
            "id": lab.lab_id,
            "lab_id": lab.lab_id,
            "lab_code": lab.lab_code,
            "name": lab.laboratory_name,
            "institution": lab.institution,
            "created_at": lab.created_at.isoformat() if lab.created_at else "",
        }
    finally:
        if close_session:
            db.close()


# ============================================================
# Analysis History CRUD
# ============================================================


def add_history_record(
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
    db: Optional[Session] = None,
) -> int:
    """Adds a prediction record to PostgreSQL database history table."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        ts = current_iso_time()
        seq_short = str(sequence)[:100]
        all_pred_str = json.dumps(all_predictions[:5]) if all_predictions else "[]"
        blast_str = json.dumps(blast_data) if blast_data else None

        rec = AnalysisHistory(
            timestamp=ts,
            sequence=seq_short,
            predicted_disease=predicted_disease,
            confidence=float(confidence),
            confidence_level=confidence_level,
            model=model,
            all_predictions=all_pred_str,
            sequence_length=int(sequence_length),
            inference_time_ms=inference_time_ms,
            shap_explanation=shap_explanation,
            mutation_summary=mutation_summary,
            blast_data=blast_str,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec.id
    except Exception as err:
        db.rollback()
        logger.error(f"Failed to add history record: {err}")
        return 0
    finally:
        if close_session:
            db.close()


def get_history_records(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    model_filter: Optional[str] = None,
    disease_filter: Optional[str] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Retrieves paginated and filtered prediction records."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        stmt = select(AnalysisHistory)

        if search and isinstance(search, str):
            s = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(AnalysisHistory.predicted_disease).like(s),
                    func.lower(AnalysisHistory.sequence).like(s),
                )
            )

        if model_filter and isinstance(model_filter, str):
            stmt = stmt.where(func.lower(AnalysisHistory.model) == model_filter.lower())

        if disease_filter and isinstance(disease_filter, str):
            stmt = stmt.where(
                func.lower(AnalysisHistory.predicted_disease) == disease_filter.lower()
            )

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.scalar(count_stmt) or 0

        # Paginated fetch ordered descending by ID
        stmt = stmt.order_by(AnalysisHistory.id.desc()).limit(limit).offset(offset)
        rows = db.scalars(stmt).all()

        records = []
        for r in rows:
            try:
                preds = json.loads(r.all_predictions) if r.all_predictions else []
            except Exception:
                preds = []

            blast_obj = None
            try:
                if r.blast_data:
                    blast_obj = json.loads(r.blast_data)
            except Exception:
                blast_obj = None

            records.append(
                {
                    "id": r.id,
                    "timestamp": r.timestamp,
                    "sequence": r.sequence,
                    "predicted_disease": r.predicted_disease,
                    "confidence": r.confidence,
                    "confidence_level": r.confidence_level,
                    "model": r.model,
                    "all_predictions": preds,
                    "sequence_length": r.sequence_length,
                    "inference_time_ms": r.inference_time_ms,
                    "shap_explanation": r.shap_explanation,
                    "mutation_summary": r.mutation_summary,
                    "blast": blast_obj,
                }
            )

        return {
            "success": True,
            "total": total,
            "offset": offset,
            "limit": limit,
            "records": records,
            "items": records,
            "db_path": "PostgreSQL",
        }
    finally:
        if close_session:
            db.close()


def delete_history_record_by_id(record_id: int, db: Optional[Session] = None) -> bool:
    """Delete a single history record by ID."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        rec = db.scalar(select(AnalysisHistory).where(AnalysisHistory.id == record_id))
        if not rec:
            return False
        db.delete(rec)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False
    finally:
        if close_session:
            db.close()


def clear_all_history_records(db: Optional[Session] = None) -> bool:
    """Deletes all history records."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        db.execute(delete(AnalysisHistory))
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False
    finally:
        if close_session:
            db.close()


def get_history_statistics(db: Optional[Session] = None) -> Dict[str, Any]:
    """Aggregate statistics across all prediction records for Admin Dashboard."""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        rows = db.scalars(select(AnalysisHistory)).all()

        if not rows:
            return {
                "total_predictions": 0,
                "average_confidence": 0,
                "most_predicted_disease": None,
                "model_usage": {},
                "predictions_per_day": {},
            }

        total = len(rows)
        avg_conf = round(sum(r.confidence for r in rows) / total, 2)

        disease_counts = Counter(r.predicted_disease for r in rows)
        most_common = disease_counts.most_common(1)

        model_usage = dict(Counter(r.model for r in rows))

        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        daily = Counter()
        for r in rows:
            try:
                ts = datetime.fromisoformat(r.timestamp)
                if ts >= thirty_days_ago:
                    day_key = ts.strftime("%Y-%m-%d")
                    daily[day_key] += 1
            except (ValueError, TypeError):
                pass

        return {
            "total_predictions": total,
            "average_confidence": avg_conf,
            "most_predicted_disease": most_common[0][0] if most_common else None,
            "most_predicted_disease_count": most_common[0][1] if most_common else 0,
            "model_usage": model_usage,
            "predictions_per_day": dict(sorted(daily.items())),
        }
    finally:
        if close_session:
            db.close()


# ============================================================
# Evidence Cache CRUD
# ============================================================


def get_evidence_cache(cache_key: str, db: Optional[Session] = None) -> Optional[dict]:
    """Fetch cached ClinVar / NCBI evidence JSON."""
    if not cache_key:
        return None
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        rec = db.scalar(
            select(EvidenceCache).where(
                func.lower(EvidenceCache.cache_key) == cache_key.lower().strip()
            )
        )
        if rec and rec.data_json:
            return json.loads(rec.data_json)
        return None
    except Exception as err:
        logger.warning(f"Evidence cache get error for '{cache_key}': {err}")
        return None
    finally:
        if close_session:
            db.close()


def set_evidence_cache(
    cache_key: str, category: str, data: dict, db: Optional[Session] = None
) -> None:
    """Store ClinVar / NCBI evidence JSON in persistent database cache."""
    if not cache_key or not data:
        return
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        key_clean = cache_key.lower().strip()
        data_str = json.dumps(data)

        rec = db.scalar(select(EvidenceCache).where(EvidenceCache.cache_key == key_clean))
        if rec:
            rec.data_json = data_str
            rec.category = category
        else:
            rec = EvidenceCache(cache_key=key_clean, category=category, data_json=data_str)
            db.add(rec)
        db.commit()
    except Exception as err:
        db.rollback()
        logger.warning(f"Evidence cache set error for '{cache_key}': {err}")
    finally:
        if close_session:
            db.close()
