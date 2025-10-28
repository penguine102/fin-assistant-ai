import bcrypt
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.service import User, get_user_by_email


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


async def authenticate_user(session: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    user = await get_user_by_email(session, email)
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


async def check_user_exists(session: AsyncSession, email: str) -> bool:
    """Check if user exists by email"""
    user = await get_user_by_email(session, email)
    return user is not None
