"""
User Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class User(Base):
    """User model for PostgreSQL"""

    __tablename__ = "users"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Supabase Auth ID (from auth.users)
    supabase_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Basic Info
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(20), default="email", nullable=False, comment="Authentication provider: email, google, etc.")

    # Subscription
    subscription_tier: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    # free, basic, plus, pro
    points_balance: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    storage_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in bytes

    # Referral System（邀请系统）
    referral_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
        index=True,
        comment="用户的邀请码"
    )
    referred_by_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="谁邀请了我（邀请人ID）"
    )

    # Stripe Integration（Stripe集成）
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
        comment="Stripe客户ID"
    )
    current_plan_id: Mapped[str] = mapped_column(
        String(50),
        default="free",
        nullable=False,
        comment="当前套餐ID"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    courses: Mapped[List["Course"]] = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    export_tasks: Mapped[List["ExportTask"]] = relationship("ExportTask", back_populates="user", cascade="all, delete-orphan")
    posts: Mapped[List["Post"]] = relationship("Post", back_populates="user", cascade="all, delete-orphan")

    # Credit System Relationships（积分系统关系）
    wallet: Mapped[Optional["UserWallet"]] = relationship(
        "UserWallet",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    credit_transactions: Mapped[List["CreditTransaction"]] = relationship(
        "CreditTransaction",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Invitation Relationships（邀请关系）
    invitations_sent: Mapped[List["Invitation"]] = relationship(
        "Invitation",
        foreign_keys="Invitation.inviter_id",
        back_populates="inviter",
        cascade="all, delete-orphan"
    )
    invitation_received: Mapped[Optional["Invitation"]] = relationship(
        "Invitation",
        foreign_keys="Invitation.invitee_id",
        back_populates="invitee",
        uselist=False
    )

    # Messages Relationship（站内信关系）
    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Course Likes Relationship（课程点赞关系）
    course_likes: Mapped[List["CourseLike"]] = relationship(
        "CourseLike",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_supabase_id", "supabase_user_id"),
        Index("idx_user_subscription", "subscription_tier"),
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
