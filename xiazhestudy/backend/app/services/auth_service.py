"""
Supabase Auth Service

Provides authentication functionality using Supabase Auth.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from supabase import create_client, Client
import jwt
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.models.user import User


class AuthService:
    """Supabase Auth service for user authentication"""

    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        self.jwt_secret = settings.SUPABASE_JWT_SECRET

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify JWT token from Supabase Auth

        Args:
            token: JWT token from Authorization header

        Returns:
            Decoded token payload containing user info

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Decode and verify JWT
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    async def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from JWT token

        Args:
            token: JWT token

        Returns:
            User information from JWT payload
        """
        try:
            # Verify token and extract user info directly from payload
            # No need to call Supabase admin API since JWT is already verified
            payload = await self.verify_token(token)

            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {}),
                "created_at": payload.get("created_at")
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to get user: {str(e)}"
            )

    async def create_user(self, email: str, password: str, user_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Create a new user in Supabase Auth using sign_up method

        Args:
            email: User email
            password: User password
            user_metadata: Additional user metadata

        Returns:
            Created user information with session (if email confirmation disabled)
            or without session (if email confirmation required)
        """
        try:
            # Use sign_up instead of admin.create_user to avoid permission issues
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": user_metadata or {}
                }
            })

            if response and response.user:
                result = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata,
                    "email_confirmed": response.user.email_confirmed_at is not None
                }

                # If session exists, user can login immediately (email confirmation disabled)
                if response.session:
                    result["session"] = {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_in": response.session.expires_in
                    }

                return result

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="注册失败，请稍后重试"
            )
        except Exception as e:
            error_msg = str(e).lower()
            if "already registered" in error_msg or "already exists" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该邮箱已被注册"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"注册失败: {str(e)}"
            )

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in a user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            Session information including access token
        """
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if response and response.session:
                return {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_in": response.session.expires_in,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "user_metadata": response.user.user_metadata
                    }
                }
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Sign in failed: {str(e)}"
            )

    async def sign_out(self, token: str) -> Dict[str, str]:
        """
        Sign out a user

        Args:
            token: Access token

        Returns:
            Success message
        """
        try:
            # Supabase handles token invalidation automatically
            return {"message": "Successfully signed out"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sign out failed: {str(e)}"
            )

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token

        Returns:
            New session information
        """
        try:
            response = self.supabase.auth.refresh_session(refresh_token)

            if response and response.session:
                return {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_in": response.session.expires_in
                }
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh token"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token refresh failed: {str(e)}"
            )

    async def sync_google_user(
        self,
        db: AsyncSession,
        user_id: str,
        email: str,
        user_metadata: Dict[str, Any]
    ) -> User:
        """
        UPSERT logic for Google OAuth login:
        - If new user: Create with 500 credits, free plan, google provider
        - If existing user: Update avatar and username (only if currently empty)
        - Do NOT reset credits or subscription tier for existing users

        Args:
            db: Database session
            user_id: Supabase user ID (UUID)
            email: User email from Google
            user_metadata: User metadata from Supabase JWT

        Returns:
            User object (created or updated)
        """
        # Extract data from Google OAuth metadata
        avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture")
        full_name = user_metadata.get("full_name") or user_metadata.get("name", "")

        # Use email prefix as default username if no name provided
        default_username = full_name or email.split("@")[0]

        # Prepare INSERT statement with UPSERT logic
        stmt = insert(User).values(
            supabase_user_id=user_id,
            email=email,
            username=default_username,
            avatar_url=avatar_url,
            auth_provider="google",
            subscription_tier="free",
            points_balance=500,
            storage_used=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Define UPDATE logic for existing users (ON CONFLICT)
        # Only update non-sensitive fields, preserve credits and subscription
        do_update_stmt = stmt.on_conflict_do_update(
            index_elements=["supabase_user_id"],
            set_={
                "email": stmt.excluded.email,
                "avatar_url": stmt.excluded.avatar_url,
                # Update username only if currently empty
                "username": func.coalesce(User.username, stmt.excluded.username),
                "updated_at": datetime.utcnow()
                # NOTE: points_balance, subscription_tier, auth_provider are NOT updated
                # to preserve existing user's data
            }
        )

        # Execute UPSERT
        await db.execute(do_update_stmt)
        await db.commit()

        # Fetch and return the user
        result = await db.execute(
            select(User).where(User.supabase_user_id == user_id)
        )
        user = result.scalar_one()
        return user


# Global auth service instance
auth_service = AuthService()
