"""SQLAlchemy ORM models for GenomeAI Laboratory Information System (LIS).

Represents:
- Laboratories (Multi-Tenant Isolation)
- Users (Role-Based Access Control)
- DNA_Analyses (Genomic Sequence Predictions)
- Reports (Generated PDF Document Archive)
"""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship

try:
    from backend.db.session import Base
except ImportError:
    from db.session import Base


class Laboratory(Base):
    __tablename__ = "laboratories"

    lab_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    laboratory_name = Column(String(150), nullable=False)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    country = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="laboratory", cascade="all, delete-orphan")
    dna_analyses = relationship("DNAAnalysis", back_populates="laboratory", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_id = Column(Integer, ForeignKey("laboratories.lab_id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Administrator, Laboratory Manager, Laboratory Technician, Researcher, Student
    employee_id = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(20), default="active")

    # Relationships
    laboratory = relationship("Laboratory", back_populates="users")
    dna_analyses = relationship("DNAAnalysis", back_populates="user", cascade="all, delete-orphan")


class DNAAnalysis(Base):
    __tablename__ = "dna_analyses"

    analysis_id = Column(String(50), primary_key=True, index=True)
    lab_id = Column(Integer, ForeignKey("laboratories.lab_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    sample_id = Column(String(50), nullable=False)
    patient_id = Column(String(50), nullable=True)
    dna_sequence = Column(Text, nullable=False)
    sequence_length = Column(Integer, nullable=False)
    predicted_disease = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    probability_distribution = Column(Text, nullable=False)  # JSON encoded list of probabilities
    model_version = Column(String(50), default="GenomeAI CNN v2.0")
    analysis_status = Column(String(30), default="completed")
    analysis_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    laboratory = relationship("Laboratory", back_populates="dna_analyses")
    user = relationship("User", back_populates="dna_analyses")
    report = relationship("Report", back_populates="dna_analysis", uselist=False, cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(String(50), ForeignKey("dna_analyses.analysis_id"), nullable=False)
    report_filename = Column(String(255), nullable=False)
    report_path = Column(String(255), nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    dna_analysis = relationship("DNAAnalysis", back_populates="report")
