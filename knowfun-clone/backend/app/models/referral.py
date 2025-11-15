"""
Referral Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Referral(Base):
    """Referral model for referral reward system"""

    __tablename__ = "referrals"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Keys
    referrer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # User who sent the referral
    referee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # User who was referred (null if not registered yet)

    # Referral Code
    referral_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    # Unique code for each referrer

    # Reward Info
    reward_points: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    # Points awarded for successful referral
    reward_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending, completed, expired, cancelled

    # Tracking
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Whether the referred user completed registration
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Referral code expiration

    # Indexes
    __table_args__ = (
        Index("idx_referral_referrer", "referrer_id"),
        Index("idx_referral_referee", "referee_id"),
        Index("idx_referral_code", "referral_code"),
        Index("idx_referral_status", "reward_status"),
        Index("idx_referral_completed", "is_completed"),
        Index("idx_referral_created", "created_at"),
    )

    def __repr__(self):
        return f"<Referral(id={self.id}, code={self.referral_code}, status={self.reward_status})>"
