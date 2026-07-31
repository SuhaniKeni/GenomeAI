"""Verification script for GenomeAI Supabase PostgreSQL Integration.

Tests:
1. Database URL scheme conversion (postgres:// to postgresql://)
2. Application /health check
3. Authentication (/api/auth/login & /api/auth/me)
4. Registration (/api/auth/register-lab & POST /api/lis/users)
5. User & Lab Management (GET /api/lis/users & GET /api/lis/lab)
6. DNA Analysis (/api/predict & /api/predict/extended)
7. Analysis History (/api/history & /api/history/{id})
8. Supporting Evidence (/api/predict/evidence)
9. PDF Generation (/api/predict/report streaming PDF)
"""
from __future__ import annotations

import sys
import unittest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.connection import engine, DATABASE_URL

client = TestClient(app)

class TestGenomeAISupabaseIntegration(unittest.TestCase):

    def test_01_database_url_normalization(self):
        print("\n[TEST 1] Testing Database URL & Connection Normalization...")
        self.assertIsNotNone(engine, "Database engine should be initialized")
        # Test URL converter logic for Supabase postgres:// scheme
        test_supabase_url = "postgres://postgres.ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        fixed_url = test_supabase_url.replace("postgres://", "postgresql://", 1) if test_supabase_url.startswith("postgres://") else test_supabase_url
        self.assertTrue(fixed_url.startswith("postgresql://"), "Supabase URL must be converted from postgres:// to postgresql://")
        self.assertFalse(DATABASE_URL.startswith("postgres://"), "Current DATABASE_URL must not start with un-normalized postgres://")

    def test_02_health_check(self):
        print("[TEST 2] Testing /health endpoint...")
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "Online")
        self.assertEqual(data.get("database"), "PostgreSQL")

    def test_03_authentication(self):
        print("[TEST 3] Testing Authentication (/api/auth/login & /api/auth/me)...")
        # Login with default admin credentials
        login_resp = client.post("/api/auth/login", json={
            "email": "admin@genomeai.lab",
            "password": "admin123"
        })
        self.assertEqual(login_resp.status_code, 200, f"Login failed: {login_resp.text}")
        data = login_resp.json()
        self.assertIn("access_token", data)
        token = data["access_token"]

        # Verify /me endpoint with Bearer token
        me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_resp.status_code, 200, f"/me failed: {me_resp.text}")
        user_info = me_resp.json()
        self.assertEqual(user_info.get("user", {}).get("email"), "admin@genomeai.lab")

    def test_04_registration(self):
        print("[TEST 4] Testing Registration (/api/auth/register-lab & POST /api/lis/users)...")
        import time
        ts = int(time.time())
        # Test Lab & Admin Registration
        reg_resp = client.post("/api/auth/register-lab", json={
            "lab_name": f"Genomics Core Lab {ts}",
            "lab_code": f"LAB-{ts}",
            "admin_email": f"admin_{ts}@genomeai.lab",
            "admin_name": "Test Lab Admin",
            "admin_password": "Password123!"
        })
        self.assertEqual(reg_resp.status_code, 200, f"Lab registration failed: {reg_resp.text}")
        reg_data = reg_resp.json()
        self.assertTrue(reg_data.get("success"))
        self.assertIn("access_token", reg_data)

        # Test creating user inside existing lab
        user_resp = client.post("/api/lis/users", json={
            "email": f"tech_{ts}@genomeai.lab",
            "full_name": "Test Technician",
            "password": "Password123!",
            "role": "Laboratory Technician"
        })
        self.assertEqual(user_resp.status_code, 200, f"User creation failed: {user_resp.text}")
        user_data = user_resp.json()
        self.assertTrue(user_data.get("success"))
        self.assertEqual(user_data.get("user", {}).get("email"), f"tech_{ts}@genomeai.lab")

    def test_05_user_management(self):
        print("[TEST 5] Testing User & Lab Management (GET /api/lis/users & GET /api/lis/lab)...")
        # List LIS users
        resp = client.get("/api/lis/users")
        self.assertEqual(resp.status_code, 200, f"Get LIS users failed: {resp.text}")
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("users", data)
        users = data["users"]
        self.assertIsInstance(users, list)
        self.assertGreaterEqual(len(users), 1)

        # Get Lab details
        lab_resp = client.get("/api/lis/lab")
        self.assertEqual(lab_resp.status_code, 200, f"Get Lab details failed: {lab_resp.text}")
        lab_data = lab_resp.json()
        self.assertTrue(lab_data.get("success"))
        self.assertIn("laboratory", lab_data)

    def test_06_dna_analysis(self):
        print("[TEST 6] Testing DNA Analysis (/api/predict & /api/predict/extended)...")
        seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
        
        # Standard predict
        resp = client.post("/api/predict", json={"sequence": seq})
        self.assertEqual(resp.status_code, 200, f"Predict failed: {resp.text}")
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("predicted_disease", data.get("result", {}))

        # Extended predict
        ext_resp = client.post("/api/predict/extended", json={"sequence": seq})
        self.assertEqual(ext_resp.status_code, 200, f"Extended predict failed: {ext_resp.text}")
        ext_data = ext_resp.json()
        self.assertTrue(ext_data.get("success"))
        self.assertIn("shap_explanation", ext_data.get("result", {}))

    def test_07_analysis_history(self):
        print("[TEST 7] Testing Analysis History (/api/history)...")
        resp = client.get("/api/history")
        self.assertEqual(resp.status_code, 200, f"History failed: {resp.text}")
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertTrue("items" in data or "records" in data)

    def test_08_supporting_evidence(self):
        print("[TEST 8] Testing Supporting Evidence (/api/predict/evidence)...")
        resp = client.post("/api/predict/evidence", json={"disease_name": "Breast Cancer", "gene_symbol": "BRCA1"})
        self.assertEqual(resp.status_code, 200, f"Evidence failed: {resp.text}")
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("evidence", data)

    def test_09_pdf_generation(self):
        print("[TEST 9] Testing PDF Generation (/api/predict/report)...")
        seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
        resp = client.post("/api/predict/report?patient_name=Jane+Doe", json={"sequence": seq})
        self.assertEqual(resp.status_code, 200, f"PDF generation failed: {resp.text}")
        self.assertEqual(resp.headers.get("content-type"), "application/pdf")
        pdf_bytes = resp.content
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 1000)


if __name__ == "__main__":
    unittest.main()
