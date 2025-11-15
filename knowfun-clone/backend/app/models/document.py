"""
Document Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Document(Base):
    """Document model for file uploads"""

    __tablename__ = "documents"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Key to User
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Document Info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, ppt, docx, txt
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # in bytes

    # Processing Status
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending, processing, success, failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="documents")
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="document", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("idx_document_user", "user_id"),
        Index("idx_document_status", "status"),
        Index("idx_document_created", "created_at"),
        Index("idx_document_user_status", "user_id", "status"),
    )

    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, status={self.status})>"
