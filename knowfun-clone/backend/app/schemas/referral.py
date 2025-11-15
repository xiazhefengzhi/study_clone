"""
Referral Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request schemas
class ReferralCreate(BaseModel):
    """Referral code generation schema"""
    expires_days: Optional[int] = Field(default=30, description="Referral code expiration in days")


class ReferralUse(BaseModel):
    """Use referral code schema"""
    referral_code: str = Field(..., description="Referral code to use")


# Response schemas
class ReferralResponse(BaseModel):
    """Referral response schema"""
    id: int
    referrer_id: int
    referee_id: Optional[int] = None
    referral_code: str
    reward_points: int
    reward_status: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None

    # Optional user info
    referrer_username: Optional[str] = None
    referee_username: Optional[str] = None

    class Config:
        from_attributes = True


class ReferralListResponse(BaseModel):
    """Referral list response with pagination"""
    referrals: list[ReferralResponse]
    total: int
    page: int
    page_size: int


class ReferralStatsResponse(BaseModel):
    """Referral statistics"""
    total_referrals: int
    completed_referrals: int
    pending_referrals: int
    total_points_earned: int
    active_referral_code: Optional[str] = None
