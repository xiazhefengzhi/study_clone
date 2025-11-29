"""
Activation Code Model - 激活码模型
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class ActivationCode(Base):
    """
    激活码表 - 用于会员订阅激活

    套餐类型:
    - basic: Basic版 (1500积分/月)
    - plus: Plus版 (5000积分/月)
    - pro: Pro版 (100000积分/月)
    """

    __tablename__ = "activation_codes"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # 激活码 (唯一)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # 套餐类型: basic, plus, pro
    tier: Mapped[str] = mapped_column(String(20), nullable=False)

    # 赠送积分数量
    points_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # 有效期天数 (会员时长)
    duration_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    # 是否已使用
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 使用者ID
    used_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # 使用时间
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # 过期时间 (激活码本身的过期时间，非会员有效期)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # 备注
    note: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # 创建时间
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    used_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[used_by_id])

    # Indexes
    __table_args__ = (
        Index("idx_activation_code", "code"),
        Index("idx_activation_tier", "tier"),
        Index("idx_activation_used", "is_used"),
    )

    def __repr__(self):
        return f"<ActivationCode(code={self.code}, tier={self.tier}, is_used={self.is_used})>"
