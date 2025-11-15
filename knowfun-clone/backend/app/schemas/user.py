"""
User Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Base schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=100)


# Request schemas
class UserRegister(UserBase):
    """User registration schema"""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    username: Optional[str] = Field(None, min_length=2, max_length=100)
    avatar_url: Optional[str] = None


# Response schemas
class UserResponse(UserBase):
    """User response schema"""
    id: int
    supabase_user_id: str
    avatar_url: Optional[str] = None
    subscription_tier: str
    points_balance: int
    storage_used: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """Extended user profile with subscription details"""
    documents_count: Optional[int] = 0
    courses_count: Optional[int] = 0
    storage_limit: Optional[int] = 5368709120  # 5GB default for free tier


# Auth response schemas
class TokenResponse(BaseModel):
    """Auth token response"""
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str
