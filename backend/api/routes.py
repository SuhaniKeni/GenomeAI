"""Enhanced API routes for GenomeAI.

Extends the original routes with:
- Model selection (CNN, LSTM, Transformer)
- SHAP explainability
- Mutation analysis
- Prediction history
- Benchmarking
- Dataset analytics
- Multi-model comparison
- Enhanced PDF reports
- AI insights generation
"""
from __future__ import annotations

import json
import logging
from io import BytesIO
from pathlib import Path

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Header, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()
BASE_DIR = Path(__file__).resolve().parents[2]


try:
    from backend.db.session import get_db, Base, engine
    from backend.db.models import Laboratory, User, DNAAnalysis, Report
    from backend.services.auth_service import (
        create_access_token, decode_access_token, get_password_hash, verify_password
    )
except ImportError:
    from db.session import get_db, Base, engine
    from db.models import Laboratory, User, DNAAnalysis, Report
    from services.auth_service import (
        create_access_token, decode_access_token, get_password_hash, verify_password
    )

# Auto-create SQLAlchemy tables
Base.metadata.create_all(bind=engine)



class RegisterLabRequest(BaseModel):
    lab_name: str = Field(..., min_length=2, max_length=100)
    lab_code: str = Field(..., min_length=2, max_length=30)
    institution: Optional[str] = ""
    admin_email: str = Field(..., min_length=5, max_length=100)
    admin_name: str = Field(..., min_length=2, max_length=100)
    admin_password: str = Field(..., min_length=4, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: str



try:
    from backend.predictor.predictor import predict_disease
    from backend.services.report_generator import generate_prediction_report_pdf
    from backend.services.explainability_service import (
        compute_shap_values,
        generate_explanation_text,
    )
    from backend.services.mutation_analysis import (
        compare_to_consensus,
        get_mutation_summary_text,
    )
    from backend.services.benchmark_service import get_cached_benchmark, run_benchmark
    from backend.services.analytics_service import get_cached_analytics
    from backend.services.prediction_history import (
        add_record,
        get_history,
        delete_record,
        clear_history,
        get_statistics,
    )
    from backend.utils.tokenizer import prepare_model_input, EXPECTED_LENGTH
    from backend.utils.disease_mapper import get_disease
    from backend.services.evidence_builder import build_genomic_evidence
    from backend.services.blast_service import execute_blast_search
except ImportError:
    try:
        from backend.predictor.predictor import predict_disease
        from backend.services.report_generator import generate_prediction_report_pdf
        from backend.services.explainability_service import (
            compute_shap_values,
            generate_explanation_text,
        )
        from backend.services.mutation_analysis import (
            compare_to_consensus,
            get_mutation_summary_text,
        )
        from backend.services.benchmark_service import get_cached_benchmark, run_benchmark
        from backend.services.analytics_service import get_cached_analytics
        from backend.services.prediction_history import (
            add_record,
            get_history,
            delete_record,
            clear_history,
            get_statistics,
        )
        from backend.utils.tokenizer import prepare_model_input, EXPECTED_LENGTH
        from backend.utils.disease_mapper import get_disease
        from backend.services.evidence_builder import build_genomic_evidence
        from backend.services.blast_service import execute_blast_search
    except ImportError:
        from predictor.predictor import predict_disease
        from services.report_generator import generate_prediction_report_pdf
        from services.explainability_service import (
            compute_shap_values,
            generate_explanation_text,
        )
        from services.mutation_analysis import (
            compare_to_consensus,
            get_mutation_summary_text,
        )
        from services.benchmark_service import get_cached_benchmark, run_benchmark
        from services.analytics_service import get_cached_analytics
        from services.prediction_history import (
            add_record,
            get_history,
            delete_record,
            clear_history,
            get_statistics,
        )
        from utils.tokenizer import prepare_model_input, EXPECTED_LENGTH
        from utils.disease_mapper import get_disease
        from services.evidence_builder import build_genomic_evidence
        from services.blast_service import execute_blast_search

router = APIRouter()
logger = logging.getLogger(__name__)


class PredictionRequest(BaseModel):
    sequence: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="DNA sequence string (A, T, G, C, N)"
    )



