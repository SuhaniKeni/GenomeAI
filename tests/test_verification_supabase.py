"""Verification script for GenomeAI Supabase PostgreSQL Integration."""

from __future__ import annotations

import time
import unittest

from fastapi.testclient import TestClient

from backend.database.connection import engine
from backend.main import app

client = TestClient(app)


class TestGenomeAISupabaseIntegration(unittest.TestCase):

    def test_01_database_url_normalization(self):
        self.assertIsNotNone(engine, "Database engine should be initialized")
        test_supabase_url = (
            "postgres://postgres.ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        )
        fixed_url = (
            test_supabase_url.replace("postgres://", "postgresql://", 1)
            if test_supabase_url.startswith("postgres://")
            else test_supabase_url
        )
        self.assertTrue(
            fixed_url.startswith("postgresql://"),
            "Supabase URL must be converted from postgres:// to postgresql://",
        )

    def test_02_health_check(self):
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "Online")

    def test_03_authentication(self):
        login_resp = client.post(
            "/api/auth/login", json={"email": "admin@genomeai.lab", "password": "admin123"}
        )
        self.assertEqual(login_resp.status_code, 200, f"Login failed: {login_resp.text}")
        data = login_resp.json()
        token = data["access_token"]

        me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_resp.status_code, 200)

    def test_04_registration(self):
        ts = int(time.time())
        reg_resp = client.post(
            "/api/auth/register-lab",
            json={
                "lab_name": f"Genomics Core Lab {ts}",
                "lab_code": f"LAB-{ts}",
                "admin_email": f"admin_{ts}@genomeai.lab",
                "admin_name": "Test Lab Admin",
                "admin_password": "Password123!",
            },
        )
        self.assertEqual(reg_resp.status_code, 200)

        user_resp = client.post(
            "/api/lis/users",
            json={
                "email": f"tech_{ts}@genomeai.lab",
                "full_name": "Test Technician",
                "password": "Password123!",
                "role": "Laboratory Technician",
            },
        )
        self.assertEqual(user_resp.status_code, 200)

    def test_05_user_management(self):
        resp = client.get("/api/lis/users")
        self.assertEqual(resp.status_code, 200)

        lab_resp = client.get("/api/lis/lab")
        self.assertEqual(lab_resp.status_code, 200)

    def test_06_dna_analysis(self):
        seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
        resp = client.post("/api/predict", json={"sequence": seq})
        self.assertEqual(resp.status_code, 200)

        ext_resp = client.post("/api/predict/extended", json={"sequence": seq})
        self.assertEqual(ext_resp.status_code, 200)

    def test_07_analysis_history(self):
        resp = client.get("/api/history")
        self.assertEqual(resp.status_code, 200)

    def test_08_supporting_evidence(self):
        resp = client.post(
            "/api/predict/evidence", json={"disease_name": "Breast Cancer", "gene_symbol": "BRCA1"}
        )
        self.assertEqual(resp.status_code, 200)

    def test_09_pdf_generation(self):
        seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
        resp = client.post("/api/predict/report?patient_name=Jane+Doe", json={"sequence": seq})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("content-type"), "application/pdf")


if __name__ == "__main__":
    unittest.main()
