from __future__ import annotations

from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.transactions.models import Transaction


def _normalize_to_naive_utc(dt: datetime) -> datetime:
    """Chuẩn hóa datetime về UTC-naive để ghi vào TIMESTAMP WITHOUT TIME ZONE.
    - Nếu dt có tz (aware) → chuyển sang UTC rồi bỏ tzinfo.
    - Nếu dt không có tz (naive) → giả định là giờ Việt Nam (Asia/Ho_Chi_Minh),
      sau đó chuyển sang UTC-naive.
    """
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    # naive → coi như giờ Việt Nam
    vn = timezone(timedelta(hours=7))
    dt_vn = dt.replace(tzinfo=vn)
    return dt_vn.astimezone(timezone.utc).replace(tzinfo=None)


async def create_transaction(session: AsyncSession,
                             user_id: str,
                             amount: float,
                             type: str,
                             category: str | None,
                             note: str | None,
                             occurred_at: datetime) -> Transaction:
    occurred_at = _normalize_to_naive_utc(occurred_at)
    tx = Transaction(
        user_id=user_id,
        amount=Decimal(str(amount)),
        type=type,
        category=category,
        note=note,
        occurred_at=occurred_at,
    )
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return tx


async def get_summary(session: AsyncSession,
                      user_id: str,
                      start: datetime,
                      end: datetime) -> tuple[float, float, float]:
    start = _normalize_to_naive_utc(start)
    end = _normalize_to_naive_utc(end)
    cond = and_(
        Transaction.user_id == user_id,
        Transaction.occurred_at >= start,
        Transaction.occurred_at < end,
    )

    income_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(and_(cond, Transaction.type == "income"))
    expense_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(and_(cond, Transaction.type == "expense"))

    income_res = await session.execute(income_query)
    expense_res = await session.execute(expense_query)

    income = float(income_res.scalar_one() or 0)
    expense = float(expense_res.scalar_one() or 0)
    net = income - expense
    return income, expense, net


