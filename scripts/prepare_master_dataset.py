import os
from pathlib import Path

import pandas as pd
from tqdm import tqdm

# -----------------------------
# File Paths
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_FILE = PROJECT_ROOT / "datasets" / "raw" / "clinvar" / "variant_summary.txt"
OUTPUT_FILE = PROJECT_ROOT / "datasets" / "master" / "master_dataset.csv"

# Create output folder if it doesn't exist
os.makedirs(PROJECT_ROOT / "datasets" / "master", exist_ok=True)

# Diseases we want
TARGET_DISEASES = [
    "Breast",
    "Lung",
    "Alzheimer",
    "Parkinson",
    "Leukemia",
    "Diabetes"
]

chunk_size = 100000

filtered_chunks = []

print("Reading ClinVar dataset...")

for chunk in tqdm(
    pd.read_csv(
        INPUT_FILE,
        sep="\t",
        chunksize=chunk_size,
        low_memory=False
    )
):

    if "PhenotypeList" not in chunk.columns:
        continue

    filtered = chunk[
        chunk["PhenotypeList"].fillna("").str.contains(
            "|".join(TARGET_DISEASES),
            case=False,
            regex=True
        )
    ]

    filtered_chunks.append(filtered)

master = pd.concat(filtered_chunks)

master.to_csv(OUTPUT_FILE, index=False)

print()
print("Master dataset created successfully!")
print("Saved to:", OUTPUT_FILE)
print("Total records:", len(master))