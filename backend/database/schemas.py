"""Pydantic V2 Schemas for GenomeAI Database Operations."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


class LaboratoryBase(BaseModel):
    laboratory_name: str
    registration_number: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class LaboratoryCreate(LaboratoryBase):
    lab_code: Optional[str] = None
    institution: Optional[str] = None


class LaboratoryResponse(LaboratoryBase):
    lab_id: int
    lab_code: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: str = "Laboratory Technician"
    employee_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    lab_id: Optional[int] = 1
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    user_id: int
    lab_id: int
    status: str = "active"
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class DNAAnalysisCreate(BaseModel):
    sample_id: str
    patient_id: Optional[str] = None
    dna_sequence: str
    predicted_disease: str
    confidence_score: float
    confidence_level: Optional[str] = "High"
    probability_distribution: List[Dict[str, Any]]
    all_predictions: Optional[List[Dict[str, Any]]] = None
    shap_explanation: Optional[str] = None
    mutation_summary: Optional[str] = None
    blast_data: Optional[Dict[str, Any]] = None
    inference_time_ms: Optional[float] = None
    model_version: str = "GenomeAI CNN v2.0"


class DNAAnalysisResponse(BaseModel):
    analysis_id: str
    lab_id: int
    user_id: int
    sample_id: str
    patient_id: Optional[str] = None
    sequence_length: int
    predicted_disease: str
    confidence_score: float
    confidence_level: Optional[str] = None
    model_version: str
    analysis_status: str
    analysis_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class HistoryRecordResponse(BaseModel):
    id: int
    timestamp: str
    sequence: str
    predicted_disease: str
    confidence: float
    confidence_level: str
    model: str
    all_predictions: List[Dict[str, Any]] = []
    sequence_length: int
    inference_time_ms: Optional[float] = None
    shap_explanation: Optional[str] = None
    mutation_summary: Optional[str] = None
    blast: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class PaginatedHistoryResponse(BaseModel):
    success: bool = True
    total: int
    offset: int
    limit: int
    records: List[HistoryRecordResponse]
    items: List[HistoryRecordResponse]
    db_path: str = "PostgreSQL"
