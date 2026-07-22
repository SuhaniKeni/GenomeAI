from pathlib import Path

import tensorflow as tf


BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "trained_models"


cnn_model = tf.keras.models.load_model(
    MODEL_DIR / "best_cnn_model.keras"
)

lstm_model = tf.keras.models.load_model(
    MODEL_DIR / "best_lstm_model.keras"
)

print("CNN model loaded successfully.")
print("LSTM model loaded successfully.")