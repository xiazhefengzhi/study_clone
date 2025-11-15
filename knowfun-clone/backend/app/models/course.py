"""
Course Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, Boolean, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Course(Base):
    """Course/Lesson model"""

    __tablename__ = "courses"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Course Info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Style and Configuration
    style: Mapped[str] = mapped_column(String(50), default="standard", nullable=False)
    # standard, humorous, serious, academic, etc.
    difficulty: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    # easy, medium, hard
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # 教学类, 历史类, 科学类, etc.

    # Content
    content: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Structured course content

    # Statistics
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Visibility
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Processing Status
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    # draft, generating, published, failed

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="courses")
    document: Mapped[Optional["Document"]] = relationship("Document", back_populates="courses")
    export_tasks: Mapped[List["ExportTask"]] = relationship("ExportTask", back_populates="course", cascade="all, delete-orphan")
    post: Mapped[Optional["Post"]] = relationship("Post", back_populates="course", uselist=False)

    # Indexes
    __table_args__ = (
        Index("idx_course_user", "user_id"),
        Index("idx_course_document", "document_id"),
        Index("idx_course_status", "status"),
        Index("idx_course_public", "is_public"),
        Index("idx_course_category", "category"),
        Index("idx_course_created", "created_at"),
    )

    def __repr__(self):
        return f"<Course(id={self.id}, title={self.title}, status={self.status})>"
