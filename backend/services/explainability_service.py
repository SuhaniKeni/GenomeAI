"""SHAP-based explainability for DNA disease predictions.

Uses a simplified integrated-gradients approach that works with TensorFlow
and PyTorch models to identify influential nucleotide positions.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "trained_models"

# Nucleotide colour map (for visualisation)
NUCLEOTIDE_COLOURS = {
    "A": "#22c55e",  # Green
    "T": "#ef4444",  # Red
    "G": "#3b82f6",  # Blue
    "C": "#eab308",  # Yellow
    "N": "#94a3b8",  # Gray
}

TOKEN_MAP = {"A": 0, "T": 1, "G": 2, "C": 3, "N": 4}
REV_MAP = {0: "A", 1: "T", 2: "G", 3: "C", 4: "N"}


def _token_to_base(tok: int) -> str:
    return REV_MAP.get(tok, "N")


def _predict_proba_cnn(tokens_batch: np.ndarray) -> np.ndarray:
    """Wrapper so we can call the CNN predictor on a batch."""
    from backend.predictor.cnn_predictor import get_model

    model = get_model()
    return model.predict(tokens_batch, verbose=0)


def _predict_proba_transformer(tokens_batch: np.ndarray) -> np.ndarray:
    """Wrapper for Transformer batch inference."""
    from backend.predictor.transformer_predictor import _tokens_to_string, load_resources

    model, tokenizer = load_resources()
    import torch

    device = next(model.parameters()).device
    dna_strings = [_tokens_to_string(tokens_batch[i]) for i in range(len(tokens_batch))]

    inputs = tokenizer(
        dna_strings,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=256,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        logits = model(**inputs).logits

    probs = torch.softmax(logits, dim=-1).cpu().numpy()
    return probs


def compute_shap_values(
    tokens: np.ndarray,
    model_type: str = "cnn",
    num_perturbations: int = 200,
    baseline: int | None = None,
) -> dict:
    """Compute feature importance using a perturbation-based method
    (approximating SHAP via mean absolute effect of masking each position).

    Args:
        tokens: shape (1, 201) int32 array
        model_type: "cnn" or "transformer"
        num_perturbations: random masking iterations
        baseline: token to use for masking (default: N=4)

    Returns:
        dict with:
          - shap_values: list of importance scores (one per position)
          - top_indices: list of (start, end, score) for influential regions
          - nucleotides: list of base letters at each position
          - contribution_percentages: top positions with % contribution
    """
    if baseline is None:
        baseline = TOKEN_MAP["N"]

    seq_len = tokens.shape[1]
    base_seq = tokens.copy()
    original_probs = _predict_proba_tc(base_seq, model_type)
    predicted_class = int(np.argmax(original_probs[0]))

    importances = np.zeros(seq_len, dtype=np.float64)
    rng = np.random.default_rng(42)

    # Vectorized perturbation matrix generation
    masks = rng.random((num_perturbations, seq_len)) > 0.5
    batch_seq = np.tile(base_seq, (num_perturbations, 1))
    for i in range(num_perturbations):
        batch_seq[i, masks[i]] = baseline

    batch_probs = _predict_proba_tc(batch_seq, model_type)
    deltas = original_probs[0, predicted_class] - batch_probs[:, predicted_class]

    for i in range(num_perturbations):
        n_masked = int(masks[i].sum())
        if n_masked > 0:
            importances[masks[i]] += deltas[i] / n_masked

    importances /= num_perturbations

    # Convert to absolute values for importance ranking
    abs_importances = np.abs(importances)

    # Find top influential regions (contiguous blocks)
    threshold = np.percentile(abs_importances, 85)
    influential = abs_importances > threshold

    regions = []
    in_region = False
    region_start = 0
    for i in range(seq_len):
        if influential[i] and not in_region:
            region_start = i
            in_region = True
        elif not influential[i] and in_region:
            regions.append((region_start, i - 1, float(np.mean(abs_importances[region_start:i]))))
            in_region = False
    if in_region:
        regions.append((region_start, seq_len - 1, float(np.mean(abs_importances[region_start:]))))

    # Top regions sorted by importance
    regions.sort(key=lambda r: r[2], reverse=True)

    # Contribution percentages — top 10 positions
    top_positions = np.argsort(abs_importances)[-10:][::-1]
    total_abs = float(abs_importances.sum()) or 1.0
    contributions = [
        {
            "position": int(p),
            "nucleotide": _token_to_base(int(tokens[0, p])),
            "importance": round(float(abs_importances[p]), 6),
            "contribution_percent": round(float(abs_importances[p] / total_abs * 100), 2),
        }
        for p in top_positions
    ]

    # Nucleotide sequence as string
    nucleotides = [_token_to_base(int(tokens[0, i])) for i in range(seq_len)]

    return {
        "shap_values": importances.tolist(),
        "top_influential_regions": [
            {
                "start": int(r[0]),
                "end": int(r[1]),
                "score": round(r[2], 6),
                "sequence": "".join(nucleotides[r[0] : r[1] + 1]),
            }
            for r in regions[:5]
        ],
        "nucleotides": nucleotides,
        "top_contributions": contributions,
        "predicted_class": predicted_class,
        "original_confidence": round(float(original_probs[0, predicted_class]), 4),
    }


def _predict_proba_tc(tokens: np.ndarray, model_type: str) -> np.ndarray:
    """Common prediction wrapper that handles model type."""
    if model_type.lower() == "cnn":
        return _predict_proba_cnn(tokens)
    elif model_type.lower() == "transformer":
        return _predict_proba_transformer(tokens)
    elif model_type.lower() == "lstm":
        from backend.predictor.lstm_predictor import get_model

        model = get_model()
        return model.predict(tokens, verbose=0)
    else:
        raise ValueError(f"Unknown model type: {model_type}")


def generate_explanation_text(shap_result: dict, disease_name: str) -> str:
    """Generate a human-readable explanation from SHAP results."""
    regions = shap_result.get("top_influential_regions", [])
    if not regions:
        return (
            f"The model's prediction for {disease_name} is based on the overall sequence pattern."
        )

    top = regions[0]
    explanation = (
        f"Positions {top['start'] + 1}-{top['end'] + 1} contributed the most towards "
        f"{disease_name} prediction. "
    )

    if len(regions) > 1:
        second = regions[1]
        explanation += (
            f"Additional influential region detected at positions "
            f"{second['start'] + 1}-{second['end'] + 1}. "
        )

    contributions = shap_result.get("top_contributions", [])
    if contributions:
        top_pos = contributions[0]
        explanation += (
            f"Nucleotide '{top_pos['nucleotide']}' at position {top_pos['position'] + 1} "
            f"had the highest individual contribution ({top_pos['contribution_percent']}%)."
        )

    return explanation
