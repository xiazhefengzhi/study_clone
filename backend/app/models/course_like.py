"""
Course Like Model - 课程/动画点赞记录
"""
from datetime import datetime
from sqlalchemy import DateTime, Index, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class CourseLike(Base):
    """
    课程点赞记录模型

    用途：
    - 记录用户对课程/动画的点赞
    - 防止重复点赞
    - 统计点赞数据

    特点：
    - 联合主键（user_id + course_id）
    - 一个用户只能对一个课程点赞一次
    """

    __tablename__ = "course_likes"

    # 联合主键
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        comment="点赞用户ID"
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
        comment="被点赞的课程ID"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        comment="点赞时间"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="course_likes")
    course: Mapped["Course"] = relationship("Course", back_populates="likes")

    # Indexes
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "course_id"),
        Index("idx_course_like_user", "user_id"),
        Index("idx_course_like_course", "course_id"),
        Index("idx_course_like_created", "created_at"),
        {"comment": "课程点赞记录表，防止重复点赞"}
    )

    def __repr__(self):
        return (
            f"<CourseLike(user_id={self.user_id}, "
            f"course_id={self.course_id})>"
        )
