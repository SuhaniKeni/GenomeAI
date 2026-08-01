"""Initial PostgreSQL schema setup

Revision ID: 001_initial_postgres_schema
Revises:
Create Date: 2026-07-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial_postgres_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Laboratories
    op.create_table(
        "laboratories",
        sa.Column("lab_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("lab_code", sa.String(length=50), nullable=False),
        sa.Column("laboratory_name", sa.String(length=150), nullable=False),
        sa.Column("registration_number", sa.String(length=50), nullable=True),
        sa.Column("institution", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=50), nullable=True),
        sa.Column("country", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("lab_id"),
        sa.UniqueConstraint("lab_code"),
        sa.UniqueConstraint("registration_number"),
    )
    op.create_index(op.f("ix_laboratories_lab_code"), "laboratories", ["lab_code"], unique=True)
    op.create_index(op.f("ix_laboratories_lab_id"), "laboratories", ["lab_id"], unique=False)

    # Users
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("lab_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("employee_id", sa.String(length=50), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["lab_id"], ["laboratories.lab_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_lab_id"), "users", ["lab_id"], unique=False)
    op.create_index(op.f("ix_users_user_id"), "users", ["user_id"], unique=False)

    # DNA Analyses
    op.create_table(
        "dna_analyses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("analysis_id", sa.String(length=50), nullable=False),
        sa.Column("lab_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("sample_id", sa.String(length=50), nullable=False),
        sa.Column("patient_id", sa.String(length=50), nullable=True),
        sa.Column("dna_sequence", sa.Text(), nullable=False),
        sa.Column("sequence_length", sa.Integer(), nullable=False),
        sa.Column("predicted_disease", sa.String(length=100), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("confidence_level", sa.String(length=50), nullable=True),
        sa.Column("probability_distribution", sa.Text(), nullable=False),
        sa.Column("all_predictions", sa.Text(), nullable=True),
        sa.Column("shap_explanation", sa.Text(), nullable=True),
        sa.Column("mutation_summary", sa.Text(), nullable=True),
        sa.Column("blast_data", sa.Text(), nullable=True),
        sa.Column("inference_time_ms", sa.Float(), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("analysis_status", sa.String(length=30), nullable=True),
        sa.Column("analysis_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["lab_id"], ["laboratories.lab_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("analysis_id"),
    )
    op.create_index(
        op.f("ix_dna_analyses_analysis_id"), "dna_analyses", ["analysis_id"], unique=True
    )
    op.create_index(op.f("ix_dna_analyses_sample_id"), "dna_analyses", ["sample_id"], unique=False)
    op.create_index(
        op.f("ix_dna_analyses_predicted_disease"),
        "dna_analyses",
        ["predicted_disease"],
        unique=False,
    )

    # Reports
    op.create_table(
        "reports",
        sa.Column("report_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("analysis_id", sa.String(length=50), nullable=False),
        sa.Column("lab_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("report_filename", sa.String(length=255), nullable=False),
        sa.Column("report_path", sa.String(length=255), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["analysis_id"], ["dna_analyses.analysis_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lab_id"], ["laboratories.lab_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("report_id"),
    )

    # Evidence Cache
    op.create_table(
        "evidence_cache",
        sa.Column("cache_key", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("data_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("cache_key"),
    )
    op.create_index(
        op.f("ix_evidence_cache_category"), "evidence_cache", ["category"], unique=False
    )

    # Analysis History
    op.create_table(
        "history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.String(length=100), nullable=False),
        sa.Column("sequence", sa.Text(), nullable=False),
        sa.Column("predicted_disease", sa.String(length=100), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("confidence_level", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=50), nullable=False),
        sa.Column("all_predictions", sa.Text(), nullable=False),
        sa.Column("sequence_length", sa.Integer(), nullable=False),
        sa.Column("inference_time_ms", sa.Float(), nullable=True),
        sa.Column("shap_explanation", sa.Text(), nullable=True),
        sa.Column("mutation_summary", sa.Text(), nullable=True),
        sa.Column("blast_data", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("history")
    op.drop_table("evidence_cache")
    op.drop_table("reports")
    op.drop_table("dna_analyses")
    op.drop_table("users")
    op.drop_table("laboratories")
