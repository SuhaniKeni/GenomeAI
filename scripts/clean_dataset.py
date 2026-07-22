import os
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_FILE = PROJECT_ROOT / "datasets" / "master" / "master_dataset.csv"
OUTPUT_FILE = PROJECT_ROOT / "datasets" / "processed" / "clean_dataset.csv"

os.makedirs(PROJECT_ROOT / "datasets" / "processed", exist_ok=True)

print("Loading dataset...")

df = pd.read_csv(INPUT_FILE, low_memory=False)

# Columns needed for AI
columns = [
    "#AlleleID",
    "GeneSymbol",
    "ClinicalSignificance",
    "PhenotypeList",
    "Chromosome",
    "Start",
    "Stop",
    "ReferenceAllele",
    "AlternateAllele",
    "ReviewStatus"
]

df = df[columns]

# Remove rows with unknown gene names
df = df[df["GeneSymbol"] != "-"]

# Remove rows without phenotype
df = df[df["PhenotypeList"] != "-"]

# Remove rows without clinical significance
df = df[df["ClinicalSignificance"] != "-"]

df.to_csv(OUTPUT_FILE, index=False)

print("\nClean dataset created successfully!")
print("Total rows:", len(df))
print("Saved to:", OUTPUT_FILE)