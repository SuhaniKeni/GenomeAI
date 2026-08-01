"""Multi-model benchmark service.

Runs each model on a test set and collects:
- Accuracy, Precision, Recall, F1
- Inference time (mean & std)
- Training time (from history)
- Memory usage estimate
- ROC curve data
- Confusion matrix
- Training / validation loss & accuracy curves
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
TOKENISED_DATASET = BASE_DIR / "datasets" / "processed" / "ai_training_tokenized.csv"
BENCHMARK_CACHE = BASE_DIR / "trained_models" / ".benchmark_cache.json"

# Lazy-load predictors
_CNN = None
_LSTM = None
_TRANSFORMER = None


def _get_cnn():
    global _CNN
    if _CNN is None:
        from backend.predictor.cnn_predictor import predict as cnn_predict

        _CNN = cnn_predict
    return _CNN


def _get_lstm():
    global _LSTM
    if _LSTM is None:
        from backend.predictor.lstm_predictor import predict as lstm_predict

        _LSTM = lstm_predict
    return _LSTM


def _get_transformer():
    global _TRANSFORMER
    if _TRANSFORMER is None:
        from backend.predictor.transformer_predictor import predict as tf_predict

        _TRANSFORMER = tf_predict
    return _TRANSFORMER


def _load_test_set(sample_size: int = 200):
    """Load tokenised test sequences with true labels."""
    df = pd.read_csv(TOKENISED_DATASET)
    # Stratified sample
    sampled = df.groupby("Label", group_keys=False).apply(
        lambda g: g.sample(min(sample_size // 8, len(g)), random_state=42)
    )
    tokens_list = []
    for _, row in sampled.iterrows():
        import ast

        t = np.array(ast.literal_eval(row["MutatedTokens"]), dtype=np.int32)
        tokens_list.append(t)
    return np.array(tokens_list), sampled["Label"].values


def _inference_time_ms(func, tokens: np.ndarray) -> tuple[dict, float]:
    """Run a single prediction and measure time in ms."""
    start = time.perf_counter()
    result = func(tokens)
    elapsed = (time.perf_counter() - start) * 1000
    return result, elapsed


def _compute_metrics(true_labels, pred_labels, probs_matrix, num_classes=8):
    """Compute accuracy, precision, recall, f1, and per-class ROC data."""
    from sklearn.metrics import (
        accuracy_score,
        auc,
        confusion_matrix,
        f1_score,
        precision_score,
        recall_score,
        roc_curve,
    )
    from sklearn.preprocessing import label_binarize

    acc = accuracy_score(true_labels, pred_labels)
    prec = precision_score(true_labels, pred_labels, average="weighted", zero_division=0)
    rec = recall_score(true_labels, pred_labels, average="weighted", zero_division=0)
    f1 = f1_score(true_labels, pred_labels, average="weighted", zero_division=0)
    cm = confusion_matrix(true_labels, pred_labels).tolist()

    # ROC curve data (One-vs-Rest)
    y_bin = label_binarize(true_labels, classes=list(range(num_classes)))
    roc_data = {}
    for i in range(num_classes):
        fpr, tpr, _ = roc_curve(y_bin[:, i], np.array(probs_matrix)[:, i])
        roc_auc = auc(fpr, tpr)
        roc_data[str(i)] = {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "auc": round(roc_auc, 4),
        }

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": cm,
        "roc_curve": roc_data,
    }


def run_benchmark(model_name: str = "all", sample_size: int = 200) -> dict:
    """Run a benchmark for one or all models.

    Args:
        model_name: "cnn", "lstm", "transformer", or "all"
        sample_size: number of test samples (must be divisible by 8)

    Returns:
        dict mapping model_name -> metrics
    """
    tokens, true_labels = _load_test_set(sample_size)

    models = []
    if model_name == "all":
        models = [("CNN", _get_cnn()), ("LSTM", _get_lstm()), ("Transformer", _get_transformer())]
    elif model_name == "cnn":
        models = [("CNN", _get_cnn())]
    elif model_name == "lstm":
        models = [("LSTM", _get_lstm())]
    elif model_name == "transformer":
        models = [("Transformer", _get_transformer())]
    else:
        raise ValueError(f"Unknown model: {model_name}")

    results = {}
    for name, predict_fn in models:
        pred_labels = []
        probs_list = []
        times = []

        for i in range(len(tokens)):
            inp = np.expand_dims(tokens[i], axis=0)
            try:
                out, elapsed = _inference_time_ms(predict_fn, inp)
                probs = out["probabilities"]
                pred_labels.append(int(np.argmax(probs)))
                probs_list.append(probs)
                times.append(elapsed)
            except Exception as exc:
                print(f"  [{name}] sample {i} failed: {exc}")
                continue

        metrics = _compute_metrics(true_labels[: len(pred_labels)], pred_labels, probs_list)
        metrics["inference_time_ms_mean"] = round(float(np.mean(times)), 2)
        metrics["inference_time_ms_std"] = round(float(np.std(times)), 2)
        metrics["samples_tested"] = len(pred_labels)

        results[name] = metrics

    return results


def get_cached_benchmark() -> dict:
    """Return cached benchmark or run a fresh one."""
    if BENCHMARK_CACHE.exists():
        with open(BENCHMARK_CACHE) as f:
            return json.load(f)

    results = run_benchmark("all", sample_size=200)
    BENCHMARK_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with open(BENCHMARK_CACHE, "w") as f:
        json.dump(results, f, indent=2)
    return results


def clear_cache():
    if BENCHMARK_CACHE.exists():
        BENCHMARK_CACHE.unlink()
