from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import ForeignKey, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

# Reuse global mapper_registry from users.service
from app.modules.users.service import mapper_registry


class TransactionType:
    INCOME = "income"
    EXPENSE = "expense"


@mapper_registry.mapped
class Transaction:
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    # Positive numbers; sign is not used for type. Use type to indicate income/expense
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)  # income | expense
    category: Mapped[str] = mapped_column(String(64), nullable=True)
    note: Mapped[str] = mapped_column(String(255), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)


