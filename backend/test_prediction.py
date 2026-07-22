try:
	from backend.predictor import predictor as predictor_module
except ImportError:
	from predictor import predictor as predictor_module


def test_predict_disease_uses_mocked_cnn_predict(monkeypatch):
	def fake_predict(tokens):
		return {
			"label": 1,
			"confidence": 0.91,
			"probabilities": [0.01, 0.91, 0.02, 0.01, 0.01, 0.01, 0.01, 0.02],
		}

	monkeypatch.setattr(predictor_module, "predict", fake_predict)

	sequence = "ATGCN" * 40 + "A"
	result = predictor_module.predict_disease(sequence)

	assert result["predicted_disease"] == "Lung Cancer"
	assert result["confidence"] == 91.0
	assert result["confidence_level"] == "Very High"
	assert result["model"] == "CNN"
	assert result["sequence_length"] == 201
	assert len(result["all_predictions"]) == 3


if __name__ == "__main__":
	def fake_predict(tokens):
		return {
			"label": 1,
			"confidence": 0.91,
			"probabilities": [0.01, 0.91, 0.02, 0.01, 0.01, 0.01, 0.01, 0.02],
		}

	predictor_module.predict = fake_predict
	sequence = "ATGCN" * 40 + "A"
	print(predictor_module.predict_disease(sequence))