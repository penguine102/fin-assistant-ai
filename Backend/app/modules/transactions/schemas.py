from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from pydantic import ConfigDict


class TransactionBase(BaseModel):
    user_id: str = Field(..., description="User UUID")
    amount: float = Field(..., gt=0, description="Số tiền dương; dùng type để xác định thu/chi")
    type: str = Field(..., pattern="^(income|expense)$")
    category: str | None = Field(None, max_length=64)
    note: str | None = Field(None, max_length=255)
    occurred_at: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$", description="Định dạng VN: YYYY-MM-DD HH:MM:SS")


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(BaseModel):
    id: str
    user_id: str
    amount: float
    type: str
    category: str | None
    note: str | None
    occurred_at: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SummaryQuery(BaseModel):
    user_id: str
    start: str
    end: str


class SummaryResult(BaseModel):
    income: float
    expense: float
    net: float


