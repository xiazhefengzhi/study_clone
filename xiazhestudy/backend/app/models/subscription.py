"""
Subscription Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Numeric, ForeignKey, Index, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Subscription(Base):
    """Subscription model for subscription tier and payment tracking"""

    __tablename__ = "subscriptions"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Subscription Info
    tier: Mapped[str] = mapped_column(String(20), nullable=False)
    # free, basic, plus, pro
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # active, cancelled, expired, past_due

    # Payment Info
    payment_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # stripe, paypal, alipay, wechat_pay
    payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # External payment provider's transaction ID
    amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    # Payment amount
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    # USD, CNY, EUR

    # Billing Period
    billing_cycle: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)
    # monthly, yearly, lifetime
    current_period_start: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    current_period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Auto Renewal
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Benefits Tracking
    credits_granted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Monthly credits/points granted with this subscription
    storage_quota: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Storage quota in bytes

    # Extra Data
    extra_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Additional subscription data (coupon codes, trial info, etc.)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Indexes
    __table_args__ = (
        Index("idx_subscription_user", "user_id"),
        Index("idx_subscription_tier", "tier"),
        Index("idx_subscription_status", "status"),
        Index("idx_subscription_payment_id", "payment_id"),
        Index("idx_subscription_period_end", "current_period_end"),
        Index("idx_subscription_user_status", "user_id", "status"),
    )

    def __repr__(self):
        return f"<Subscription(id={self.id}, user_id={self.user_id}, tier={self.tier}, status={self.status})>"
