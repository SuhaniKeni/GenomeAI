import os
from pathlib import Path

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Embedding,
    Conv1D,
    BatchNormalization,
    MaxPooling1D,
    GlobalMaxPooling1D,
    Dense,
    Dropout,
)
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)

from data_loader import load_data
from evaluate import evaluate_model
from metrics import save_training_plots
from class_weights import get_class_weights

BASE_DIR = Path(__file__).resolve().parents[2]

os.makedirs(BASE_DIR / "trained_models", exist_ok=True)

# ----------------------------------------------------
# Load Dataset
# ----------------------------------------------------

X_train, X_test, y_train, y_test = load_data()

# Calculate class weights BEFORE one-hot encoding
class_weights = get_class_weights(y_train)

# One-hot encode labels
y_train = to_categorical(y_train, num_classes=8)
y_test = to_categorical(y_test, num_classes=8)

# ----------------------------------------------------
# Build CNN Model
# ----------------------------------------------------

model = Sequential([
    Embedding(input_dim=5, output_dim=32),

    Conv1D(64, 7, activation="relu", padding="same"),
    BatchNormalization(),
    MaxPooling1D(pool_size=2),
    Dropout(0.25),

    Conv1D(128, 5, activation="relu", padding="same"),
    BatchNormalization(),
    MaxPooling1D(pool_size=2),
    Dropout(0.30),

    Conv1D(256, 3, activation="relu", padding="same"),
    BatchNormalization(),
    GlobalMaxPooling1D(),
    Dropout(0.40),

    Dense(128, activation="relu"),
    BatchNormalization(),
    Dropout(0.40),
    Dense(8, activation="softmax")
])

model.build(input_shape=(None, X_train.shape[1]))

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ----------------------------------------------------
# Callbacks
# ----------------------------------------------------

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=8,
    restore_best_weights=True
)

model_checkpoint = ModelCheckpoint(
    BASE_DIR / "trained_models" / "best_cnn_model.keras",
    monitor="val_accuracy",
    save_best_only=True
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=2,
    verbose=1
)

# ----------------------------------------------------
# Train Model
# ----------------------------------------------------

history = model.fit(
    X_train,
    y_train,
    validation_split=0.2,
    epochs=50,
    batch_size=64,
    class_weight=class_weights,
    callbacks=[
        early_stopping,
        model_checkpoint,
        reduce_lr
    ]
)

# ----------------------------------------------------
# Save Training Graphs
# ----------------------------------------------------

save_training_plots(history, "CNN")

# ----------------------------------------------------
# Evaluate Model
# ----------------------------------------------------

evaluate_model(model, X_test, y_test)

# ----------------------------------------------------
# Save Model
# ----------------------------------------------------

model.save(BASE_DIR / "trained_models" / "cnn_model.keras")

print("\nCNN model saved successfully!")
