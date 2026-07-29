"""Prediction history service.

Stores prediction records in a local SQLite database for History, Admin Dashboard,
and Doctor Dashboard features.
"""
from __future__ import annotations

import json
import sqlite3
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]
DB_FILE = BASE_DIR / "trained_models" / "prediction_history.db"
LEGACY_JSON_FILE = BASE_DIR / "trained_models" / ".prediction_history.json"


def _get_connection() -> sqlite3.Connection:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _get_connection() as conn:
        # 1. Laboratories Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS laboratories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lab_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                institution TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # 2. Users Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lab_id INTEGER NOT NULL,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (lab_id) REFERENCES laboratories(id)
            )
        """)

        # 3. DNA Analyses Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS dna_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                lab_id INTEGER NOT NULL,
                sample_id TEXT NOT NULL,
                dna_sequence TEXT NOT NULL,
                prediction TEXT NOT NULL,
                confidence REAL NOT NULL,
                confidence_level TEXT NOT NULL,
                created_at TEXT NOT NULL,
                report_path TEXT,
                model_version TEXT NOT NULL,
                all_predictions TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (lab_id) REFERENCES laboratories(id)
            )
        """)

        # 4. Reports Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                lab_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (lab_id) REFERENCES laboratories(id)
            )
        """)

        # 5. Legacy History Table
        # 5. Legacy History Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                sequence TEXT NOT NULL,
                predicted_disease TEXT NOT NULL,
                confidence REAL NOT NULL,
                confidence_level TEXT NOT NULL,
                model TEXT NOT NULL,
                all_predictions TEXT NOT NULL,
                sequence_length INTEGER NOT NULL,
                inference_time_ms REAL,
                shap_explanation TEXT,
                mutation_summary TEXT,
                blast_data TEXT
            )
        """)

        # Auto-migrate history table schema if blast_data column is missing
        existing_cols = [r[1] for r in conn.execute("PRAGMA table_info(history)").fetchall()]
        if "blast_data" not in existing_cols:
            conn.execute("ALTER TABLE history ADD COLUMN blast_data TEXT")

        # Seed Default Laboratory & Default Users if empty
        count_labs = conn.execute("SELECT COUNT(*) FROM laboratories").fetchone()[0]
        if count_labs == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute("""
                INSERT INTO laboratories (lab_code, name, institution, created_at)
                VALUES (?, ?, ?, ?)
            """, ("LAB-CENTRAL-01", "Central Genomics Institute", "National Bioinformatics Center", now_iso))
            default_lab_id = cursor.lastrowid

            from backend.services.auth_service import get_password_hash

            conn.execute("""
                INSERT INTO users (lab_id, email, full_name, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (default_lab_id, "admin@genomeai.lab", "Dr. Sarah Jenkins", get_password_hash("admin123"), "Administrator", now_iso))

            conn.execute("""
                INSERT INTO users (lab_id, email, full_name, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (default_lab_id, "tech@genomeai.lab", "Alex Vance", get_password_hash("tech123"), "Laboratory Technician", now_iso))

            conn.execute("""
                INSERT INTO users (lab_id, email, full_name, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (default_lab_id, "manager@genomeai.lab", "Elena Rostova", get_password_hash("manager123"), "Laboratory Manager", now_iso))

        conn.commit()


    # Import legacy JSON data if present and table is empty
    if LEGACY_JSON_FILE.exists():
        try:
            with open(LEGACY_JSON_FILE) as f:
                records = json.load(f)
            if records:
                with _get_connection() as conn:
                    count = conn.execute("SELECT COUNT(*) FROM history").fetchone()[0]
                    if count == 0:
                        for r in records:
                            conn.execute("""
                                INSERT INTO history (
                                    timestamp, sequence, predicted_disease, confidence,
                                    confidence_level, model, all_predictions, sequence_length,
                                    inference_time_ms, shap_explanation, mutation_summary, blast_data
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                r.get("timestamp", datetime.now(timezone.utc).isoformat()),
                                r.get("sequence", "")[:100],
                                r.get("predicted_disease", "Unknown"),
                                float(r.get("confidence", 0.0)),
                                r.get("confidence_level", "Unknown"),
                                r.get("model", "CNN"),
                                json.dumps(r.get("all_predictions", [])),
                                int(r.get("sequence_length", 0)),
                                r.get("inference_time_ms"),
                                r.get("shap_explanation"),
                                r.get("mutation_summary"),
                                json.dumps(r.get("blast")) if r.get("blast") else None,
                            ))
                        conn.commit()
        except Exception:
            pass


_init_db()


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
    ts = datetime.now(timezone.utc).isoformat()
    seq_short = str(sequence)[:100]
    all_pred_str = json.dumps(all_predictions[:5])
    blast_str = json.dumps(blast_data) if blast_data else None

    with _get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO history (
                timestamp, sequence, predicted_disease, confidence,
                confidence_level, model, all_predictions, sequence_length,
                inference_time_ms, shap_explanation, mutation_summary, blast_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ts, seq_short, predicted_disease, float(confidence),
            confidence_level, model, all_pred_str, int(sequence_length),
            inference_time_ms, shap_explanation, mutation_summary, blast_str
        ))
        conn.commit()
        return cursor.lastrowid


