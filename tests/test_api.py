from fastapi.testclient import TestClient


def test_health_endpoint():
    from backend.main import app

    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in ("Healthy", "Online")
