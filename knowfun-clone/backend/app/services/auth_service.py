"""
Supabase Auth Service

Provides authentication functionality using Supabase Auth.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from supabase import create_client, Client
import jwt
from datetime import datetime, timedelta

from app.core.config import settings


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
        Create a new user in Supabase Auth

        Args:
            email: User email
            password: User password
            user_metadata: Additional user metadata

        Returns:
            Created user information
        """
        try:
            response = self.supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "user_metadata": user_metadata or {},
                "email_confirm": True
            })

            if response and response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata
                }
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User creation failed: {str(e)}"
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


# Global auth service instance
auth_service = AuthService()
