from pathlib import Path

from tensorflow.keras.models import load_model
from tensorflow.keras.utils import to_categorical

from data_loader import load_data
from evaluate import evaluate_model

# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "trained_models" / "best_cnn_model.keras"

print("Loading test dataset...")

X_train, X_test, y_train, y_test = load_data()

y_test = to_categorical(y_test, num_classes=8)

print("Loading CNN model...")

model = load_model(MODEL_PATH)

print("Model loaded successfully!")

evaluate_model(model, X_test, y_test)