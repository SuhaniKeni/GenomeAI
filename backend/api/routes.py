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

import logging
from io import BytesIO

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

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

router = APIRouter()
logger = logging.getLogger(__name__)


class PredictionRequest(BaseModel):
    sequence: str


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
def predict(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
    explain: bool = Query(False, description="Run SHAP explainability"),
):
    try:
        result = _run_model(request.sequence, model)

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
            )
        except Exception as exc:
            logger.warning(f"Failed to save prediction history: {exc}")

        return {"success": True, "result": result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except Exception:
        logger.exception("Unexpected prediction failure")
        raise HTTPException(
            status_code=500,
            detail={"message": "Prediction failed. Please try again later."},
        )


# ============================================================
# Predict — Extended (full suite: predict + mutation + shap)
# ============================================================

@router.post("/predict/extended")
def predict_extended(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
):
    """Full prediction with mutation analysis and SHAP explainability."""
    try:
        result = _run_model(request.sequence, model)
        tokens = prepare_model_input(request.sequence)
        cleaned = str(request.sequence).strip().upper()

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
            )
        except Exception as exc:
            logger.warning(f"Failed to save prediction history: {exc}")

        return {"success": True, "result": result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except Exception:
        logger.exception("Unexpected extended prediction failure")
        raise HTTPException(
            status_code=500,
            detail={"message": "Prediction failed. Please try again later."},
        )


# ============================================================
# Report
# ============================================================

@router.post("/predict/report")
def predict_report(
    request: PredictionRequest,
    model: str = Query("cnn", description="Model to use: cnn, lstm, transformer"),
    patient_name: str = Query("", description="Optional patient name for report"),
):
    try:
        result = _run_model(request.sequence, model)

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

        result["shap_explanation"] = shap_text
        result["mutation_summary"] = mutation_text

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
        return get_history(
            limit=limit,
            offset=offset,
            search=search,
            model_filter=model_filter,
            disease_filter=disease_filter,
        )
    except Exception:
        logger.exception("History fetch failed")
        raise HTTPException(status_code=500, detail={"message": "Failed to fetch history."})


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
