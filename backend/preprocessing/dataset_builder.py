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
    "Breast Cancer": 0,
    "Lung Cancer": 1,
    "Alzheimer's Disease": 2,
    "Parkinson's Disease": 3,
    "Leukemia": 4,
    "Type 2 Diabetes": 5,
    "Ovarian Cancer": 6,
    "Colorectal Cancer": 7,
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
    """Load supported GRCh38 SNVs and attach their disease labels."""
    variants = pd.read_csv(INPUT, usecols=INPUT_COLUMNS, low_memory=False).rename(
        columns={
            "PositionVCF": "Start",
            "ReferenceAlleleVCF": "ReferenceAllele",
            "AlternateAlleleVCF": "AlternateAllele",
        }
    )
    disease_map = pd.read_csv(DISEASE_MAP).rename(columns={"Disease": "TargetDisease"})

    variants = variants.merge(
        disease_map,
        left_on="GeneSymbol",
        right_on="Gene",
        how="inner",
    )

    reference = variants["ReferenceAllele"].astype(str).str.upper()
    alternate = variants["AlternateAllele"].astype(str).str.upper()
    is_snv = reference.str.fullmatch("[ACGT]") & alternate.str.fullmatch("[ACGT]")

    return variants.loc[
        (variants["Assembly"] == "GRCh38")
        & variants["TargetDisease"].isin(LABELS)
        & is_snv
    ].copy()


def build_dataset():
    if not GENOME.is_file():
        raise FileNotFoundError(f"Reference genome not found: {GENOME}")
    if not INPUT.is_file():
        raise FileNotFoundError(f"Master dataset not found: {INPUT}")
    if not DISEASE_MAP.is_file():
        raise FileNotFoundError(f"Disease mapping not found: {DISEASE_MAP}")

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
            "Gene": row.GeneSymbol,
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
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    final_df.to_csv(OUTPUT, index=False)
    return final_df


def main():
    final_df = build_dataset()
    print("\nDataset created successfully")
    print(final_df.head())
    print(f"\nTotal samples: {len(final_df)}")
    print(f"Saved to: {OUTPUT}")


if __name__ == "__main__":
    main()
