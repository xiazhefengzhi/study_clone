"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.services.auth_service import auth_service
from app.services.credit_service import credit_service
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RegisterResponse,
    RefreshTokenRequest
)


router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user

    Creates user in Supabase Auth and local database.
    If email confirmation is required, returns message to check email.
    If email confirmation is disabled, returns tokens directly.
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
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

    # Check if session was returned (email confirmation disabled)
    if "session" in supabase_user and supabase_user["session"]:
        session = supabase_user["session"]
        return RegisterResponse(
            message="注册成功",
            requires_email_verification=False,
            access_token=session["access_token"],
            refresh_token=session["refresh_token"],
            expires_in=session["expires_in"],
            user=UserResponse.model_validate(db_user)
        )
    else:
        # Email confirmation required
        return RegisterResponse(
            message="注册成功！请查收验证邮件，点击链接完成验证后即可登录。",
            requires_email_verification=True
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

    # 从钱包获取真实积分余额
    wallet_balance = await credit_service.get_balance(db, db_user.id)
    user_response = UserResponse.model_validate(db_user)
    user_response.points_balance = wallet_balance["total_balance"]

    return TokenResponse(
        access_token=session["access_token"],
        refresh_token=session["refresh_token"],
        expires_in=session["expires_in"],
        user=user_response
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user information

    Returns authenticated user's profile with real wallet balance
    """
    # 从钱包获取真实积分余额
    wallet_balance = await credit_service.get_balance(db, current_user.id)

    # 构建响应，使用钱包的真实余额
    user_data = UserResponse.model_validate(current_user)
    user_data.points_balance = wallet_balance["total_balance"]

    return user_data


@router.post("/sync-profile", response_model=UserResponse)
async def sync_google_profile(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Sync Google OAuth user profile to local database

    Called by frontend after successful Supabase OAuth login.
    Uses UPSERT logic to handle both new registrations and existing logins.
    Verifies Supabase JWT and extracts user data from token payload.

    Security:
    - Validates JWT signature using Supabase secret
    - Extracts user_id from token (sub claim)
    - Does not trust client-provided user_id

    Returns:
        User profile data with real wallet balance
    """
    try:
        # Decode and verify Supabase JWT
        payload = jwt.decode(
            token.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token payload: missing user_id or email"
            )

        # UPSERT user to local database
        user = await auth_service.sync_google_user(
            db=db,
            user_id=user_id,
            email=email,
            user_metadata=user_metadata
        )

        # 从钱包获取真实积分余额
        wallet_balance = await credit_service.get_balance(db, user.id)
        user_response = UserResponse.model_validate(user)
        user_response.points_balance = wallet_balance["total_balance"]

        return user_response

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile sync failed: {str(e)}"
        )
