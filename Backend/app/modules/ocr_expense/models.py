from __future__ import annotations

from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import ForeignKey, JSON, String, Text, Boolean, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.modules.users.service import mapper_registry


@mapper_registry.mapped
class OcrExpenseJob:
    __tablename__ = "ocr_expense_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # File information
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Processing configuration
    profile: Mapped[str] = mapped_column(String(50), default="generic")  # generic, financial, historical
    hints: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # language, timezone, items_expected
    
    # Job status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, processing, completed, failed
    saved_to_transactions: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    session: Mapped["Session"] = relationship("Session")
    result: Mapped[Optional["OcrExpenseResult"]] = relationship("OcrExpenseResult", back_populates="job", uselist=False)


@mapper_registry.mapped
class OcrExpenseResult:
    __tablename__ = "ocr_expense_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(ForeignKey("ocr_expense_jobs.id"), nullable=False)
    
    # Extracted data
    transaction_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    amount_value: Mapped[int] = mapped_column(Integer, nullable=False)  # VND amount
    amount_currency: Mapped[str] = mapped_column(String(3), default="VND", nullable=False)
    category_code: Mapped[str] = mapped_column(String(3), nullable=False)  # FNB, GRO, TRA, UTI, ENT, OTH
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Items (JSON array)
    items_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # [{"name": "string", "qty": int}]
    
    # Metadata
    meta_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"needs_review": bool, "warnings": []}
    
    # Processing info
    processing_time: Mapped[float] = mapped_column(Float, nullable=False)  # seconds
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    
    # Relationships
    job: Mapped["OcrExpenseJob"] = relationship("OcrExpenseJob", back_populates="result")