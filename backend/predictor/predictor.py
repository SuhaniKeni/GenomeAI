try:
    from backend.predictor.cnn_predictor import predict
    from backend.utils.disease_mapper import get_disease
    from backend.utils.tokenizer import prepare_model_input
except ImportError:
    from predictor.cnn_predictor import predict
    from utils.disease_mapper import get_disease
    from utils.tokenizer import prepare_model_input

def confidence_level(confidence):

    if confidence >= 90:
        return "Very High"

    elif confidence >= 75:
        return "High"

    elif confidence >= 50:
        return "Moderate"

    return "Low"


def predict_disease(sequence: str):

    tokens = prepare_model_input(sequence)

    result = predict(tokens)

    probabilities = result["probabilities"]

    all_predictions = []

    for label, probability in enumerate(probabilities):

        all_predictions.append({
            "disease": get_disease(label),
            "probability": round(probability * 100, 2)
        })

    # Sort highest probability first
    all_predictions.sort(
        key=lambda x: x["probability"],
        reverse=True
    )

    confidence = round(result["confidence"] * 100, 2)
    cleaned_sequence = str(sequence).strip()

    return {
        "predicted_disease": get_disease(result["label"]),
        "label": result["label"],
        "confidence": confidence,
        "confidence_level": confidence_level(confidence),
        "model": "CNN",
        "sequence_length": len(cleaned_sequence),
        "all_predictions": all_predictions[:3]
    }
