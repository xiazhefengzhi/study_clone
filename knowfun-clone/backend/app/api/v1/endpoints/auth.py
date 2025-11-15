"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.services.auth_service import auth_service
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest
)


router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user

    Creates user in Supabase Auth and local database
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user in Supabase Auth
    supabase_user = await auth_service.create_user(
        email=user_data.email,
        password=user_data.password,
        user_metadata={"username": user_data.username}
    )

    # Create user in local database
    db_user = User(
        supabase_user_id=supabase_user["id"],
        email=user_data.email,
        username=user_data.username,
        subscription_tier="free",
        points_balance=500,  # Free tier starts with 500 points
        storage_used=0
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Sign in to get tokens
    session = await auth_service.sign_in(user_data.email, user_data.password)

    return TokenResponse(
        access_token=session["access_token"],
        refresh_token=session["refresh_token"],
        expires_in=session["expires_in"],
        user=UserResponse.model_validate(db_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password

    Returns access token and user information
    """
    # Sign in with Supabase Auth
    session = await auth_service.sign_in(
        email=credentials.email,
        password=credentials.password
    )

    # Get user from database
    result = await db.execute(
        select(User).where(User.supabase_user_id == session["user"]["id"])
    )
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )

    return TokenResponse(
        access_token=session["access_token"],
        refresh_token=session["refresh_token"],
        expires_in=session["expires_in"],
        user=UserResponse.model_validate(db_user)
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user

    Invalidates the current session
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=dict)
async def refresh_token(
    refresh_data: RefreshTokenRequest
):
    """
    Refresh access token

    Uses refresh token to get new access token
    """
    session = await auth_service.refresh_token(refresh_data.refresh_token)

    return {
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
        "expires_in": session["expires_in"]
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information

    Returns authenticated user's profile
    """
    return UserResponse.model_validate(current_user)
