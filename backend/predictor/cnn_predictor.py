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
    model = get_model()
    output = model(tokens, training=False)
    raw_probs = output.numpy() if hasattr(output, "numpy") else np.array(output)

    # Handle 1D or 2D batch inputs
    if raw_probs.ndim == 1:
        probabilities = raw_probs
        probs_matrix = np.expand_dims(raw_probs, axis=0)
    elif raw_probs.shape[0] == 1:
        probabilities = raw_probs[0]
        probs_matrix = raw_probs
    else:
        probs_matrix = raw_probs
        # Use mean probability across windows for primary label
        probabilities = np.mean(raw_probs, axis=0)

    predicted_label = int(np.argmax(probabilities))
    confidence = float(np.max(probabilities))

    return {
        "label": predicted_label,
        "confidence": confidence,
        "probabilities": probabilities.tolist(),
        "matrix": probs_matrix.tolist(),
    }



def reset_model_cache():
    global _MODEL

    _MODEL = None
