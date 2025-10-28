from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.users.schemas import UserCreate, UserRead
from app.modules.users.service import create_user, get_user_by_email, list_users
from app.modules.auth.service import hash_password
from app.utils.responses import success


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
async def get_users(db: AsyncSession = Depends(get_db)):
    users = await list_users(db)
    return [UserRead.model_validate(u) for u in users]


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    # Hash password before storing
    hashed_password = hash_password(payload.password)
    user = await create_user(db, payload.email, payload.full_name, hashed_password)
    return UserRead.model_validate(user)





