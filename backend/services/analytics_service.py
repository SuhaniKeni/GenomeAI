"""Dataset analytics and statistics service.

Provides dataset-level statistics, class distributions, sequence length
distributions, GC content analysis, and training progress data.
"""

from __future__ import annotations

import ast
import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "datasets" / "processed" / "ai_training_dataset.csv"
TOKENISED_PATH = BASE_DIR / "datasets" / "processed" / "ai_training_tokenized.csv"
ANALYTICS_CACHE = BASE_DIR / "trained_models" / ".analytics_cache.json"

DISEASE_LABELS = {
    0: "Healthy",
    1: "Hereditary Breast & Ovarian Cancer",
    2: "Breast Cancer",
    3: "Lung Cancer",
    4: "Alzheimer's Disease",
    5: "Parkinson's Disease",
    6: "Leukemia",
    7: "Type 2 Diabetes",
    8: "Ovarian Cancer",
    9: "Colorectal Cancer",
}


def _safe_literal_eval(val):
    try:
        return ast.literal_eval(val)
    except (ValueError, SyntaxError):
        return []


def compute_dataset_statistics() -> dict:
    """Compute comprehensive dataset statistics."""
    df = pd.read_csv(DATASET_PATH)

    total_samples = len(df)
    disease_counts = df["Disease"].value_counts()
    label_counts = df["Label"].value_counts().sort_index()

    # Class distribution
    class_distribution = {}
    for label, count in label_counts.items():
        disease = DISEASE_LABELS.get(int(label), f"Class {label}")
        class_distribution[disease] = {
            "label": int(label),
            "count": int(count),
            "percentage": round(float(count / total_samples * 100), 2),
        }

    # Sequence length distribution
    lengths = df["MutatedSequence"].astype(str).str.len()
    length_histogram = lengths.value_counts().sort_index().head(20)
    length_stats = {
        "min": int(lengths.min()),
        "max": int(lengths.max()),
        "mean": round(float(lengths.mean()), 2),
        "median": round(float(lengths.median()), 2),
        "std": round(float(lengths.std()), 2),
    }

    # GC Content
    def gc_content(seq):
        seq = str(seq).upper()
        if len(seq) == 0:
            return 0.0
        gc = seq.count("G") + seq.count("C")
        return round(gc / len(seq) * 100, 2)

    gc_values = df["MutatedSequence"].apply(gc_content)
    gc_stats = {
        "mean": round(float(gc_values.mean()), 2),
        "std": round(float(gc_values.std()), 2),
        "min": round(float(gc_values.min()), 2),
        "max": round(float(gc_values.max()), 2),
        "distribution": gc_values.quantile([0.25, 0.5, 0.75]).to_dict(),
    }

    # Nucleotide frequency across dataset
    all_seqs = "".join(df["MutatedSequence"].astype(str).str.upper().tolist())
    total_bases = len(all_seqs) or 1
    nucleotide_freq = {}
    for base in ["A", "T", "G", "C", "N"]:
        count = all_seqs.count(base)
        nucleotide_freq[base] = {
            "count": int(count),
            "percentage": round(count / total_bases * 100, 2),
        }

    # Training / testing split counts
    # Approximate from dataset_builder: default 80/20
    train_samples = int(total_samples * 0.8)
    test_samples = total_samples - train_samples

    # Mutation frequency per disease
    mutation_freq = {}
    for disease in df["Disease"].unique():
        subset = df[df["Disease"] == disease]
        # Count mutations by comparing reference to mutated at middle position
        # Most variants have exactly one SNV in the middle
        mutations_count = len(subset)
        mutation_freq[disease] = mutations_count

    return {
        "dataset_size": total_samples,
        "disease_classes": len(DISEASE_LABELS),
        "training_samples": train_samples,
        "testing_samples": test_samples,
        "class_distribution": class_distribution,
        "sequence_length": {
            "histogram": {str(k): int(v) for k, v in length_histogram.head(20).items()},
            "stats": length_stats,
        },
        "gc_content": gc_stats,
        "nucleotide_frequency": nucleotide_freq,
        "mutation_frequency": mutation_freq,
    }


def get_cached_analytics() -> dict:
    """Return cached analytics or compute fresh."""
    if ANALYTICS_CACHE.exists():
        with open(ANALYTICS_CACHE) as f:
            return json.load(f)

    stats = compute_dataset_statistics()
    ANALYTICS_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with open(ANALYTICS_CACHE, "w") as f:
        json.dump(stats, f, indent=2)
    return stats


def clear_cache():
    if ANALYTICS_CACHE.exists():
        ANALYTICS_CACHE.unlink()
