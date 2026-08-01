import numpy as np

try:
    from backend.predictor.cnn_predictor import predict
    from backend.utils.disease_mapper import get_disease
    from backend.utils.tokenizer import prepare_multi_window_input, validate_dna_sequence
except ImportError:
    try:
        from ..utils.disease_mapper import get_disease
        from ..utils.tokenizer import prepare_multi_window_input, validate_dna_sequence
        from .cnn_predictor import predict
    except ImportError:
        from predictor.cnn_predictor import predict
        from utils.disease_mapper import get_disease
        from utils.tokenizer import prepare_multi_window_input, validate_dna_sequence


def confidence_level(confidence: float) -> str:
    if confidence >= 90:
        return "Very High"
    elif confidence >= 75:
        return "High"
    elif confidence >= 50:
        return "Moderate"
    return "Low"


def predict_disease(sequence: str):
    cleaned_sequence = validate_dna_sequence(sequence, min_length=201)
    tokens_batch, windows = prepare_multi_window_input(cleaned_sequence, window_size=201, stride=25)

    res = predict(tokens_batch)
    raw_probs = res.get("matrix", res.get("probabilities", []))
    probs_matrix = np.atleast_2d(raw_probs)
    num_windows = len(windows)

    # Compute overall disease probability distribution (mean across all windows)
    overall_probs = np.mean(probs_matrix, axis=0)
    overall_label = int(np.argmax(overall_probs))
    overall_confidence = round(float(np.max(overall_probs)) * 100, 2)

    # Rank overall predictions
    all_predictions = []
    for label, probability in enumerate(overall_probs):
        all_predictions.append(
            {"disease": get_disease(label), "probability": round(float(probability) * 100, 2)}
        )
    all_predictions.sort(key=lambda x: x["probability"], reverse=True)

    # Identify highest-confidence window
    window_confidences = [float(np.max(probs_matrix[i])) for i in range(num_windows)]
    best_window_idx = int(np.argmax(window_confidences))
    best_win = windows[best_window_idx]
    best_win_probs = probs_matrix[best_window_idx]
    best_win_label = int(np.argmax(best_win_probs))
    best_win_conf = round(float(np.max(best_win_probs)) * 100, 2)

    highest_confidence_window = {
        "window_index": best_win["index"],
        "start_position": best_win["start_1based"],
        "end_position": best_win["end_1based"],
        "disease": get_disease(best_win_label),
        "confidence": best_win_conf,
    }

    summary = (
        f"Analyzed sequence length {len(cleaned_sequence)} bp across {num_windows} window(s) (201 bp size, 25 nt stride). "
        f"Highest-risk window detected at bp {best_win['start_1based']}–{best_win['end_1based']} "
        f"predicting {highest_confidence_window['disease']} with {best_win_conf}% confidence."
    )

    return {
        "predicted_disease": get_disease(overall_label),
        "label": overall_label,
        "confidence": overall_confidence,
        "confidence_level": confidence_level(overall_confidence),
        "model": "CNN",
        "sequence_length": len(cleaned_sequence),
        "windows_analyzed": num_windows,
        "highest_confidence_window": highest_confidence_window,
        "all_predictions": all_predictions[:5],
        "multi_window_summary": summary,
    }
