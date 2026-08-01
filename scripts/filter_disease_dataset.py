import os
from pathlib import Path

import pandas as pd

# Files
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATASET = PROJECT_ROOT / "datasets" / "processed" / "clean_dataset.csv"
GENE_MAP = PROJECT_ROOT / "datasets" / "labels" / "disease_gene_mapping.csv"
OUTPUT = PROJECT_ROOT / "datasets" / "processed" / "final_disease_dataset.csv"

print("Loading datasets...")

df = pd.read_csv(DATASET, low_memory=False)
gene_map = pd.read_csv(GENE_MAP)

# Keep only our selected genes
selected_genes = gene_map["Gene"].unique()

filtered = df[df["GeneSymbol"].isin(selected_genes)].copy()

# Map gene → disease
gene_to_disease = dict(zip(gene_map["Gene"], gene_map["Disease"]))
filtered["TargetDisease"] = filtered["GeneSymbol"].map(gene_to_disease)

os.makedirs(PROJECT_ROOT / "datasets" / "processed", exist_ok=True)
filtered.to_csv(OUTPUT, index=False)

print("\nDone!")
print("Rows:", len(filtered))
print("Saved:", OUTPUT)

print("\nDisease Distribution:")
print(filtered["TargetDisease"].value_counts())
