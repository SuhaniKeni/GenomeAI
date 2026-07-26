"""
GenomeAI Dataset Quality Analyzer
---------------------------------
Analyzes the AI training dataset before model training.

Author: Suhani Keni
Project: GenomeAI
"""

from pathlib import Path
import json
import logging
import re

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "datasets" / "processed" / "ai_training_dataset.csv"
REPORT_DIR = BASE_DIR / "reports"

REPORT_DIR.mkdir(exist_ok=True)


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(message)s"
)


# ==========================================================
# Helpers
# ==========================================================

VALID_BASES = set("ACGTN")


def load_dataset():
    logging.info("Loading dataset...")

    df = pd.read_csv(DATASET_PATH)

    logging.info(f"Loaded {len(df):,} rows.")

    return df


# ==========================================================
# Dataset Summary
# ==========================================================

def dataset_summary(df):

    return {
        "Rows": len(df),
        "Columns": len(df.columns),
        "Unique Alleles": df["AlleleID"].nunique(),
        "Unique Genes": df["Gene"].nunique(),
        "Unique Diseases": df["Disease"].nunique(),
    }


# ==========================================================
# Missing Values
# ==========================================================

def missing_values(df):

    missing = df.isnull().sum()

    return missing[missing > 0].to_dict()


# ==========================================================
# Duplicate Analysis
# ==========================================================

def duplicate_analysis(df):

    return {
        "Duplicate AlleleID":
            int(df["AlleleID"].duplicated().sum()),

        "Duplicate ReferenceSequence":
            int(df["ReferenceSequence"].duplicated().sum()),

        "Duplicate MutatedSequence":
            int(df["MutatedSequence"].duplicated().sum()),
    }


# ==========================================================
# Disease Distribution
# ==========================================================

def disease_distribution(df):

    counts = df["Disease"].value_counts()

    return counts.to_dict()


# ==========================================================
# Clinical Significance
# ==========================================================

def clinical_distribution(df):

    return df["ClinicalSignificance"].value_counts().to_dict()


# ==========================================================
# Gene Statistics
# ==========================================================

def gene_statistics(df):

    return df["Gene"].value_counts().head(20).to_dict()


# ==========================================================
# Sequence Validation
# ==========================================================

def validate_sequences(df):

    invalid_reference = 0
    invalid_mutated = 0

    ref_lengths = []
    mut_lengths = []

    for ref, mut in zip(df["ReferenceSequence"],
                        df["MutatedSequence"]):

        ref = str(ref).upper()
        mut = str(mut).upper()

        ref_lengths.append(len(ref))
        mut_lengths.append(len(mut))

        if not set(ref).issubset(VALID_BASES):
            invalid_reference += 1

        if not set(mut).issubset(VALID_BASES):
            invalid_mutated += 1

    return {

        "Invalid Reference Sequences":
            invalid_reference,

        "Invalid Mutated Sequences":
            invalid_mutated,

        "Reference Length Min":
            min(ref_lengths),

        "Reference Length Max":
            max(ref_lengths),

        "Mutated Length Min":
            min(mut_lengths),

        "Mutated Length Max":
            max(mut_lengths),
    }


# ==========================================================
# Mutation Validation
# ==========================================================

def mutation_validation(df):

    no_change = (
        df["ReferenceAllele"] ==
        df["AlternateAllele"]
    ).sum()

    invalid_position = (df["Position"] <= 0).sum()

    return {

        "No-change mutations": int(no_change),

        "Invalid Positions": int(invalid_position)
    }


# ==========================================================
# Class Imbalance
# ==========================================================

def imbalance(df):

    counts = df["Disease"].value_counts()

    ratio = counts.max() / counts.min()

    return {

        "Largest Class":
            int(counts.max()),

        "Smallest Class":
            int(counts.min()),

        "Imbalance Ratio":
            round(ratio, 2)
    }


# ==========================================================
# Dataset Quality Score
# ==========================================================

def quality_score(results):

    score = 100

    dup = results["Duplicates"]["Duplicate AlleleID"]

    if dup > 0:
        score -= 10

    invalid = (
        results["Sequences"]["Invalid Reference Sequences"] +
        results["Sequences"]["Invalid Mutated Sequences"]
    )

    if invalid > 0:
        score -= 20

    imbalance = results["Class Imbalance"]["Imbalance Ratio"]

    if imbalance > 20:
        score -= 15

    no_change = results["Mutation Validation"]["No-change mutations"]

    if no_change > 0:
        score -= 5

    return max(score, 0)


# ==========================================================
# Save Reports
# ==========================================================

def save_reports(results):

    json_path = REPORT_DIR / "dataset_report.json"

    with open(json_path, "w") as f:
        json.dump(results, f, indent=4)

    txt_path = REPORT_DIR / "dataset_report.txt"

    with open(txt_path, "w") as f:

        for section, value in results.items():

            f.write("=" * 60 + "\n")
            f.write(section + "\n")
            f.write("=" * 60 + "\n")

            if isinstance(value, dict):

                for k, v in value.items():
                    f.write(f"{k:<35}: {v}\n")

            else:
                f.write(str(value))

            f.write("\n\n")

    logging.info("Reports saved.")


# ==========================================================
# Main
# ==========================================================

def main():

    df = load_dataset()

    results = {}

    results["Summary"] = dataset_summary(df)

    results["Missing Values"] = missing_values(df)

    results["Duplicates"] = duplicate_analysis(df)

    results["Disease Distribution"] = disease_distribution(df)

    results["Clinical Significance"] = clinical_distribution(df)

    results["Gene Statistics"] = gene_statistics(df)

    results["Sequences"] = validate_sequences(df)

    results["Mutation Validation"] = mutation_validation(df)

    results["Class Imbalance"] = imbalance(df)

    results["Dataset Quality Score"] = quality_score(results)

    save_reports(results)

    print("\n")
    print("=" * 60)
    print("GenomeAI Dataset Quality Report")
    print("=" * 60)

    for section, value in results.items():

        print(f"\n{section}")

        if isinstance(value, dict):

            for k, v in value.items():
                print(f"  {k:<35}: {v}")

        else:
            print(value)


if __name__ == "__main__":
    main()