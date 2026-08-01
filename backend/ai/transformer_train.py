from pathlib import Path

import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader
from transformer_dataset import DNADataset
from transformer_utils import (
    train_one_epoch,
    validate_one_epoch,
)
from transformers import (
    AdamW,
    AutoModelForSequenceClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "trained_models"
MODEL_DIR.mkdir(exist_ok=True)

MODEL_NAME = "InstaDeepAI/nucleotide-transformer-v2-50m-multi-species"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Using device: {device}")

# ============================================================
# Load Dataset
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(BASE_DIR / "datasets" / "processed" / "ai_training_dataset.csv")

print(df.head())

# ============================================================
# Load Tokenizer
# ============================================================

print("\nLoading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)

# ============================================================
# Prepare Data
# ============================================================

sequences = df["MutatedSequence"].tolist()
labels = df["Label"].tolist()

X_train, X_test, y_train, y_test = train_test_split(
    sequences, labels, test_size=0.2, random_state=42, stratify=labels
)

train_dataset = DNADataset(X_train, y_train, tokenizer)

test_dataset = DNADataset(X_test, y_test, tokenizer)

train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)

print(f"\nTraining samples : {len(train_dataset)}")
print(f"Testing samples  : {len(test_dataset)}")

# ============================================================
# Load Transformer
# ============================================================

print("\nLoading Transformer Model...")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=8, trust_remote_code=True
)

# ============================================================
# Freeze pretrained transformer layers
# Train only the classification head
# ============================================================

for param in model.base_model.parameters():
    param.requires_grad = False

model.to(device)

print(f"Device : {device}")
print("Transformer loaded successfully!")
optimizer = AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=2e-4)

trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

total_params = sum(p.numel() for p in model.parameters())

print(f"\nTrainable Parameters: {trainable_params:,}")
print(f"Total Parameters    : {total_params:,}")

epochs = 5

total_steps = len(train_loader) * epochs

scheduler = get_linear_schedule_with_warmup(
    optimizer, num_warmup_steps=0, num_training_steps=total_steps
)

best_accuracy = 0

train_losses = []
validation_losses = []

train_accuracies = []
validation_accuracies = []

# ============================================================
# Training
# ============================================================

for epoch in range(epochs):

    print(f"\nEpoch {epoch + 1}/{epochs}")
    print("=" * 60)

    train_loss, train_accuracy = train_one_epoch(
        model=model,
        dataloader=train_loader,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
    )

    validation_loss, validation_accuracy = validate_one_epoch(
        model=model,
        dataloader=test_loader,
        device=device,
    )

    train_losses.append(train_loss)
    validation_losses.append(validation_loss)

    train_accuracies.append(train_accuracy)
    validation_accuracies.append(validation_accuracy)

    print(f"Training Loss      : {train_loss:.4f}")
    print(f"Training Accuracy  : {train_accuracy:.4f}")

    print(f"Validation Loss    : {validation_loss:.4f}")
    print(f"Validation Accuracy: {validation_accuracy:.4f}")

    if validation_accuracy > best_accuracy:

        best_accuracy = validation_accuracy

        torch.save(model.state_dict(), MODEL_DIR / "best_transformer_model.pth")

        print("Best model saved.")

torch.save(model.state_dict(), MODEL_DIR / "transformer_model.pth")

print("\nTransformer training completed successfully!")
