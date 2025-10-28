from __future__ import annotations

from typing import List
import uuid

from sqlalchemy import select, String
from sqlalchemy.ext.asyncio import AsyncSession

# Placeholder ORM model for demonstration; replace with real model later
from sqlalchemy.orm import registry, mapped_column, Mapped

mapper_registry = registry()


@mapper_registry.mapped
class User:
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str]
    full_name: Mapped[str | None]
    password_hash: Mapped[str]


async def list_users(session: AsyncSession) -> List[User]:
    res = await session.execute(select(User))
    return list(res.scalars().all())


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    res = await session.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()


async def create_user(session: AsyncSession, email: str, full_name: str | None, password_hash: str) -> User:
    user = User(email=email, full_name=full_name, password_hash=password_hash)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user





