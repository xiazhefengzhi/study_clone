"""
Post Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, Boolean, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Post(Base):
    """Post model for content square/social features"""

    __tablename__ = "posts"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)

    # Post Content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Post Type
    post_type: Mapped[str] = mapped_column(String(20), default="article", nullable=False)
    # article, course_share, question, discussion

    # Tags and Category
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    # ["Python", "AI", "Machine Learning"]
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # 教学类, 历史类, 科学类, etc.

    # Engagement Statistics
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shares_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Visibility and Status
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)
    # draft, published, archived, deleted

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="posts")
    course: Mapped[Optional["Course"]] = relationship("Course", back_populates="post")

    # Indexes
    __table_args__ = (
        Index("idx_post_user", "user_id"),
        Index("idx_post_course", "course_id"),
        Index("idx_post_status", "status"),
        Index("idx_post_public", "is_public"),
        Index("idx_post_featured", "is_featured"),
        Index("idx_post_category", "category"),
        Index("idx_post_type", "post_type"),
        Index("idx_post_created", "created_at"),
        Index("idx_post_published", "published_at"),
    )

    def __repr__(self):
        return f"<Post(id={self.id}, title={self.title}, status={self.status})>"
