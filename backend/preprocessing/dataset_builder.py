from pathlib import Path

import pandas as pd
from tqdm import tqdm

try:
    from .mutation_engine import MutationEngine
    from .sequence_extractor import SequenceExtractor
except ImportError:  # Allow this file to be run directly.
    from mutation_engine import MutationEngine
    from sequence_extractor import SequenceExtractor


PROJECT_ROOT = Path(__file__).resolve().parents[2]
GENOME = PROJECT_ROOT / (
    "datasets/raw/ncbi/ncbi_dataset/ncbi_dataset/data/"
    "GCF_000001405.40/GCF_000001405.40_GRCh38.p14_genomic.fna"
)
INPUT = PROJECT_ROOT / "datasets/master/master_dataset.csv"
DISEASE_MAP = PROJECT_ROOT / "datasets/labels/disease_gene_mapping.csv"
OUTPUT = PROJECT_ROOT / "datasets/processed/ai_training_dataset.csv"

LABELS = {
    "Healthy": 0,
    "Hereditary Breast & Ovarian Cancer": 1,
    "Breast Cancer": 2,
    "Lung Cancer": 3,
    "Alzheimer's Disease": 4,
    "Parkinson's Disease": 5,
    "Leukemia": 6,
    "Type 2 Diabetes": 7,
    "Ovarian Cancer": 8,
    "Colorectal Cancer": 9,
}

INPUT_COLUMNS = [
    "#AlleleID",
    "Assembly",
    "GeneSymbol",
    "ClinicalSignificance",
    "Chromosome",
    "PositionVCF",
    "ReferenceAlleleVCF",
    "AlternateAlleleVCF",
]


def load_variants():
    """Load supported GRCh38 SNVs for Healthy (Benign) and Disease (Pathogenic) targets."""
    df = pd.read_csv(INPUT, usecols=INPUT_COLUMNS, low_memory=False).rename(
        columns={
            "PositionVCF": "Start",
            "ReferenceAlleleVCF": "ReferenceAllele",
            "AlternateAlleleVCF": "AlternateAllele",
        }
    )

    # Clean strings
    df["ClinicalSignificance"] = df["ClinicalSignificance"].fillna("").astype(str)

    # Basic filtering: GRCh38 and single-nucleotide variant (SNV)
    reference = df["ReferenceAllele"].astype(str).str.upper()
    alternate = df["AlternateAllele"].astype(str).str.upper()
    is_snv = reference.str.fullmatch("[ACGT]") & alternate.str.fullmatch("[ACGT]")
    grch38 = df["Assembly"] == "GRCh38"

    df_clean = df.loc[grch38 & is_snv].copy()

    # 1. Pathogenic / Likely Pathogenic (Disease Mapped)
    disease_map = pd.read_csv(DISEASE_MAP).rename(columns={"Disease": "TargetDisease"})
    pathogenic_mask = df_clean["ClinicalSignificance"].str.lower().str.contains("pathogenic") & (
        ~df_clean["ClinicalSignificance"].str.lower().str.contains("benign")
    )

    pathogenic_df = df_clean.loc[pathogenic_mask].merge(
        disease_map,
        left_on="GeneSymbol",
        right_on="Gene",
        how="inner",
    )
    pathogenic_df = pathogenic_df.loc[pathogenic_df["TargetDisease"].isin(LABELS)].copy()

    # 2. Benign / Likely Benign (Healthy Mapped)
    benign_mask = df_clean["ClinicalSignificance"].str.lower().str.contains("benign") & (
        ~df_clean["ClinicalSignificance"].str.lower().str.contains("pathogenic")
    )
    benign_df = df_clean.loc[benign_mask].copy()

    benign_df["Gene"] = benign_df["GeneSymbol"]
    benign_df["TargetDisease"] = "Healthy"

    # Sample benign variants to match average class size (approx 3,000 - 5,000 samples)
    if len(benign_df) > 5000:
        benign_df = benign_df.sample(n=5000, random_state=42)

    # Combine both datasets
    combined = pd.concat([pathogenic_df, benign_df], ignore_index=True)
    return combined


def build_dataset():
    if not GENOME.is_file():
        raise FileNotFoundError(f"Reference genome not found: {GENOME}")
    if not INPUT.is_file():
        raise FileNotFoundError(f"Master dataset not found: {INPUT}")

    extractor = SequenceExtractor(GENOME)
    variants = load_variants()
    rows = []

    for row in tqdm(variants.itertuples(index=False), total=len(variants)):
        sequence = extractor.extract(row.Chromosome, row.Start)
        mutated = MutationEngine.apply_mutation(
            sequence,
            str(row.ReferenceAllele),
            str(row.AlternateAllele),
        )

        if mutated is None:
            continue

        rows.append({
            "AlleleID": row._0,
            "Gene": row.Gene,
            "Disease": row.TargetDisease,
            "Label": LABELS[row.TargetDisease],
            "Chromosome": row.Chromosome,
            "Position": row.Start,
            "ReferenceSequence": sequence,
            "MutatedSequence": mutated,
            "ReferenceAllele": row.ReferenceAllele,
            "AlternateAllele": row.AlternateAllele,
            "ClinicalSignificance": row.ClinicalSignificance,
        })

    final_df = pd.DataFrame(rows)

    # CRITICAL: Deduplicate by MutatedSequence to ensure EVERY sequence has EXACTLY ONE label
    final_df = final_df.drop_duplicates(subset=["MutatedSequence"], keep="first").reset_index(drop=True)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    final_df.to_csv(OUTPUT, index=False)
    return final_df



def main():
    final_df = build_dataset()
    print("\nDataset created successfully!")
    print(f"Total samples: {len(final_df)}")
    print("\nDistribution of every class:")
    print(final_df["Disease"].value_counts())
    print(f"\nSaved to: {OUTPUT}")


if __name__ == "__main__":
    main()

