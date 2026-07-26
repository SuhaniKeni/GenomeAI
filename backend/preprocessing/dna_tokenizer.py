import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

INPUT = PROJECT_ROOT / "datasets" / "processed" / "ai_training_dataset.csv"
OUTPUT = PROJECT_ROOT / "datasets" / "processed" / "ai_training_tokenized.csv"

from backend.utils.tokenizer import TOKEN_MAP


df = pd.read_csv(INPUT)


def tokenize(sequence):
    return [TOKEN_MAP.get(base.upper(), TOKEN_MAP["N"]) for base in str(sequence).strip()]

df["ReferenceTokens"] = df["ReferenceSequence"].apply(tokenize)
df["MutatedTokens"] = df["MutatedSequence"].apply(tokenize)

df.to_csv(OUTPUT, index=False)

print("Tokenization completed!")
print(df[["ReferenceTokens", "MutatedTokens"]].head())