"""Live API E2E Verification Test Suite for GenomeAI.

Tests all live FastAPI endpoints against http://127.0.0.1:8000.
"""
from __future__ import annotations

import json
import time
import urllib.request
import urllib.parse

API_BASE = "http://127.0.0.1:8000"


def test_endpoint_health():
    print("[E2E TEST 1/5] GET /health...")
    req = urllib.request.Request(f"{API_BASE}/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data.get("status") == "Healthy"
        print("  [OK] Health check passed:", data)


def test_endpoint_predict():
    print("[E2E TEST 2/5] POST /predict...")
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    payload = json.dumps({"sequence": seq}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/predict?explain=true",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        res = data.get("result", {})
        assert "predicted_disease" in res
        assert "confidence" in res
        assert "evidence" in res
        ev = res["evidence"]
        assert "evidence_score" in ev
        assert "verified_badges" in ev
        assert "evidence_summary" in ev
        print(f"  [OK] Predict response verified: Disease={res['predicted_disease']}, Confidence={res['confidence']}%, EvidenceScore={ev['evidence_score']}")
        print(f"       Badges: {ev['verified_badges']}")


def test_endpoint_predict_extended():
    print("[E2E TEST 3/5] POST /predict/extended...")
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    payload = json.dumps({"sequence": seq}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/predict/extended",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        res = data.get("result", {})
        assert "evidence" in res
        assert "mutation_summary" in res
        assert "shap_explanation" in res
        print(f"  [OK] Predict Extended verified: MutationSummary={bool(res['mutation_summary'])}, EvidenceScore={res['evidence']['evidence_score']}")


def test_endpoint_predict_evidence():
    print("[E2E TEST 4/5] POST /predict/evidence...")
    payload = json.dumps({"disease_name": "Breast Cancer", "gene_symbol": "PALB2"}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/predict/evidence",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        ev = data.get("evidence", {})
        assert ev.get("gene") == "PALB2"
        print(f"  [OK] Standalone evidence endpoint verified: Gene={ev['gene']}, Sources={ev['sources']}")


def test_endpoint_predict_report():
    print("[E2E TEST 5/5] POST /predict/report...")
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    payload = json.dumps({"sequence": seq}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/predict/report?patient_name=John+Doe",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        assert resp.status == 200
        pdf_bytes = resp.read()
        assert len(pdf_bytes) > 1000
        assert pdf_bytes.startswith(b"%PDF")
        print(f"  [OK] PDF Report endpoint verified: Generated PDF size = {len(pdf_bytes)} bytes.")


def test_endpoint_predict_blast():
    print("[E2E TEST 6/6] POST /predict/blast...")
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    payload = json.dumps({"sequence": seq}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/predict/blast",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        blast_res = data.get("blast", {})
        assert "status" in blast_res
        print(f"  [OK] Standalone BLAST endpoint verified: Status={blast_res['status']}, QueryLength={blast_res.get('query_length')}")


def main():
    print("==================================================")
    print("GenomeAI Live E2E Endpoints Verification Suite")
    print("==================================================")
    test_endpoint_health()
    test_endpoint_predict()
    test_endpoint_predict_extended()
    test_endpoint_predict_evidence()
    test_endpoint_predict_report()
    test_endpoint_predict_blast()
    print("==================================================")
    print("ALL LIVE ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    main()
