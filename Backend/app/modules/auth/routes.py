from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.schemas import LoginRequest, RegisterRequest, LoginResponse, TokenResponse, UserProfile
from app.modules.auth.service import authenticate_user, hash_password, check_user_exists
from app.modules.auth.middleware import get_current_user
from app.modules.users.service import create_user, User
from app.utils.security import create_access_token
from app.utils.responses import success

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login user with email and password"""
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(days=7)  # Use JWT_EXPIRES_IN from settings
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.post("/register", response_model=LoginResponse)
async def register(
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
    # Check if user already exists
    user_exists = await check_user_exists(db, register_data.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with hashed password
    hashed_password = hash_password(register_data.password)
    user = await create_user(db, register_data.email, register_data.full_name, hashed_password)
    
    # Create access token
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_user)
):
    """Refresh access token"""
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        subject=current_user.email, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return success("Successfully logged out")
