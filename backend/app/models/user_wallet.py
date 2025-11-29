"""
User Wallet Model - 用户积分钱包（双账户模型）
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, DateTime, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class UserWallet(Base):
    """
    用户钱包模型 - 双账户积分系统

    永久积分（Permanent Credits）：
    - 来源：注册赠送、邀请奖励
    - 特点：永不过期，可无限积累

    订阅积分（Subscription Credits）：
    - 来源：月付套餐
    - 特点：按月清零，每月重置为套餐额度
    """

    __tablename__ = "user_wallets"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # 永久积分（注册赠送、邀请奖励）- 永不过期
    permanent_balance: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="永久积分余额，永不过期"
    )

    # 订阅积分（月付套餐）- 每月重置
    subscription_balance: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="订阅积分余额，每月重置"
    )

    # 记录订阅周期结束时间（用于前端展示"xx积分将于...过期"）
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="订阅积分过期时间"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="wallet")

    # Indexes
    __table_args__ = (
        Index("idx_wallet_user", "user_id"),
        # 添加 CHECK 约束确保积分不为负
        {"comment": "用户钱包表，实现双账户积分模型"}
    )

    @property
    def total_balance(self) -> int:
        """总积分余额"""
        return self.permanent_balance + self.subscription_balance

    @property
    def can_generate_count(self) -> int:
        """可生成次数（每次消耗100积分）"""
        return self.total_balance // 100

    def __repr__(self):
        return (
            f"<UserWallet(user_id={self.user_id}, "
            f"permanent={self.permanent_balance}, "
            f"subscription={self.subscription_balance}, "
            f"total={self.total_balance})>"
        )