def _row_to_dict(row: sqlite3.Row) -> dict:
    try:
        preds = json.loads(row["all_predictions"])
    except Exception:
        preds = []

    blast_obj = None
    try:
        if "blast_data" in row.keys() and row["blast_data"]:
            blast_obj = json.loads(row["blast_data"])
    except Exception:
        blast_obj = None

    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "sequence": row["sequence"],
        "predicted_disease": row["predicted_disease"],
        "confidence": row["confidence"],
        "confidence_level": row["confidence_level"],
        "model": row["model"],
        "all_predictions": preds,
        "sequence_length": row["sequence_length"],
        "inference_time_ms": row["inference_time_ms"],
        "shap_explanation": row["shap_explanation"],
        "mutation_summary": row["mutation_summary"],
        "blast": blast_obj,
    }


def get_history(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    model_filter: Optional[str] = None,
    disease_filter: Optional[str] = None,
) -> dict:
    """Get paginated, optionally filtered history."""
    query = "SELECT * FROM history WHERE 1=1"
    params = []

    if search and isinstance(search, str):
        query += " AND (LOWER(predicted_disease) LIKE ? OR LOWER(sequence) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s])

    if model_filter and isinstance(model_filter, str):
        query += " AND LOWER(model) = ?"
        params.append(model_filter.lower())

    if disease_filter and isinstance(disease_filter, str):
        query += " AND LOWER(predicted_disease) = ?"
        params.append(disease_filter.lower())


    with _get_connection() as conn:
        # Count total matching rows
        count_query = f"SELECT COUNT(*) FROM ({query})"
        total = conn.execute(count_query, params).fetchone()[0]

        # Fetch page sorted descending by timestamp/id
        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        records = [_row_to_dict(r) for r in rows]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": records,
    }


def delete_record(record_id: int) -> bool:
    """Delete a record by ID."""
    with _get_connection() as conn:
        cursor = conn.execute("DELETE FROM history WHERE id = ?", (record_id,))
        conn.commit()
        return cursor.rowcount > 0


def clear_history():
    """Delete all history records."""
    with _get_connection() as conn:
        conn.execute("DELETE FROM history")
        conn.commit()


def get_statistics() -> dict:
    """Aggregate statistics from all history records (for admin dashboard)."""
    with _get_connection() as conn:
        rows = conn.execute("SELECT timestamp, predicted_disease, confidence, model FROM history").fetchall()

    if not rows:
        return {
            "total_predictions": 0,
            "average_confidence": 0,
            "most_predicted_disease": None,
            "model_usage": {},
            "predictions_per_day": {},
        }

    total = len(rows)
    avg_confidence = round(sum(r["confidence"] for r in rows) / total, 2)

    disease_counts = Counter(r["predicted_disease"] for r in rows)
    most_common = disease_counts.most_common(1)

    model_usage = dict(Counter(r["model"] for r in rows))

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    daily = Counter()
    for r in rows:
        try:
            ts = datetime.fromisoformat(r["timestamp"])
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


# ============================================================
# LIS Multi-Tenant Management Functions
# ============================================================

def create_laboratory(name: str, lab_code: str, institution: str = "") -> dict:
    """Creates a new laboratory record."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with _get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO laboratories (lab_code, name, institution, created_at)
            VALUES (?, ?, ?, ?)
        """, (lab_code, name, institution, now_iso))
        conn.commit()
        lab_id = cursor.lastrowid

    return {
        "id": lab_id,
        "lab_code": lab_code,
        "name": name,
        "institution": institution,
        "created_at": now_iso
    }


def get_laboratory_by_id(lab_id: int) -> Optional[dict]:
    """Fetches a laboratory by ID."""
    with _get_connection() as conn:
        row = conn.execute("SELECT * FROM laboratories WHERE id = ?", (lab_id,)).fetchone()
        if not row:
            return None
        return dict(row)


def create_user_record(lab_id: int, email: str, full_name: str, password_hash: str, role: str) -> dict:
    """Creates a new user record in a laboratory."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with _get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO users (lab_id, email, full_name, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (lab_id, email, full_name, password_hash, role, now_iso))
        conn.commit()
        user_id = cursor.lastrowid

    return {
        "id": user_id,
        "lab_id": lab_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "created_at": now_iso
    }


def get_user_by_email(email: str) -> Optional[dict]:
    """Fetches user record by email."""
    with _get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email.lower().strip(),)).fetchone()
        if not row:
            return None
        return dict(row)


def get_users_by_lab(lab_id: int) -> list[dict]:
    """Returns all users belonging to a specific laboratory."""
    with _get_connection() as conn:
        rows = conn.execute("SELECT id, lab_id, email, full_name, role, created_at FROM users WHERE lab_id = ?", (lab_id,)).fetchall()
        return [dict(r) for r in rows]


def delete_user_by_id(user_id: int, lab_id: int) -> bool:
    """Deletes a user belonging to a lab."""
    with _get_connection() as conn:
        cursor = conn.execute("DELETE FROM users WHERE id = ? AND lab_id = ?", (user_id, lab_id))
        conn.commit()
        return cursor.rowcount > 0


