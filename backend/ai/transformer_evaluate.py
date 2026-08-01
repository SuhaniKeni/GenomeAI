from pathlib import Path

import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader
from transformer_dataset import DNADataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_PATH = BASE_DIR / "datasets" / "processed" / "ai_training_dataset.csv"

MODEL_DIR = BASE_DIR / "trained_models"

MODEL_PATH = MODEL_DIR / "best_transformer_model.pth"

MODEL_NAME = "InstaDeepAI/nucleotide-transformer-v2-50m-multi-species"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Using device: {device}")


# ============================================================
# Check Files
# ============================================================

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset not found:\n{DATASET_PATH}")

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found:\n{MODEL_PATH}")


# ============================================================
# Load Dataset
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

sequences = df["MutatedSequence"].tolist()
labels = df["Label"].tolist()

_, X_test, _, y_test = train_test_split(
    sequences,
    labels,
    test_size=0.2,
    random_state=42,
    stratify=labels,
)


# ============================================================
# Tokenizer
# ============================================================

print("Loading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)


# ============================================================
# Test Dataset
# ============================================================

test_dataset = DNADataset(X_test, y_test, tokenizer)

test_loader = DataLoader(
    test_dataset,
    batch_size=16,
    shuffle=False,
)


# ============================================================
# Load Model
# ============================================================

print("Loading trained Transformer model...")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=8,
    trust_remote_code=True,
)

model.load_state_dict(
    torch.load(
        MODEL_PATH,
        map_location=device,
    )
)

model.to(device)
model.eval()

print("Model loaded successfully!")


# ============================================================
# Evaluation
# ============================================================

predictions = []
targets = []

print("\nEvaluating...")

with torch.no_grad():

    for batch in test_loader:

        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)

        labels = batch["labels"]

        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )

        preds = torch.argmax(outputs.logits, dim=1)

        predictions.extend(preds.cpu().numpy())
        targets.extend(labels.numpy())


# ============================================================
# Results
# ============================================================

print("\n" + "=" * 60)
print("TRANSFORMER EVALUATION")
print("=" * 60)

accuracy = accuracy_score(targets, predictions)
precision = precision_score(
    targets,
    predictions,
    average="weighted",
    zero_division=0,
)
recall = recall_score(
    targets,
    predictions,
    average="weighted",
    zero_division=0,
)
f1 = f1_score(
    targets,
    predictions,
    average="weighted",
    zero_division=0,
)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nClassification Report")
print(classification_report(targets, predictions, zero_division=0))

print("\nConfusion Matrix")
print(confusion_matrix(targets, predictions))
