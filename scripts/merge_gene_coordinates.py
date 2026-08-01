from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]

print("=" * 60)
print("MERGING GENE COORDINATES")
print("=" * 60)

print("Loading datasets...")

disease_df = pd.read_csv(
    PROJECT_ROOT / "datasets" / "processed" / "final_disease_dataset.csv", low_memory=False
)

gene_df = pd.read_csv(PROJECT_ROOT / "datasets" / "processed" / "gene_coordinates.csv")

print(f"Disease records : {len(disease_df)}")
print(f"Gene records    : {len(gene_df)}")

# Rename columns in gene table before merging
gene_df = gene_df.rename(
    columns={
        "Chromosome": "GeneChromosome",
        "Start": "GeneStart",
        "End": "GeneEnd",
        "Strand": "GeneStrand",
    }
)

merged_df = disease_df.merge(gene_df, on="GeneSymbol", how="left")

print("\nMissing Gene Coordinates:")
print(merged_df["GeneChromosome"].isna().sum())

output = PROJECT_ROOT / "datasets" / "processed" / "final_dataset_with_coordinates.csv"

merged_df.to_csv(output, index=False)

print("\nMerge completed successfully!")

print(f"Total rows : {len(merged_df)}")
print(f"Saved to   : {output}")

print("\nFirst five rows:")

print(merged_df[["GeneSymbol", "TargetDisease", "GeneChromosome", "GeneStart", "GeneEnd"]].head())
