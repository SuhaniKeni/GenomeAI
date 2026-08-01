"""LSTM-based DNA disease predictor.

Loads the trained LSTM model and runs inference.
Uses the same tokenisation as CNN (A=0, T=1, G=2, C=3, N=4).
"""

from __future__ import annotations

import time
from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "trained_models" / "best_lstm_model.keras"

_MODEL = None


def get_model():
    global _MODEL
    if _MODEL is None:
        from tensorflow.keras.models import load_model

        _MODEL = load_model(MODEL_PATH)
    return _MODEL


def predict(tokens: np.ndarray) -> dict:
    """Run LSTM inference on tokenised input.

    Args:
        tokens: shape (1, 201) int32 array (A=0, T=1, G=2, C=3, N=4)

    Returns:
        dict with label, confidence, probabilities, inference_time_ms
    """
    model = get_model()

    start = time.perf_counter()
    output = model(tokens, training=False)
    probabilities = output.numpy()[0] if hasattr(output, "numpy") else np.array(output)[0]
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    predicted_label = int(np.argmax(probabilities))
    confidence = float(np.max(probabilities))

    return {
        "label": predicted_label,
        "confidence": confidence,
        "probabilities": probabilities.tolist(),
        "inference_time_ms": elapsed_ms,
    }


def reset_model_cache():
    global _MODEL
    _MODEL = None
