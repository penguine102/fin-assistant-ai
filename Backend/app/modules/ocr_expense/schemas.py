"""
Simplified OCR Expense Schemas - Option 2 Implementation.
Only essential schemas for synchronous OCR processing.
"""

from __future__ import annotations
from typing import Literal, Optional, List
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic import ConfigDict
from fastapi import Form


# --- Core OCR Expense Schemas ---

class OcrExpenseAmount(BaseModel):
    value: int = Field(..., ge=0)
    currency: Literal["VND"] = "VND"


class OcrExpenseCategory(BaseModel):
    code: Literal["FNB", "GRO", "TRA", "UTI", "ENT", "OTH"]
    name: str = Field(..., min_length=1)


class OcrExpenseItem(BaseModel):
    name: str = Field(..., min_length=1)
    qty: Optional[int] = Field(None, ge=1)


class OcrExpenseMeta(BaseModel):
    needs_review: bool = False
    warnings: List[str] = Field(default_factory=list)


class OcrExpenseResult(BaseModel):
    transaction_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    amount: OcrExpenseAmount
    category: OcrExpenseCategory
    items: Optional[List[OcrExpenseItem]] = None
    meta: OcrExpenseMeta = Field(default_factory=OcrExpenseMeta)


class OcrExpenseHints(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    items_expected: Optional[bool] = None
    debug: Optional[bool] = None


class OcrExpenseJobResponse(BaseModel):
    job_id: str
    session_id: str
    user_id: str
    filename: str
    status: str
    created_at: datetime
    # Optional structured result (present when debug=true)
    result: OcrExpenseResult | None = None

    model_config = ConfigDict(from_attributes=True)


# --- Request schema for OCR extract (to appear in OpenAPI Schemas) ---
class OcrExpenseExtractRequest(BaseModel):
    session_id: str
    user_id: str
    hints: Optional[str] = None  # JSON string
    debug: bool = False

    @classmethod
    def as_form(
        cls,
        session_id: str = Form(...),
        user_id: str = Form(...),
        hints: Optional[str] = Form(None),
        debug: bool = Form(False),
    ) -> "OcrExpenseExtractRequest":
        return cls(session_id=session_id, user_id=user_id, hints=hints, debug=debug)