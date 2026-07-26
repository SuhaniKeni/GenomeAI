"""
GenomeAI Duplicate Analysis Tool
--------------------------------
Analyzes duplicate variants in the AI training dataset.

Author: Suhani Keni
Project: GenomeAI
"""

from pathlib import Path
import pandas as pd

DATASET = Path("datasets/processed/ai_training_dataset.csv")
REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(exist_ok=True)


def main():

    print("=" * 70)
    print("GenomeAI Duplicate Analysis")
    print("=" * 70)

    df = pd.read_csv(DATASET)

    # --------------------------------------------------
    # Find duplicated AlleleIDs
    # --------------------------------------------------

    duplicates = df[df.duplicated("AlleleID", keep=False)].copy()

    print(f"\nTotal duplicate rows : {len(duplicates):,}")
    print(f"Unique duplicated Alleles : {duplicates['AlleleID'].nunique():,}")

    # --------------------------------------------------
    # Same allele → multiple diseases
    # --------------------------------------------------

    disease_counts = (
        duplicates.groupby("AlleleID")["Disease"]
        .nunique()
        .reset_index(name="DiseaseCount")
    )

    multi_disease = disease_counts[disease_counts["DiseaseCount"] > 1]

    print(f"\nAlleles linked to multiple diseases : {len(multi_disease):,}")

    # --------------------------------------------------
    # Same allele → multiple genes
    # --------------------------------------------------

    gene_counts = (
        duplicates.groupby("AlleleID")["Gene"]
        .nunique()
        .reset_index(name="GeneCount")
    )

    multi_gene = gene_counts[gene_counts["GeneCount"] > 1]

    print(f"Alleles linked to multiple genes : {len(multi_gene):,}")

    # --------------------------------------------------
    # Which genes create most duplicates?
    # --------------------------------------------------

    print("\nTop genes producing duplicate variants:\n")

    top_genes = duplicates["Gene"].value_counts().head(20)

    print(top_genes)

    # --------------------------------------------------
    # Disease duplication
    # --------------------------------------------------

    print("\nDuplicate disease distribution:\n")

    print(
        duplicates["Disease"]
        .value_counts()
    )

    # --------------------------------------------------
    # Example duplicates
    # --------------------------------------------------

    print("\nExample duplicated variants:\n")

    example_ids = duplicates["AlleleID"].drop_duplicates().head(20)

    example_rows = duplicates[
        duplicates["AlleleID"].isin(example_ids)
    ]

    print(
        example_rows[
            [
                "AlleleID",
                "Gene",
                "Disease",
                "ClinicalSignificance",
            ]
        ]
    )

    # --------------------------------------------------
    # Save reports
    # --------------------------------------------------

    duplicates.to_csv(
        REPORT_DIR / "duplicate_variants.csv",
        index=False
    )

    multi_disease.to_csv(
        REPORT_DIR / "multi_disease_alleles.csv",
        index=False
    )

    multi_gene.to_csv(
        REPORT_DIR / "multi_gene_alleles.csv",
        index=False
    )

    print("\nReports generated:")

    print("✓ duplicate_variants.csv")
    print("✓ multi_disease_alleles.csv")
    print("✓ multi_gene_alleles.csv")

    print("\nAnalysis Complete.")


if __name__ == "__main__":
    main()