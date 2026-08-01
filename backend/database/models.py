"""SQLAlchemy ORM Models for GenomeAI LIS (PostgreSQL Compatible).

Database Models:
- Laboratory: Multi-tenant laboratory isolation
- User: Role-based user authentication & LIS authorization
- DNAAnalysis: Genomic disease predictions & AI inference records
- Report: Generated clinical PDF documents
- EvidenceCache: ClinVar, NCBI, and local genomic evidence cache
- AnalysisHistory: Prediction audit history log
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

try:
    from backend.database.connection import Base
except ImportError:
    from connection import Base


def current_utc_time():
    return datetime.now(timezone.utc)


class Laboratory(Base):
    __tablename__ = "laboratories"

    lab_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_code = Column(String(50), unique=True, index=True, nullable=False)
    laboratory_name = Column(String(150), nullable=False)
    registration_number = Column(String(50), unique=True, index=True, nullable=True)
    institution = Column(String(150), nullable=True)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    country = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_utc_time)

    # Relationships
    users = relationship("User", back_populates="laboratory", cascade="all, delete-orphan")
    dna_analyses = relationship(
        "DNAAnalysis", back_populates="laboratory", cascade="all, delete-orphan"
    )
    reports = relationship("Report", back_populates="laboratory", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_id = Column(
        Integer, ForeignKey("laboratories.lab_id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        String(50), nullable=False
    )  # Administrator, Laboratory Manager, Laboratory Technician, Researcher, Student
    employee_id = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_utc_time)
    status = Column(String(20), default="active")

    # Relationships
    laboratory = relationship("Laboratory", back_populates="users")
    dna_analyses = relationship("DNAAnalysis", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


class DNAAnalysis(Base):
    __tablename__ = "dna_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(50), unique=True, index=True, nullable=False)
    lab_id = Column(
        Integer, ForeignKey("laboratories.lab_id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    sample_id = Column(String(50), index=True, nullable=False)
    patient_id = Column(String(50), index=True, nullable=True)
    dna_sequence = Column(Text, nullable=False)
    sequence_length = Column(Integer, nullable=False)
    predicted_disease = Column(String(100), index=True, nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_level = Column(String(50), nullable=True)
    probability_distribution = Column(Text, nullable=False)
    all_predictions = Column(Text, nullable=True)
    shap_explanation = Column(Text, nullable=True)
    mutation_summary = Column(Text, nullable=True)
    blast_data = Column(Text, nullable=True)
    inference_time_ms = Column(Float, nullable=True)
    model_version = Column(String(50), default="GenomeAI CNN v2.0", index=True)
    analysis_status = Column(String(30), default="completed")
    analysis_timestamp = Column(DateTime(timezone=True), default=current_utc_time)

    # Relationships
    laboratory = relationship("Laboratory", back_populates="dna_analyses")
    user = relationship("User", back_populates="dna_analyses")
    report = relationship(
        "Report", back_populates="dna_analysis", uselist=False, cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(
        String(50),
        ForeignKey("dna_analyses.analysis_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lab_id = Column(
        Integer, ForeignKey("laboratories.lab_id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_filename = Column(String(255), nullable=False)
    report_path = Column(String(255), nullable=False)
    generated_at = Column(DateTime(timezone=True), default=current_utc_time)

    # Relationships
    dna_analysis = relationship("DNAAnalysis", back_populates="report")
    laboratory = relationship("Laboratory", back_populates="reports")
    user = relationship("User", back_populates="reports")


class EvidenceCache(Base):
    __tablename__ = "evidence_cache"

    cache_key = Column(String(255), primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)
    data_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time)
    updated_at = Column(
        DateTime(timezone=True), default=current_utc_time, onupdate=current_utc_time
    )


class AnalysisHistory(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(String(100), nullable=False)
    sequence = Column(Text, nullable=False)
    predicted_disease = Column(String(100), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    confidence_level = Column(String(50), nullable=False)
    model = Column(String(50), index=True, nullable=False)
    all_predictions = Column(Text, nullable=False)
    sequence_length = Column(Integer, nullable=False)
    inference_time_ms = Column(Float, nullable=True)
    shap_explanation = Column(Text, nullable=True)
    mutation_summary = Column(Text, nullable=True)
    blast_data = Column(Text, nullable=True)


# Compound indexes for fast audit logging & history queries
Index("idx_history_disease_model", AnalysisHistory.predicted_disease, AnalysisHistory.model)
Index("idx_dna_analyses_lab_user", DNAAnalysis.lab_id, DNAAnalysis.user_id)
