from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "trained_models" / "best_cnn_model.keras"

_MODEL = None


def get_model():
    global _MODEL

    if _MODEL is None:
        from tensorflow.keras.models import load_model

        _MODEL = load_model(MODEL_PATH)

    return _MODEL


def predict(tokens: np.ndarray):

    probabilities = get_model().predict(tokens, verbose=0)[0]

    predicted_label = int(np.argmax(probabilities))

    confidence = float(np.max(probabilities))

    return {
        "label": predicted_label,
        "confidence": confidence,
        "probabilities": probabilities.tolist()
    }


def reset_model_cache():
    global _MODEL

    _MODEL = None
