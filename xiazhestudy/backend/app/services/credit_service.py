"""
Credit Service - 积分系统核心业务逻辑

实现功能：
1. 积分扣除（带行锁防并发）
2. 积分查询
3. 交易记录查询
4. 邀请奖励发放

关键特性：
- 数据库行锁（SELECT FOR UPDATE）防止并发扣款
- 完整的流水记录
- 双账户模型（永久积分 + 订阅积分）
- 邀请防刷机制（每日上限 5 人）
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user_wallet import UserWallet
from app.models.credit_transaction import CreditTransaction
from app.models.invitation import Invitation


# 常量配置
ANIMATION_COST = 100  # 每次生成动画消耗积分
INVITE_REWARD_INVITER = 500  # 邀请人奖励
INVITE_REWARD_INVITEE = 100  # 被邀请人奖励
DAILY_INVITE_CAP = 5  # 每日邀请上限


class CreditService:
    """积分服务"""

    @staticmethod
    async def get_or_create_wallet(
        db: AsyncSession,
        user_id: int
    ) -> UserWallet:
        """
        获取或创建用户钱包

        Args:
            db: 数据库会话
            user_id: 用户ID

        Returns:
            UserWallet: 用户钱包对象
        """
        # 查询是否已有钱包
        result = await db.execute(
            select(UserWallet).where(UserWallet.user_id == user_id)
        )
        wallet = result.scalar_one_or_none()

        # 如果没有钱包，创建一个（注册赠送 500 永久积分）
        if not wallet:
            wallet = UserWallet(
                user_id=user_id,
                permanent_balance=500,  # 注册赠送 500 永久积分
                subscription_balance=0
            )
            db.add(wallet)

            # 记录注册赠送流水
            transaction = CreditTransaction(
                user_id=user_id,
                amount=500,
                transaction_type="SIGNUP_BONUS",
                balance_source="PERMANENT",
                snapshot_permanent=500,
                snapshot_subscription=0,
                description="注册赠送积分"
            )
            db.add(transaction)
            await db.commit()
            await db.refresh(wallet)

        return wallet

    @staticmethod
    async def consume_credits(
        db: AsyncSession,
        user_id: int,
        amount: int = ANIMATION_COST,
        description: str = "生成动画讲解"
    ) -> Dict:
        """
        扣除用户积分（优先扣订阅积分）

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 消耗积分数量
            description: 消耗描述

        Returns:
            dict: 扣除结果

        Raises:
            HTTPException: 积分不足时抛出 402 错误
        """
        # 1. 加行锁查询钱包（防止并发扣款）
        query = select(UserWallet).where(
            UserWallet.user_id == user_id
        ).with_for_update()

        result = await db.execute(query)
        wallet = result.scalar_one_or_none()

        if not wallet:
            # 如果没有钱包，创建一个
            wallet = await CreditService.get_or_create_wallet(db, user_id)

        # 2. 检查总余额
        total_balance = wallet.permanent_balance + wallet.subscription_balance

        if total_balance < amount:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "insufficient_credits",
                    "message": "积分不足，请升级套餐或邀请好友",
                    "required": amount,
                    "available": total_balance,
                    "permanent": wallet.permanent_balance,
                    "subscription": wallet.subscription_balance
                }
            )

        # 3. 扣款逻辑（优先扣订阅积分）
        deduct_subscription = 0
        deduct_permanent = 0

        if wallet.subscription_balance >= amount:
            # 订阅积分足够，全扣订阅
            deduct_subscription = amount
            wallet.subscription_balance -= amount
            balance_source = "SUBSCRIPTION"
        else:
            # 订阅积分不够，先扣光订阅，剩下扣永久
            deduct_subscription = wallet.subscription_balance
            remaining = amount - deduct_subscription

            wallet.subscription_balance = 0
            wallet.permanent_balance -= remaining
            deduct_permanent = remaining

            balance_source = "MIXED" if deduct_subscription > 0 else "PERMANENT"

        wallet.updated_at = datetime.utcnow()

        # 4. 记录流水
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,
            transaction_type="USAGE_ANIMATION",
            balance_source=balance_source,
            snapshot_permanent=wallet.permanent_balance,
            snapshot_subscription=wallet.subscription_balance,
            description=description
        )

        db.add(transaction)
        await db.commit()
        await db.refresh(wallet)

        # 5. 返回结果
        return {
            "success": True,
            "deducted": {
                "subscription": deduct_subscription,
                "permanent": deduct_permanent,
                "total": amount
            },
            "remaining": {
                "permanent": wallet.permanent_balance,
                "subscription": wallet.subscription_balance,
                "total": wallet.permanent_balance + wallet.subscription_balance
            }
        }

    @staticmethod
    async def add_credits(
        db: AsyncSession,
        user_id: int,
        amount: int,
        transaction_type: str = "REFUND",
        description: str = "积分退还"
    ) -> Dict:
        """
        增加用户积分（用于退款、奖励等）

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 增加的积分数量
            transaction_type: 交易类型
            description: 交易描述

        Returns:
            dict: 增加结果
        """
        # 加行锁查询钱包
        query = select(UserWallet).where(
            UserWallet.user_id == user_id
        ).with_for_update()

        result = await db.execute(query)
        wallet = result.scalar_one_or_none()

        if not wallet:
            wallet = await CreditService.get_or_create_wallet(db, user_id)

        # 退还到永久积分
        wallet.permanent_balance += amount
        wallet.updated_at = datetime.utcnow()

        # 记录流水
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,  # 正数表示增加
            transaction_type=transaction_type,
            balance_source="PERMANENT",
            snapshot_permanent=wallet.permanent_balance,
            snapshot_subscription=wallet.subscription_balance,
            description=description
        )

        db.add(transaction)
        await db.commit()
        await db.refresh(wallet)

        return {
            "success": True,
            "added": amount,
            "remaining": {
                "permanent": wallet.permanent_balance,
                "subscription": wallet.subscription_balance,
                "total": wallet.permanent_balance + wallet.subscription_balance
            }
        }

    @staticmethod
    async def get_balance(
        db: AsyncSession,
        user_id: int
    ) -> Dict:
        """
        查询用户积分余额

        Args:
            db: 数据库会话
            user_id: 用户ID

        Returns:
            dict: 余额信息
        """
        wallet = await CreditService.get_or_create_wallet(db, user_id)

        return {
            "permanent_balance": wallet.permanent_balance,
            "subscription_balance": wallet.subscription_balance,
            "total_balance": wallet.total_balance,
            "can_generate": wallet.can_generate_count,
            "subscription_expires_at": wallet.subscription_expires_at.isoformat() if wallet.subscription_expires_at else None
        }

    @staticmethod
    async def get_transactions(
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        limit: int = 20
    ) -> Dict:
        """
        获取积分交易记录

        Args:
            db: 数据库会话
            user_id: 用户ID
            page: 页码
            limit: 每页数量

        Returns:
            dict: 交易记录列表
        """
        # 获取总数
        count_query = select(func.count()).select_from(CreditTransaction).where(
            CreditTransaction.user_id == user_id
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 获取交易记录
        offset = (page - 1) * limit
        query = select(CreditTransaction).where(
            CreditTransaction.user_id == user_id
        ).order_by(
            CreditTransaction.created_at.desc()
        ).offset(offset).limit(limit)

        result = await db.execute(query)
        transactions = result.scalars().all()

        return {
            "transactions": [
                {
                    "id": t.id,
                    "amount": t.amount,
                    "type": t.transaction_type,
                    "balance_source": t.balance_source,
                    "description": t.description,
                    "snapshot_permanent": t.snapshot_permanent,
                    "snapshot_subscription": t.snapshot_subscription,
                    "snapshot_total": t.snapshot_total,
                    "created_at": t.created_at.isoformat()
                }
                for t in transactions
            ],
            "total": total,
            "page": page,
            "limit": limit
        }

    @staticmethod
    async def process_invitation_reward(
        db: AsyncSession,
        invitee_id: int
    ) -> Dict:
        """
        处理邀请奖励（邮箱验证触发）

        Args:
            db: 数据库会话
            invitee_id: 被邀请人ID

        Returns:
            dict: 奖励发放结果
        """
        # 1. 查找邀请记录
        invitation_result = await db.execute(
            select(Invitation).where(
                Invitation.invitee_id == invitee_id,
                Invitation.status == "PENDING"
            )
        )
        invitation = invitation_result.scalar_one_or_none()

        if not invitation:
            return {"status": "no_invitation"}

        # 2. 给被邀请人发放奖励（100 永久积分）
        invitee_wallet_result = await db.execute(
            select(UserWallet).where(
                UserWallet.user_id == invitee_id
            ).with_for_update()
        )
        invitee_wallet = invitee_wallet_result.scalar_one_or_none()

        if not invitee_wallet:
            invitee_wallet = await CreditService.get_or_create_wallet(db, invitee_id)

        invitee_wallet.permanent_balance += INVITE_REWARD_INVITEE

        invitee_transaction = CreditTransaction(
            user_id=invitee_id,
            amount=INVITE_REWARD_INVITEE,
            transaction_type="INVITE_REWARD_INVITEE",
            balance_source="PERMANENT",
            snapshot_permanent=invitee_wallet.permanent_balance,
            snapshot_subscription=invitee_wallet.subscription_balance,
            description="被邀请人奖励"
        )
        db.add(invitee_transaction)

        # 3. 检查邀请人今日奖励次数
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        count_result = await db.execute(
            select(func.count()).where(
                Invitation.inviter_id == invitation.inviter_id,
                Invitation.status == "COMPLETED",
                Invitation.completed_at >= today_start
            )
        )
        today_count = count_result.scalar()

        # 4. 判断是否给邀请人发奖励
        inviter_rewarded = False
        if today_count < DAILY_INVITE_CAP:
            # 未达到每日上限，发放奖励
            inviter_wallet_result = await db.execute(
                select(UserWallet).where(
                    UserWallet.user_id == invitation.inviter_id
                ).with_for_update()
            )
            inviter_wallet = inviter_wallet_result.scalar_one_or_none()

            if not inviter_wallet:
                inviter_wallet = await CreditService.get_or_create_wallet(db, invitation.inviter_id)

            inviter_wallet.permanent_balance += INVITE_REWARD_INVITER

            inviter_transaction = CreditTransaction(
                user_id=invitation.inviter_id,
                amount=INVITE_REWARD_INVITER,
                transaction_type="INVITE_REWARD_INVITER",
                balance_source="PERMANENT",
                snapshot_permanent=inviter_wallet.permanent_balance,
                snapshot_subscription=inviter_wallet.subscription_balance,
                description=f"邀请用户 ID: {invitee_id}"
            )
            db.add(inviter_transaction)

            invitation.status = "COMPLETED"
            inviter_rewarded = True
        else:
            # 达到每日上限，不发奖励
            invitation.status = "IGNORED"

        invitation.completed_at = datetime.utcnow()

        await db.commit()

        return {
            "status": "success",
            "invitee_reward": INVITE_REWARD_INVITEE,
            "inviter_rewarded": inviter_rewarded,
            "inviter_reward": INVITE_REWARD_INVITER if inviter_rewarded else 0
        }


# 导出服务实例
credit_service = CreditService()