# ============================================================
# Helper
# ============================================================

def _run_model(sequence: str, model: str = "cnn"):
    """Run prediction with the specified model and return extended results."""
    model = model.lower()

    if model == "cnn":
        from backend.predictor.cnn_predictor import predict as model_predict
        predict_fn = model_predict
        model_name = "CNN"
    elif model == "lstm":
        from backend.predictor.lstm_predictor import predict as model_predict
        predict_fn = model_predict
        model_name = "LSTM"
    elif model == "transformer":
        from backend.predictor.transformer_predictor import predict as model_predict
        predict_fn = model_predict
        model_name = "Transformer"
    else:
        raise ValueError(f"Unsupported model '{model}'. Choose: cnn, lstm, transformer")

    tokens = prepare_model_input(sequence)
    result = predict_fn(tokens)

    probabilities = result["probabilities"]
    all_predictions = []
    for label, probability in enumerate(probabilities):
        all_predictions.append({
            "disease": get_disease(label),
            "probability": round(probability * 100, 2),
        })
    all_predictions.sort(key=lambda x: x["probability"], reverse=True)

    confidence = round(result["confidence"] * 100, 2)
    cleaned = str(sequence).strip()
    inference_time = result.get("inference_time_ms")

    # Confidence level
    if confidence >= 90:
        confidence_level = "Very High"
    elif confidence >= 75:
        confidence_level = "High"
    elif confidence >= 50:
        confidence_level = "Moderate"
    else:
        confidence_level = "Low"

    predicted_label = result["label"]

    return {
        "predicted_disease": get_disease(predicted_label),
        "label": predicted_label,
        "confidence": confidence,
        "confidence_level": confidence_level,
        "model": model_name,
        "sequence_length": len(cleaned),
        "all_predictions": all_predictions[:5],
        "inference_time_ms": inference_time,
    }


# ============================================================
# Health
# ============================================================

@router.get("/health")
def health_check():
    return {
        "status": "Healthy",
        "service": "GenomeAI Backend",
        "models": ["CNN", "LSTM", "Transformer"],
        "version": "2.0.0",
    }


# ============================================================
# Predict
# ============================================================

