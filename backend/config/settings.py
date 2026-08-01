"""Centralized Application Configuration & Settings for GenomeAI.

Provides type-annotated, environment-backed configuration for:
- Database connection strings & pool settings
- Authentication & JWT secret keys
- CORS origins
- AI Engine parameters
- NCBI Remote BLAST configuration
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, Field

# Base Directory of the Project
BASE_DIR = Path(__file__).resolve().parents[2]


class AppSettings(BaseModel):
    PROJECT_NAME: str = "GenomeAI Clinical Genomic Engine"
    VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/genomeai_dev"
        )
    )

    # Auth
    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "GENOMEAI_SECRET_KEY", "genomeai_clinical_lis_secret_key_2026_x89412"
        )
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
            if origin.strip()
        ]
    )

    # Remote BLAST
    BLAST_PROGRAM: str = os.getenv("BLAST_PROGRAM", "blastn")
    BLAST_DATABASE: str = os.getenv("BLAST_DATABASE", "nt")
    BLAST_TIMEOUT: float = float(os.getenv("BLAST_TIMEOUT", "15.0"))
    BLAST_MAX_RESULTS: int = int(os.getenv("BLAST_MAX_RESULTS", "5"))
    BLAST_EVALUE_THRESHOLD: float = float(os.getenv("BLAST_EVALUE_THRESHOLD", "10.0"))
    BLAST_ENABLED: bool = os.getenv("BLAST_ENABLED", "true").lower() in ("true", "1", "yes")


settings = AppSettings()
