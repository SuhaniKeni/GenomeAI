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
    Reshape,
    Multiply,
)
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)
from tensorflow.keras.optimizers import Adam
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score

from data_loader import load_data, load_full_dataset
from class_weights import get_class_weights

os.makedirs(BASE_DIR / "trained_models", exist_ok=True)


def build_se_rescnn_model(input_length=201, num_classes=10, embed_dim=64):
    """Build a Multi-Scale Parallel SE-ResCNN model architecture."""
    inputs = Input(shape=(input_length,), name="dna_input")

    # 1. Nucleotide Embedding (input_dim=5 -> output_dim=64)
    x = Embedding(input_dim=5, output_dim=embed_dim, name="dna_embedding")(inputs)

    # 2. Multi-Scale Parallel Motif Convolutions (Kernels: 3, 5, 7, 11)
    conv3 = Conv1D(64, kernel_size=3, padding="same", kernel_initializer="he_normal")(x)
    conv5 = Conv1D(64, kernel_size=5, padding="same", kernel_initializer="he_normal")(x)
    conv7 = Conv1D(64, kernel_size=7, padding="same", kernel_initializer="he_normal")(x)
    conv11 = Conv1D(64, kernel_size=11, padding="same", kernel_initializer="he_normal")(x)

    x_multi = Concatenate()([conv3, conv5, conv7, conv11])
    x_multi = BatchNormalization()(x_multi)
    x_multi = Activation("swish")(x_multi)
    x_multi = MaxPooling1D(pool_size=2)(x_multi)
    x_multi = Dropout(0.25)(x_multi)

    # 3. Residual Squeeze-and-Excitation (SE) Block 1 (256 channels)
    res1 = Conv1D(256, kernel_size=1, padding="same")(x_multi)

    se1 = Conv1D(256, kernel_size=5, padding="same", kernel_initializer="he_normal")(x_multi)
    se1 = BatchNormalization()(se1)
    se1 = Activation("swish")(se1)
    se1 = Conv1D(256, kernel_size=5, padding="same", kernel_initializer="he_normal")(se1)
    se1 = BatchNormalization()(se1)

    # Squeeze-and-Excitation Channel Attention
    squeeze1 = GlobalAveragePooling1D()(se1)
    excitation1 = Dense(32, activation="relu")(squeeze1)
    excitation1 = Dense(256, activation="sigmoid")(excitation1)
    excitation1 = Reshape((1, 256))(excitation1)
    se1_atten = Multiply()([se1, excitation1])

    x = Add()([res1, se1_atten])
    x = Activation("swish")(x)
    x = MaxPooling1D(pool_size=2)(x)
    x = Dropout(0.30)(x)

    # 4. Residual Convolutional Block 2 (512 channels)
    res2 = Conv1D(512, kernel_size=1, padding="same")(x)

    c2 = Conv1D(512, kernel_size=3, padding="same", kernel_initializer="he_normal")(x)
    c2 = BatchNormalization()(c2)
    c2 = Activation("swish")(c2)

    x = Add()([res2, c2])
    x = Activation("swish")(x)

    # 5. Dual Global Pooling (Global Max + Global Average)
    g_max = GlobalMaxPooling1D()(x)
    g_avg = GlobalAveragePooling1D()(x)
    x_pool = Concatenate()([g_max, g_avg])

    # 6. Regularized Dense Classification Head
    x_head = Dense(256, kernel_regularizer=tf.keras.regularizers.l2(1e-4), kernel_initializer="he_normal")(x_pool)
    x_head = BatchNormalization()(x_head)
    x_head = Activation("swish")(x_head)
    x_head = Dropout(0.35)(x_head)

    x_head = Dense(128, kernel_regularizer=tf.keras.regularizers.l2(1e-4), kernel_initializer="he_normal")(x_head)
    x_head = BatchNormalization()(x_head)
    x_head = Activation("swish")(x_head)
    x_head = Dropout(0.25)(x_head)

    outputs = Dense(num_classes, activation="softmax", name="disease_prediction")(x_head)

    model = Model(inputs=inputs, outputs=outputs, name="GenomeAI_Optimized_SE_ResCNN")

    optimizer = Adam(learning_rate=1e-3, clipnorm=1.0)
    model.compile(
        optimizer=optimizer,
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model


def train_and_evaluate_model():

    # Fix Random Seeds for Reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)

    print("=" * 60)
    print("GENOMEAI MULTI-SCALE SE-RESCNN MODEL TRAINING")
    print("=" * 60)

    # Load dataset split
    X_train, X_val, X_test, y_train, y_val, y_test = load_data(return_val=True)
    class_weights = get_class_weights(y_train)

    num_classes = 10

    # One-hot encode targets
    y_train_cat = to_categorical(y_train, num_classes=num_classes)
    y_val_cat = to_categorical(y_val, num_classes=num_classes)
    y_test_cat = to_categorical(y_test, num_classes=num_classes)

    best_model_path = BASE_DIR / "trained_models" / "best_cnn_model.keras"
    final_model_path = BASE_DIR / "trained_models" / "cnn_model.keras"

    # Build Model
    model = build_se_rescnn_model(input_length=X_train.shape[1], num_classes=num_classes)
    model.summary()

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=8,
            restore_best_weights=True,
            verbose=1,
        ),
        ModelCheckpoint(
            best_model_path,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    print("\nTraining Multi-Scale SE-ResCNN Model...")
    history = model.fit(
        X_train,
        y_train_cat,
        validation_data=(X_val, y_val_cat),
        epochs=40,
        batch_size=128,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    print("\nLoading Best Model Checkpoint...")
    best_model = tf.keras.models.load_model(best_model_path)
    best_model.save(final_model_path)

    # Evaluate on test set
    y_pred_probs = best_model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")

    print("\n" + "=" * 60)
    print("HOLDOUT TEST SET PERFORMANCE REPORT")
    print("=" * 60)
    print(f"Test Accuracy  : {acc:.4f} ({acc*100:.2f}%)")
    print(f"Test Macro F1  : {macro_f1:.4f}")
    print(f"Test Weighted F1: {weighted_f1:.4f}")
    print("=" * 60)

    print(f"\nModel saved cleanly to:\n  - {best_model_path}\n  - {final_model_path}")

    return best_model, acc, macro_f1, weighted_f1


if __name__ == "__main__":
    train_and_evaluate_model()
