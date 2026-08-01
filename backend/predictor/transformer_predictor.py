"""Transformer-based DNA disease predictor.

Loads the fine-tuned Nucleotide Transformer model and runs inference.
Expects the same integer-encoded tokenization as CNN (A=0, T=1, G=2, C=3, N=4).
"""

from __future__ import annotations

import time
from pathlib import Path

import numpy as np
import torch

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "trained_models" / "best_transformer_model.pth"
MODEL_NAME = "InstaDeepAI/nucleotide-transformer-v2-50m-multi-species"

_MODEL = None
_TOKENIZER = None
_DEVICE = None


def _get_device() -> torch.device:
    global _DEVICE
    if _DEVICE is None:
        _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return _DEVICE


def load_resources():
    """Lazy-load tokenizer, model, and move to device."""
    global _MODEL, _TOKENIZER

    if _MODEL is not None and _TOKENIZER is not None:
        return _MODEL, _TOKENIZER

    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    device = _get_device()

    _TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)

    _MODEL = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=8,
        trust_remote_code=True,
    )

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Fine-tuned Transformer model weights not found at {MODEL_PATH}. "
            "Please train the Transformer model using backend/ai/transformer_train.py first."
        )

    _MODEL.load_state_dict(
        torch.load(MODEL_PATH, map_location=device, weights_only=True),
        strict=False,
    )
    print(f"Transformer: loaded fine-tuned weights from {MODEL_PATH}")

    _MODEL.to(device)
    _MODEL.eval()

    return _MODEL, _TOKENIZER


def _tokens_to_string(tokens: np.ndarray) -> str:
    """Convert integer tokens back to DNA string."""
    rev_map = {0: "A", 1: "T", 2: "G", 3: "C", 4: "N"}
    return "".join(rev_map.get(int(t), "N") for t in tokens)


def predict(tokens: np.ndarray) -> dict:
    """Run Transformer inference on tokenised input.

    Args:
        tokens: shape (1, 201) int32 array (A=0, T=1, G=2, C=3, N=4)

    Returns:
        dict with label, confidence, probabilities, inference_time_ms,
        attentions (optional)
    """
    model, tokenizer = load_resources()
    device = _get_device()

    # Convert integer tokens back to DNA string for the HuggingFace tokenizer
    dna_string = _tokens_to_string(tokens[0])

    inputs = tokenizer(
        dna_string,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=256,
    )

    inputs = {k: v.to(device) for k, v in inputs.items()}

    start = time.perf_counter()

    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    logits = outputs.logits
    probs = torch.softmax(logits, dim=-1).squeeze(0)

    predicted_label = int(torch.argmax(probs).cpu().numpy())
    confidence = float(probs[predicted_label].cpu().numpy())

    # Extract attention weights (last layer, average over heads)
    # attentions: list of tensors, one per layer, shape (batch, heads, seq_len, seq_len)
    # We'll return the averaged attention from the last layer
    attention_maps = None
    if outputs.attentions:
        last_attn = outputs.attentions[-1]  # (1, n_heads, seq_len, seq_len)
        attention_maps = last_attn.squeeze(0).mean(dim=0).cpu().numpy().tolist()

    return {
        "label": predicted_label,
        "confidence": confidence,
        "probabilities": probs.cpu().numpy().tolist(),
        "inference_time_ms": elapsed_ms,
        "attentions": attention_maps,  # list of lists
    }


def reset_model_cache():
    global _MODEL, _TOKENIZER, _DEVICE
    _MODEL = None
    _TOKENIZER = None
    _DEVICE = None
