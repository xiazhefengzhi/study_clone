"""
Export Task Model - PostgreSQL/SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class ExportTask(Base):
    """Export task model for PPT/Video generation"""

    __tablename__ = "export_tasks"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Export Info
    export_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # html, ppt, video, pdf
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending, processing, completed, failed
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Export Configuration
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Style, resolution, duration, etc.

    # Processing Info
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # 0-100 percentage
    estimated_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # in seconds

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="export_tasks")
    course: Mapped["Course"] = relationship("Course", back_populates="export_tasks")

    # Indexes
    __table_args__ = (
        Index("idx_export_user", "user_id"),
        Index("idx_export_course", "course_id"),
        Index("idx_export_status", "status"),
        Index("idx_export_type", "export_type"),
        Index("idx_export_created", "created_at"),
        Index("idx_export_user_status", "user_id", "status"),
    )

    def __repr__(self):
        return f"<ExportTask(id={self.id}, type={self.export_type}, status={self.status})>"
