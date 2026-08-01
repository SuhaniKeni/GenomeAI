"""Authentication and JWT Token Service for GenomeAI LIS.

Implements PBKDF2 password hashing and HMAC-SHA256 / PyJWT bearer tokens.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional

SECRET_KEY = os.getenv("GENOMEAI_SECRET_KEY", "genomeai_clinical_lis_secret_key_2026_x89412")
TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days expiration


def get_password_hash(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifies a plain password against its PBKDF2 hash string."""
    try:
        parts = password_hash.split("$")
        if len(parts) != 3 or not parts[0].startswith("pbkdf2:sha256"):
            return False
        salt = parts[1]
        target_key = parts[2]
        key = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000
        )
        return hmac.compare_digest(key.hex(), target_key)
    except Exception:
        return False


def create_access_token(data: dict, expires_in: int = TOKEN_EXPIRE_SECONDS) -> str:
    """Generates a secure signed JSON Web Token (JWT)."""
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in
    payload["iat"] = int(time.time())

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = (
        base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    )
    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
    )

    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"), message.encode("utf-8"), hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")

    return f"{message}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a signed JWT bearer token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        message = f"{header_b64}.{payload_b64}"
        signature = hmac.new(
            SECRET_KEY.encode("utf-8"), message.encode("utf-8"), hashlib.sha256
        ).digest()
        expected_sig = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")

        if not hmac.compare_digest(sig_b64, expected_sig):
            return None

        # Add padding back if necessary
        padding = "=" * (4 - (len(payload_b64) % 4))
        if padding != "====":
            payload_b64 += padding

        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))

        if payload.get("exp", 0) < time.time():
            return None  # Token expired

        return payload
    except Exception:
        return None