@router.post("/predict")
async def predict(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
    explain: bool = Query(False, description="Run SHAP explainability"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):

    try:
        result = _run_model(request.sequence, model)

        # Attach Genomic Evidence Layer (Async Local KB + Cache + ClinVar/NCBI parallel fallback)
        try:
            evidence_obj = await build_genomic_evidence(
                prediction_disease=result["predicted_disease"],
                cnn_confidence=result["confidence"],
            )
            result["evidence"] = evidence_obj
        except Exception as ev_exc:
            logger.warning(f"Genomic evidence builder exception: {ev_exc}")
            result["evidence"] = {
                "prediction": result["predicted_disease"],
                "cnn_confidence": result["confidence"],
                "evidence_score": "No External Evidence",
                "evidence_summary": "No external genomic evidence available.",
                "sources": [],
                "verified_badges": {"local_genomeai": False, "clinvar": False, "ncbi": False},
            }

        # SHAP explainability
        shap_result = None
        if explain:
            try:
                tokens = prepare_model_input(request.sequence)
                shap_result = compute_shap_values(tokens, model_type=model)
                explanation = generate_explanation_text(
                    shap_result, result["predicted_disease"]
                )
                result["shap_explainability"] = shap_result
                result["shap_explanation"] = explanation
            except Exception as exc:
                logger.warning(f"SHAP explainability failed: {exc}")
                result["shap_explanation"] = None
                result["shap_explainability"] = None

        # AI Insights
        insights_parts = []
        if result["confidence_level"] == "Very High":
            insights_parts.append(
                "The prediction confidence is very high because multiple disease-associated "
                "genomic patterns were detected across the sequence."
            )
        elif result["confidence_level"] == "High":
            insights_parts.append(
                "The prediction confidence is high, indicating strong alignment with "
                "known disease-associated variant signatures."
            )
        elif result["confidence_level"] == "Moderate":
            insights_parts.append(
                "The prediction confidence is moderate, suggesting partial overlap with "
                "disease-associated patterns. Further clinical validation is recommended."
            )
        else:
            insights_parts.append(
                "The prediction confidence is low. The sequence may not contain strong "
                "disease-associated signals, or may represent a novel variant."
            )

        insights_parts.append(
            f"The {result['model']} model identified {result['predicted_disease']} as "
            f"the most likely classification based on learned genomic sequence patterns."
        )
        result["ai_insights"] = " ".join(insights_parts)

        # Attach NCBI Remote BLAST similarity analysis
        try:
            blast_res = await execute_blast_search(request.sequence)
            result["blast"] = blast_res
        except Exception as blast_exc:
            logger.warning(f"BLAST search execution exception: {blast_exc}")
            result["blast"] = {
                "status": "failed",
                "error": f"BLAST execution failed: {blast_exc}",
                "query_length": len(request.sequence),
                "top_hit": None,
            }

        # Save to history via SQLAlchemy ORM
        try:
            import json
            from datetime import datetime, timezone
            import random

            user_ctx = _get_current_user_from_header(authorization, db=db)
            analysis_id = f"ANL-{random.randint(10000, 99999)}"
            sample_id = f"SAM-{random.randint(100000, 999999)}"

            orm_analysis = DNAAnalysis(
                analysis_id=analysis_id,
                lab_id=user_ctx["lab_id"],
                user_id=user_ctx["user_id"],
                sample_id=sample_id,
                dna_sequence=request.sequence,
                sequence_length=result["sequence_length"],
                predicted_disease=result["predicted_disease"],
                confidence_score=result["confidence"],
                probability_distribution=json.dumps(result["all_predictions"]),
                model_version=f"GenomeAI {result['model']} v2.0",
                analysis_status="completed",
                analysis_timestamp=datetime.now(timezone.utc)
            )
            db.add(orm_analysis)
            db.commit()

            add_record(
                sequence=request.sequence,
                predicted_disease=result["predicted_disease"],
                confidence=result["confidence"],
                confidence_level=result["confidence_level"],
                model=result["model"],
                all_predictions=result["all_predictions"],
                sequence_length=result["sequence_length"],
                inference_time_ms=result.get("inference_time_ms"),
                shap_explanation=result.get("shap_explanation"),
                blast_data=result.get("blast"),
            )
        except Exception as exc:
            logger.warning(f"Failed to save prediction history: {exc}")

        return {"success": True, "result": result, "blast": result.get("blast")}


    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except FileNotFoundError as e:
        logger.error(f"Prediction model weights or data not found: {e}")
        raise HTTPException(status_code=503, detail={"message": str(e)})
    except Exception as exc:
        logger.exception("Unexpected prediction failure")
        raise HTTPException(
            status_code=500,
            detail={"message": f"Prediction failed: {type(exc).__name__}"},
        )



# ============================================================
# Predict — Extended (full suite: predict + mutation + shap + blast)
# ============================================================

@router.post("/predict/extended")
async def predict_extended(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
):
    """Full prediction with mutation analysis, SHAP explainability, Genomic Evidence, and BLAST sequence search."""
    try:
        result = _run_model(request.sequence, model)
        tokens = prepare_model_input(request.sequence)

        # Attach Genomic Evidence Layer
        try:
            evidence_obj = await build_genomic_evidence(
                prediction_disease=result["predicted_disease"],
                cnn_confidence=result["confidence"],
            )
            result["evidence"] = evidence_obj
        except Exception as ev_exc:
            logger.warning(f"Extended genomic evidence builder exception: {ev_exc}")
            result["evidence"] = {
                "prediction": result["predicted_disease"],
                "cnn_confidence": result["confidence"],
                "evidence_score": "No External Evidence",
                "evidence_summary": "No external genomic evidence available.",
                "sources": [],
                "verified_badges": {"local_genomeai": False, "clinvar": False, "ncbi": False},
            }

        # Mutation analysis
        try:
            mutation_result = compare_to_consensus(tokens)
            mutation_summary = get_mutation_summary_text(
                mutation_result, result["predicted_disease"]
            )
            result["mutation_analysis"] = mutation_result
            result["mutation_summary"] = mutation_summary
        except Exception as exc:
            logger.warning(f"Mutation analysis failed: {exc}")
            result["mutation_analysis"] = None
            result["mutation_summary"] = None

        # SHAP explainability
        try:
            shap_result = compute_shap_values(tokens, model_type=model)
            explanation = generate_explanation_text(
                shap_result, result["predicted_disease"]
            )
            result["shap_explainability"] = shap_result
            result["shap_explanation"] = explanation
        except Exception as exc:
            logger.warning(f"SHAP explainability failed: {exc}")
            result["shap_explainability"] = None
            result["shap_explanation"] = None

        # Attach NCBI Remote BLAST similarity analysis
        try:
            blast_res = await execute_blast_search(request.sequence)
            result["blast"] = blast_res
        except Exception as blast_exc:
            logger.warning(f"Extended BLAST search execution exception: {blast_exc}")
            result["blast"] = {
                "status": "failed",
                "error": f"BLAST execution failed: {blast_exc}",
                "query_length": len(request.sequence),
                "top_hit": None,
            }

        # AI Insights
        insights = [f"The {result['model']} model predicted {result['predicted_disease']} "
                    f"with {result['confidence']}% confidence ({result['confidence_level']})."]
        if result.get("mutation_summary"):
            insights.append(result["mutation_summary"])
        if result.get("shap_explanation"):
            insights.append(result["shap_explanation"])
        result["ai_insights"] = " ".join(insights)

        # Save to history
        try:
            add_record(
                sequence=request.sequence,
                predicted_disease=result["predicted_disease"],
                confidence=result["confidence"],
                confidence_level=result["confidence_level"],
                model=result["model"],
                all_predictions=result["all_predictions"],
                sequence_length=result["sequence_length"],
                inference_time_ms=result.get("inference_time_ms"),
                shap_explanation=result.get("shap_explanation"),
                mutation_summary=result.get("mutation_summary"),
                blast_data=result.get("blast"),
            )
        except Exception as exc:
            logger.warning(f"Failed to save prediction history: {exc}")

        return {"success": True, "result": result, "blast": result.get("blast")}

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except Exception:
        logger.exception("Unexpected extended prediction failure")
        raise HTTPException(
            status_code=500,
            detail={"message": "Prediction failed. Please try again later."},
        )


# ============================================================
# Predict — Standalone BLAST Endpoint
# ============================================================

class BlastRequest(BaseModel):
    sequence: str = Field(..., min_length=1, max_length=5000, description="DNA sequence string (A, T, G, C, N)")


@router.post("/predict/blast")
async def run_blast_alignment(request: BlastRequest):
    """Execute NCBI Remote BLAST search for input sequence."""
    try:
        blast_res = await execute_blast_search(request.sequence)
        return {"success": True, "blast": blast_res}
    except Exception as exc:
        logger.exception("Failed to execute BLAST search")
        raise HTTPException(status_code=500, detail={"message": f"BLAST search failed: {exc}"})



# ============================================================
# Predict — Dedicated Evidence Endpoint
# ============================================================

class EvidenceQueryRequest(BaseModel):
    disease_name: str = Field(..., min_length=2, max_length=100)
    gene_symbol: Optional[str] = None
    variation_id: Optional[str] = None
    rsid: Optional[str] = None


@router.post("/predict/evidence")
async def get_prediction_evidence(request: EvidenceQueryRequest):
    """Retrieve standalone genomic evidence for a target disease or gene query."""
    try:
        evidence_obj = await build_genomic_evidence(
            prediction_disease=request.disease_name,
            cnn_confidence=95.0,
            gene_symbol=request.gene_symbol,
            variation_id=request.variation_id,
            rsid=request.rsid,
        )
        return {"success": True, "evidence": evidence_obj}
    except Exception as exc:
        logger.exception("Failed to build genomic evidence")
        raise HTTPException(status_code=500, detail={"message": "Evidence retrieval failed."})


# ============================================================
# Report
# ============================================================

@router.post("/predict/report")
async def predict_report(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
    patient_name: str = Query("", description="Optional patient name for report"),
):
    try:
        result = _run_model(request.sequence, model)

        # Attach Genomic Evidence Layer for PDF report
        try:
            evidence_obj = await build_genomic_evidence(
                prediction_disease=result["predicted_disease"],
                cnn_confidence=result["confidence"],
            )
            result["evidence"] = evidence_obj
        except Exception:
            pass

        # Get SHAP and mutation data for enhanced report
        shap_text = None
        mutation_text = None
        try:
            tokens = prepare_model_input(request.sequence)
            sh = compute_shap_values(tokens, model_type=model)
            shap_text = generate_explanation_text(sh, result["predicted_disease"])
            mut = compare_to_consensus(tokens)
            mutation_text = get_mutation_summary_text(mut, result["predicted_disease"])
        except Exception:
            pass

        # Attach NCBI Remote BLAST similarity analysis for PDF report
        try:
            blast_res = await execute_blast_search(request.sequence)
            result["blast"] = blast_res
        except Exception as blast_exc:
            logger.warning(f"Report BLAST execution exception: {blast_exc}")
            result["blast"] = {
                "status": "failed",
                "error": f"BLAST execution failed: {blast_exc}",
                "query_length": len(request.sequence),
                "top_hit": None,
            }

        # Save to history
        try:
            add_record(
                sequence=request.sequence,
                predicted_disease=result["predicted_disease"],
                confidence=result["confidence"],
                confidence_level=result["confidence_level"],
                model=result["model"],
                all_predictions=result["all_predictions"],
                sequence_length=result["sequence_length"],
                inference_time_ms=result.get("inference_time_ms"),
                shap_explanation=shap_text,
                mutation_summary=mutation_text,
                blast_data=result.get("blast"),
            )
        except Exception:
            pass

        pdf_bytes = generate_prediction_report_pdf(request.sequence, result, patient_name or None)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="genomeai_prediction_report.pdf"',
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except Exception:
        logger.exception("Unexpected report generation failure")
        raise HTTPException(
            status_code=500,
            detail={"message": "Report generation failed. Please try again later."},
        )


# ============================================================
# Dynamic Model Evaluation Metrics API
# ============================================================

@router.get("/model/metrics")
def get_model_metrics():
    """Retrieve dynamically generated evaluation metrics of the latest trained model."""
    metrics_path = BASE_DIR / "trained_models" / "model_metrics.json"
    if metrics_path.exists():
        try:
            with open(metrics_path, "r") as f:
                data = json.load(f)
            return {
                "success": True,
                "available": True,
                **data
            }
        except Exception as exc:
            logger.warning(f"Failed to read model_metrics.json: {exc}")

    return {
        "success": False,
        "available": False,
        "model_name": "Multi-Scale Parallel SE-ResCNN",
        "accuracy": None,
        "test_accuracy": None,
        "macro_f1": None,
        "weighted_f1": None,
        "balanced_accuracy": None,
        "training_loss": None,
        "inference_time_ms": None,
        "dataset_size": 19984,
        "test_samples": 2998,
        "trained_on": None,
        "message": "CNN ACCURACY: Not Available"
    }


# ============================================================
# Benchmark
# ============================================================

@router.get("/benchmark")
def benchmark(
    model: str = Query("all", description="Model to benchmark: cnn, lstm, transformer, all"),
):
    try:
        if model == "all":
            results = get_cached_benchmark()
        else:
            results = run_benchmark(model, sample_size=200)
        return {"success": True, "results": results}
    except Exception:
        logger.exception("Benchmark failed")
        raise HTTPException(status_code=500, detail={"message": "Benchmark failed."})


@router.post("/benchmark/refresh")
def refresh_benchmark():
    """Force re-run benchmark and update cache."""
    from backend.services.benchmark_service import clear_cache, run_benchmark
    try:
        clear_cache()
        results = run_benchmark("all", sample_size=200)
        return {"success": True, "results": results}
    except Exception:
        logger.exception("Benchmark refresh failed")
        raise HTTPException(status_code=500, detail={"message": "Benchmark refresh failed."})


# ============================================================
# Analytics
# ============================================================

@router.get("/analytics")
def analytics():
    try:
        stats = get_cached_analytics()
        return {"success": True, "analytics": stats}
    except Exception:
        logger.exception("Analytics fetch failed")
        raise HTTPException(status_code=500, detail={"message": "Analytics fetch failed."})


# ============================================================
# History
# ============================================================

@router.get("/history")
def history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    model_filter: str = Query(None, alias="model"),
    disease_filter: str = Query(None, alias="disease"),
):
    try:
        data = get_history(
            limit=limit,
            offset=offset,
            search=search,
            model_filter=model_filter,
            disease_filter=disease_filter,
        )
        logger.info(f"[API /history Debug] Returned {len(data.get('records', []))} records (Total: {data.get('total')}) from DB: {data.get('db_path')}")
        return data
    except Exception as exc:
        logger.exception("History fetch failed")
        raise HTTPException(status_code=500, detail={"message": f"Database operation failed: {str(exc)}"})


