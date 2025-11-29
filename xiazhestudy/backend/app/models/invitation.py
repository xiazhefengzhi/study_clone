"""
Invitation Model - 邀请记录（防作弊机制）
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class Invitation(Base):
    """
    邀请记录模型 - 用于防作弊统计

    状态流转：
    1. PENDING - 注册成功但未验证邮箱
    2. COMPLETED - 验证邮箱，奖励已发放
    3. IGNORED - 超过每日上限，不发奖励

    防作弊机制：
    - 邀请人每日上限 5 人
    - 必须验证邮箱才发放奖励
    - IP 限制
    - 设备指纹检测
    """

    __tablename__ = "invitations"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Keys
    inviter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="邀请人ID"
    )

    invitee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
        comment="被邀请人ID（一个用户只能被邀请一次）"
    )

    # 状态：PENDING / COMPLETED / IGNORED
    status: Mapped[str] = mapped_column(
        String(20),
        default="PENDING",
        nullable=False,
        index=True,
        comment="邀请状态"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="邀请创建时间（注册时间）"
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="邀请完成时间（验证邮箱时间）"
    )

    # Relationships
    inviter: Mapped["User"] = relationship(
        "User",
        foreign_keys=[inviter_id],
        back_populates="invitations_sent"
    )

    invitee: Mapped["User"] = relationship(
        "User",
        foreign_keys=[invitee_id],
        back_populates="invitation_received"
    )

    # Indexes
    __table_args__ = (
        Index("idx_invitation_inviter", "inviter_id"),
        Index("idx_invitation_invitee", "invitee_id"),
        Index("idx_invitation_status", "status"),
        Index("idx_invitation_created", "created_at"),
        Index("idx_invitation_inviter_created", "inviter_id", "created_at"),
        Index("idx_invitation_inviter_status", "inviter_id", "status"),
        {"comment": "邀请记录表，用于邀请奖励和防作弊"}
    )

    def __repr__(self):
        return (
            f"<Invitation(id={self.id}, "
            f"inviter_id={self.inviter_id}, "
            f"invitee_id={self.invitee_id}, "
            f"status={self.status})>"
        )
