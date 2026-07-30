import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "trained_models"

logger = logging.getLogger(__name__)

_CNN_MODEL = None
_LSTM_MODEL = None


def get_cnn_model():
    """Returns cached TensorFlow CNN model, loading it into memory on first access."""
    global _CNN_MODEL
    if _CNN_MODEL is None:
        model_path = MODEL_DIR / "best_cnn_model.keras"
        if not model_path.exists():
            logger.warning(f"CNN model weights file not found at {model_path}. Lazy fallback will apply.")
            raise FileNotFoundError(f"CNN model weights not found at {model_path}")
        import tensorflow as tf
        _CNN_MODEL = tf.keras.models.load_model(model_path)
        logger.info("✓ TensorFlow CNN model loaded into memory and cached successfully.")
    return _CNN_MODEL


def get_lstm_model():
    """Returns cached TensorFlow LSTM model, loading it into memory on first access."""
    global _LSTM_MODEL
    if _LSTM_MODEL is None:
        model_path = MODEL_DIR / "best_lstm_model.keras"
        if not model_path.exists():
            logger.warning(f"LSTM model weights file not found at {model_path}. Lazy fallback will apply.")
            raise FileNotFoundError(f"LSTM model weights not found at {model_path}")
        import tensorflow as tf
        _LSTM_MODEL = tf.keras.models.load_model(model_path)
        logger.info("✓ TensorFlow LSTM model loaded into memory and cached successfully.")
    return _LSTM_MODEL


def preload_models():
    """Preloads and pre-warms AI models into memory during application startup."""
    try:
        get_cnn_model()
    except Exception as e:
        logger.warning(f"Preload CNN model warning: {e}")