@router.delete("/history/{record_id}")
def delete_history_record(record_id: int):
    ok = delete_record(record_id)
    if not ok:
        raise HTTPException(status_code=404, detail={"message": "Record not found."})
    return {"success": True}


@router.delete("/history")
def clear_all_history():
    clear_history()
    return {"success": True}


# ============================================================
# Admin Statistics
# ============================================================

@router.get("/admin/stats")
def admin_statistics():
    try:
        stats = get_statistics()
        return {"success": True, "stats": stats}
    except Exception:
        logger.exception("Admin stats fetch failed")
        raise HTTPException(status_code=500, detail={"message": "Failed to fetch admin stats."})


# ============================================================
# LIS Auth & Multi-Tenant Routes
# ============================================================

def _get_current_user_from_header(authorization: Optional[str] = Header(None), db: Session = None) -> dict:
    own_db = False
    if db is None:
        db = next(get_db())
        own_db = True

    try:
        if not authorization or not authorization.startswith("Bearer "):
            user = db.query(User).filter(User.email == "admin@genomeai.lab").first()
            if not user:
                # Seed default lab and admin if missing
                lab = Laboratory(laboratory_name="Central Genomics Institute", registration_number="LAB-CENTRAL-01", email="info@genomeai.lab")
                db.add(lab)
                db.commit()
                db.refresh(lab)
                user = User(lab_id=lab.lab_id, email="admin@genomeai.lab", full_name="Dr. Sarah Jenkins", password_hash=get_password_hash("admin123"), role="Administrator")
                db.add(user)
                db.commit()
                db.refresh(user)

            lab = db.query(Laboratory).filter(Laboratory.lab_id == user.lab_id).first()
            return {
                "user_id": user.user_id,
                "lab_id": user.lab_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "password_hash": user.password_hash,
                "laboratory": {
                    "id": lab.lab_id if lab else 1,
                    "name": lab.laboratory_name if lab else "Central Genomics Institute",
                    "lab_code": lab.registration_number if lab else "LAB-CENTRAL-01",
                }
            }

        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail={"message": "Invalid or expired JWT token."})

        user = db.query(User).filter(User.email == payload.get("email", "")).first()
        if not user:
            raise HTTPException(status_code=401, detail={"message": "User account no longer exists."})

        lab = db.query(Laboratory).filter(Laboratory.lab_id == user.lab_id).first()
        return {
            "user_id": user.user_id,
            "lab_id": user.lab_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "password_hash": user.password_hash,
            "laboratory": {
                "id": lab.lab_id if lab else user.lab_id,
                "name": lab.laboratory_name if lab else "Laboratory",
                "lab_code": lab.registration_number if lab else "LAB-01",
            }
        }
    finally:
        if own_db:
            db.close()


