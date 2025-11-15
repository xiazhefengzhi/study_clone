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

    # Subscription
    subscription_tier: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    # free, basic, plus, pro
    points_balance: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    storage_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in bytes

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

    # Indexes
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_supabase_id", "supabase_user_id"),
        Index("idx_user_subscription", "subscription_tier"),
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
