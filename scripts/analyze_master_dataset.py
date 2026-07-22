from pathlib import Path

import pandas as pd

# Load dataset
PROJECT_ROOT = Path(__file__).resolve().parents[1]
df = pd.read_csv(PROJECT_ROOT / "datasets" / "master" / "master_dataset.csv", low_memory=False)

print("=" * 60)
print("MASTER DATASET ANALYSIS")
print("=" * 60)

print("\nDataset Shape:")
print(df.shape)

print("\nColumns:")
for col in df.columns:
    print("-", col)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

print("\nFirst Five Rows:")
print(df.head())

print("\nClinical Significance:")
if "ClinicalSignificance" in df.columns:
    print(df["ClinicalSignificance"].value_counts().head(20))

print("\nGene Symbols:")
if "GeneSymbol" in df.columns:
    print(df["GeneSymbol"].value_counts().head(20))

print("\nDone!")