@router.post("/auth/register-lab")
def register_laboratory_and_admin(req: RegisterLabRequest, db: Session = Depends(get_db)):
    """Registers a new laboratory and creates its Administrator account using SQLAlchemy ORM."""
    existing_user = db.query(User).filter(User.email == req.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail={"message": "An account with this email already exists."})

    try:
        lab = Laboratory(
            laboratory_name=req.lab_name,
            registration_number=req.lab_code,
            email=req.admin_email,
            address=req.institution or ""
        )
        db.add(lab)
        db.commit()
        db.refresh(lab)

        user = User(
            lab_id=lab.lab_id,
            email=req.admin_email,
            full_name=req.admin_name,
            password_hash=get_password_hash(req.admin_password),
            role="Administrator"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": str(user.user_id), "email": user.email, "role": user.role, "lab_id": lab.lab_id})

        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            "laboratory": {
                "id": lab.lab_id,
                "name": lab.laboratory_name,
                "lab_code": lab.registration_number,
            }
        }
    except Exception as e:
        db.rollback()
        logger.exception("Lab registration failed")
        raise HTTPException(status_code=500, detail={"message": str(e) or "Failed to register laboratory."})


@router.post("/auth/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates laboratory user via SQLAlchemy ORM and returns JWT bearer token."""
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail={"message": "Invalid email address or password."})

    lab = db.query(Laboratory).filter(Laboratory.lab_id == user.lab_id).first()
    token = create_access_token({"sub": str(user.user_id), "email": user.email, "role": user.role, "lab_id": user.lab_id})

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
        "laboratory": {
            "id": lab.lab_id if lab else user.lab_id,
            "name": lab.laboratory_name if lab else "Laboratory",
            "lab_code": lab.registration_number if lab else "LAB-01",
        }
    }


