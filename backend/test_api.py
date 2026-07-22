import sys

from fastapi.testclient import TestClient


def test_health_does_not_import_prediction_model():
    sys.modules.pop("backend.predictor.cnn_predictor", None)
    sys.modules.pop("predictor.cnn_predictor", None)

    from backend.main import app

    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "Healthy"
    assert "backend.predictor.cnn_predictor" not in sys.modules
    assert "predictor.cnn_predictor" not in sys.modules
