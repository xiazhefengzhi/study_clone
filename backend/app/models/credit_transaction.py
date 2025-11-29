"""
Credit Transaction Model - 积分交易记录（流水表）
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.supabase_db import Base


class CreditTransaction(Base):
    """
    积分交易记录模型 - 财务系统核心

    重要性：
    - 任何积分变动必须插入一条记录
    - 用于财务审计和对账
    - 记录完整的余额快照

    交易类型：
    - SIGNUP_BONUS: Free版注册赠送
    - INVITE_REWARD_INVITER: 邀请人奖励
    - INVITE_REWARD_INVITEE: 被邀请人奖励
    - SUBSCRIPTION_RESET: 订阅重置/扣除旧余额
    - SUBSCRIPTION_GRANT: 订阅发放新余额
    - SUBSCRIPTION_UPGRADE: 订阅升级
    - USAGE_ANIMATION: 生成动画消耗

    资金来源：
    - PERMANENT: 仅永久积分
    - SUBSCRIPTION: 仅订阅积分
    - MIXED: 混合（订阅+永久）
    """

    __tablename__ = "credit_transactions"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 变动金额（正数=获取，负数=消耗）
    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="积分变动金额，正数为获取，负数为消耗"
    )

    # 交易类型
    transaction_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="交易类型"
    )

    # 资金来源/去向（用于分析消耗结构）
    balance_source: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="资金来源：PERMANENT/SUBSCRIPTION/MIXED"
    )

    # 变动后的余额快照（方便快速对账）
    snapshot_permanent: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="变动后永久积分余额快照"
    )

    snapshot_subscription: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="变动后订阅积分余额快照"
    )

    # 备注信息
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="交易描述"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="credit_transactions")

    # Indexes
    __table_args__ = (
        Index("idx_trans_user", "user_id"),
        Index("idx_trans_type", "transaction_type"),
        Index("idx_trans_created", "created_at"),
        Index("idx_trans_user_created", "user_id", "created_at"),
        {"comment": "积分交易记录表，记录所有积分变动"}
    )

    @property
    def snapshot_total(self) -> Optional[int]:
        """快照总余额"""
        if self.snapshot_permanent is not None and self.snapshot_subscription is not None:
            return self.snapshot_permanent + self.snapshot_subscription
        return None

    def __repr__(self):
        return (
            f"<CreditTransaction(id={self.id}, user_id={self.user_id}, "
            f"amount={self.amount}, type={self.transaction_type})>"
        )
