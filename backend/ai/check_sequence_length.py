from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]

df = pd.read_csv(BASE_DIR / "datasets" / "processed" / "ai_training_dataset.csv")

lengths = df["MutatedSequence"].astype(str).str.len()

print("Minimum :", lengths.min())
print("Maximum :", lengths.max())
print("Average :", lengths.mean())
print("Median  :", lengths.median())