@router.get("/auth/me")
def get_current_user_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Returns current logged-in user profile & lab details."""
    user = _get_current_user_from_header(authorization, db=db)
    return {
        "success": True,
        "user": {
            "id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
        },
        "laboratory": user.get("laboratory")
    }


@router.post("/auth/change-password")
def change_password(req: ChangePasswordRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Changes password for logged in user using SQLAlchemy ORM."""
    current_user = _get_current_user_from_header(authorization, db=db)
    if not verify_password(req.old_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail={"message": "Current password is incorrect."})

    db_user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
    if db_user:
        db_user.password_hash = get_password_hash(req.new_password)
        db.commit()

    return {"success": True, "message": "Password updated successfully."}


@router.post("/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates password reset acknowledgment for LIS user."""
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        return {"success": True, "message": "If an account exists, password reset instructions have been sent."}

    return {"success": True, "message": "Password reset request recorded. Contact your LIS Laboratory Manager."}


@router.get("/lis/users")
def get_laboratory_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Lists users belonging to logged-in user's laboratory."""
    current_user = _get_current_user_from_header(authorization, db=db)
    users = db.query(User).filter(User.lab_id == current_user["lab_id"]).all()
    user_list = [
        {
            "id": u.user_id,
            "lab_id": u.lab_id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]
    return {"success": True, "users": user_list}


@router.post("/lis/users")
def create_laboratory_user(req: CreateUserRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Creates a new user in current laboratory (Admin / Lab Manager only)."""
    current_user = _get_current_user_from_header(authorization, db=db)
    if current_user["role"] not in {"Administrator", "Laboratory Manager"}:
        raise HTTPException(status_code=403, detail={"message": "Permission denied. Only Administrators and Laboratory Managers can add users."})

    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail={"message": "A user with this email already exists."})

    new_user = User(
        lab_id=current_user["lab_id"],
        email=req.email.strip().lower(),
        full_name=req.full_name,
        password_hash=get_password_hash(req.password),
        role=req.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "user": {
            "id": new_user.user_id,
            "lab_id": new_user.lab_id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }


@router.delete("/lis/users/{user_id}")
def remove_laboratory_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Deletes a laboratory user (Admin only)."""
    current_user = _get_current_user_from_header(authorization, db=db)
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail={"message": "Permission denied. Only Administrators can delete users."})

    db_user = db.query(User).filter(User.user_id == user_id, User.lab_id == current_user["lab_id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail={"message": "User not found."})

    db.delete(db_user)
    db.commit()
    return {"success": True}


@router.get("/lis/lab")
def get_laboratory_details(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Returns details of current logged-in laboratory."""
    current_user = _get_current_user_from_header(authorization, db=db)
    lab = db.query(Laboratory).filter(Laboratory.lab_id == current_user["lab_id"]).first()
    if not lab:
        return {"success": True, "laboratory": current_user.get("laboratory")}

    return {
        "success": True,
        "laboratory": {
            "id": lab.lab_id,
            "name": lab.laboratory_name,
            "lab_code": lab.registration_number,
            "institution": lab.address or "",
            "created_at": lab.created_at.isoformat() if lab.created_at else None
        }
    }


