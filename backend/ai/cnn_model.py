import os
import sys
from pathlib import Path
import numpy as np
import tensorflow as tf


BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input,
    Embedding,
    Conv1D,
    BatchNormalization,
    MaxPooling1D,
    GlobalMaxPooling1D,
    GlobalAveragePooling1D,
    Concatenate,
    Dense,
    Dropout,
    Add,
    Activation,
)
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)
from tensorflow.keras.optimizers import Adam

from data_loader import load_data
from evaluate import evaluate_model
from metrics import save_training_plots
from class_weights import get_class_weights

os.makedirs(BASE_DIR / "trained_models", exist_ok=True)

# ----------------------------------------------------
# 1. Load Dataset (Stratified 3-Way Split)
# ----------------------------------------------------
X_train, X_val, X_test, y_train, y_val, y_test = load_data(return_val=True)

# Calculate class weights BEFORE one-hot encoding
class_weights = get_class_weights(y_train)

# Calculate num_classes dynamically
num_classes = len(np.unique(np.concatenate([y_train, y_val, y_test])))

# One-hot encode labels
y_train = to_categorical(y_train, num_classes=num_classes)
y_val = to_categorical(y_val, num_classes=num_classes)
y_test = to_categorical(y_test, num_classes=num_classes)

# ----------------------------------------------------
# 2. Build Multi-Scale Residual 1D-CNN Model
# ----------------------------------------------------
inputs = Input(shape=(X_train.shape[1],), name="dna_input")

# Richer embedding representation (32 dimensions)
x = Embedding(input_dim=5, output_dim=32, name="dna_embedding")(inputs)

# Block 1: Broad motif extraction (kernel=7)
x = Conv1D(64, kernel_size=7, padding="same", kernel_initializer="he_normal")(x)
x = BatchNormalization()(x)
x = Activation("swish")(x)
x = MaxPooling1D(pool_size=2)(x)
x = Dropout(0.25)(x)

# Block 2: Medium motif extraction with Residual Connection (kernel=5)
res_2 = Conv1D(128, kernel_size=1, padding="same")(x)
x2 = Conv1D(128, kernel_size=5, padding="same", kernel_initializer="he_normal")(x)
x2 = BatchNormalization()(x2)
x2 = Activation("swish")(x2)
x2 = Conv1D(128, kernel_size=5, padding="same", kernel_initializer="he_normal")(x2)
x2 = BatchNormalization()(x2)
x = Add()([res_2, x2])
x = Activation("swish")(x)
x = MaxPooling1D(pool_size=2)(x)
x = Dropout(0.30)(x)

# Block 3: Fine-grained motif extraction (kernel=3)
x = Conv1D(256, kernel_size=3, padding="same", kernel_initializer="he_normal")(x)
x = BatchNormalization()(x)
x = Activation("swish")(x)

# Dual Global Pooling: Max (peaks) + Avg (composition)
g_max = GlobalMaxPooling1D()(x)
g_avg = GlobalAveragePooling1D()(x)
x = Concatenate()([g_max, g_avg])

# Dense Classifier Head
x = Dense(256, kernel_regularizer=tf.keras.regularizers.l2(1e-4), kernel_initializer="he_normal")(x)
x = BatchNormalization()(x)
x = Activation("swish")(x)
x = Dropout(0.40)(x)

x = Dense(128, kernel_regularizer=tf.keras.regularizers.l2(1e-4), kernel_initializer="he_normal")(x)
x = BatchNormalization()(x)
x = Activation("swish")(x)
x = Dropout(0.30)(x)

outputs = Dense(num_classes, activation="softmax", name="disease_prediction")(x)


model = Model(inputs=inputs, outputs=outputs, name="GenomeAI_Optimized_1DCNN")

optimizer = Adam(learning_rate=1e-3, clipnorm=1.0)

model.compile(
    optimizer=optimizer,
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ----------------------------------------------------
# 3. Callbacks
# ----------------------------------------------------
early_stopping = EarlyStopping(
    monitor="val_accuracy",
    patience=8,
    restore_best_weights=True,
    verbose=1
)

best_model_path = BASE_DIR / "trained_models" / "best_cnn_model.keras"
model_checkpoint = ModelCheckpoint(
    best_model_path,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

# ----------------------------------------------------
# 4. Train Model
# ----------------------------------------------------
history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=40,
    batch_size=128,
    class_weight=class_weights,
    callbacks=[
        early_stopping,
        model_checkpoint,
        reduce_lr
    ]
)

# ----------------------------------------------------
# 5. Save Training Plots & Evaluate
# ----------------------------------------------------
save_training_plots(history, "CNN")

print("\nEvaluating Best Model on Holdout Test Set...")
evaluate_model(model, X_test, y_test)

# Save final copy to cnn_model.keras
final_model_path = BASE_DIR / "trained_models" / "cnn_model.keras"
model.save(final_model_path)
print(f"\nOptimized CNN model saved to {best_model_path} and {final_model_path}")

