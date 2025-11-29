"""
Message Model - 站内信系统
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Boolean, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Message(Base):
    """
    站内信模型

    用途：
    - 动画生成完成通知
    - 系统消息通知
    - 邀请奖励通知
    - 订阅续费通知等

    消息类型：
    - system: 系统消息
    - animation_success: 动画生成成功
    - animation_failed: 动画生成失败
    - credits_reward: 积分奖励
    - subscription: 订阅相关
    """

    __tablename__ = "messages"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="接收消息的用户ID"
    )

    # 消息内容
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="消息标题"
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="消息内容"
    )

    # 消息类型
    message_type: Mapped[str] = mapped_column(
        String(50),
        default="system",
        nullable=False,
        index=True,
        comment="消息类型"
    )

    # 已读状态
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="是否已读"
    )

    # 关联信息（可选）
    related_course_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="关联的课程/动画ID，方便点击跳转"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="阅读时间"
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="messages")

    # Indexes
    __table_args__ = (
        Index("idx_message_user", "user_id"),
        Index("idx_message_is_read", "is_read"),
        Index("idx_message_type", "message_type"),
        Index("idx_message_created", "created_at"),
        Index("idx_message_user_unread", "user_id", "is_read"),
        {"comment": "站内信表，用于系统通知和消息推送"}
    )

    def mark_as_read(self):
        """标记为已读"""
        self.is_read = True
        self.read_at = datetime.utcnow()

    def __repr__(self):
        return (
            f"<Message(id={self.id}, user_id={self.user_id}, "
            f"type={self.message_type}, is_read={self.is_read})>"
        )
