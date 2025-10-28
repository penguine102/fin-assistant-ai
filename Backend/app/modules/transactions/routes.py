from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.middleware import get_current_user
from app.modules.users.service import User
from app.modules.transactions.schemas import TransactionCreate, TransactionRead, SummaryResult
from app.modules.transactions.service import create_transaction, get_summary
from datetime import datetime, timezone, timedelta


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction_endpoint(
    payload: TransactionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Parse occurred_at strict format: YYYY-MM-DD HH:MM:SS in Vietnam time
    vn = timezone(timedelta(hours=7))
    occurred_at_dt = datetime.strptime(payload.occurred_at, "%Y-%m-%d %H:%M:%S").replace(tzinfo=vn)
    tx = await create_transaction(
        db,
        user_id=payload.user_id,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        note=payload.note,
        occurred_at=occurred_at_dt,
    )
    # Format occurred_at back to requested VN string format for response
    return TransactionRead.model_validate({
        "id": tx.id,
        "user_id": tx.user_id,
        "amount": float(tx.amount),
        "type": tx.type,
        "category": tx.category,
        "note": tx.note,
        "occurred_at": datetime.strftime(occurred_at_dt, "%Y-%m-%d %H:%M:%S"),
        "created_at": tx.created_at,
    })


@router.get("/summary", response_model=SummaryResult)
async def get_summary_endpoint(
    user_id: str, 
    start: str, 
    end: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Parse start/end strict format in Vietnam time
    vn = timezone(timedelta(hours=7))
    start_dt = datetime.strptime(start, "%Y-%m-%d %H:%M:%S").replace(tzinfo=vn)
    end_dt = datetime.strptime(end, "%Y-%m-%d %H:%M:%S").replace(tzinfo=vn)

    income, expense, net = await get_summary(db, user_id=user_id, start=start_dt, end=end_dt)
    return SummaryResult(income=income, expense=expense, net=net)


