import ast
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parents[2]
INPUT = BASE_DIR / "datasets" / "processed" / "ai_training_tokenized.csv"
DEFAULT_PATHOGENIC_SIGNIFICANCE = (
    "Pathogenic",
    "Likely pathogenic",
    "Pathogenic/Likely pathogenic",
)


def _parse_filter(value):
    if value is None or value == "":
        return None

    if isinstance(value, str):
        if value.lower() in {"pathogenic", "pathogenic_only"}:
            return DEFAULT_PATHOGENIC_SIGNIFICANCE

        return tuple(item.strip() for item in value.split(",") if item.strip())

    return tuple(value)


def _filter_by_clinical_significance(df, clinical_significance_filter):
    allowed_values = _parse_filter(clinical_significance_filter)

    if not allowed_values:
        return df

    if "ClinicalSignificance" not in df.columns:
        print("ClinicalSignificance filter skipped: column not found.")
        return df

    filtered = df[df["ClinicalSignificance"].isin(allowed_values)].copy()

    if filtered.empty:
        raise ValueError(
            "ClinicalSignificance filter removed all records. "
            f"Allowed values: {', '.join(allowed_values)}"
        )

    print("\nClinicalSignificance filter enabled")
    print("=" * 40)
    print(", ".join(allowed_values))
    print(f"Rows before filter: {len(df)}")
    print(f"Rows after filter : {len(filtered)}")

    return filtered


def load_data(clinical_significance_filter=None, return_val=False):
    env_filter = os.getenv("GENOMEAI_CLINICAL_SIGNIFICANCE_FILTER")

    if clinical_significance_filter is None:
        clinical_significance_filter = env_filter

    df = pd.read_csv(INPUT)
    if clinical_significance_filter:
        df = _filter_by_clinical_significance(df, clinical_significance_filter)

    # Convert string representation back to Python lists.
    mutated = np.array(df["MutatedTokens"].apply(ast.literal_eval).tolist(), dtype=np.int32)

    # Use mutated sequence for training.
    X = mutated
    y = df["Label"].values

    if return_val:
        # 70% Train, 15% Validation, 15% Test
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
        )
        print("Training samples   :", len(X_train))
        print("Validation samples :", len(X_val))
        print("Testing samples    :", len(X_test))
        return X_train, X_val, X_test, y_train, y_val, y_test

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training samples :", len(X_train))
    print("Testing samples  :", len(X_test))

    return X_train, X_test, y_train, y_test


def load_full_dataset():
    df = pd.read_csv(INPUT)
    X = np.array(df["MutatedTokens"].apply(ast.literal_eval).tolist(), dtype=np.int32)
    y = df["Label"].values
    return X, y
