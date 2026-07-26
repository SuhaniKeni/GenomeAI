import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "trained_models"

logger = logging.getLogger(__name__)

_CNN_MODEL = None
_LSTM_MODEL = None


def get_cnn_model():
    global _CNN_MODEL
    if _CNN_MODEL is None:
        model_path = MODEL_DIR / "best_cnn_model.keras"
        if not model_path.exists():
            raise FileNotFoundError(f"CNN model weights not found at {model_path}")
        import tensorflow as tf
        _CNN_MODEL = tf.keras.models.load_model(model_path)
        logger.info("CNN model loaded successfully.")
    return _CNN_MODEL


def get_lstm_model():
    global _LSTM_MODEL
    if _LSTM_MODEL is None:
        model_path = MODEL_DIR / "best_lstm_model.keras"
        if not model_path.exists():
            raise FileNotFoundError(f"LSTM model weights not found at {model_path}")
        import tensorflow as tf
        _LSTM_MODEL = tf.keras.models.load_model(model_path)
        logger.info("LSTM model loaded successfully.")
    return _LSTM_MODEL