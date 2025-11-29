"""
Referral API - 推荐有礼系统
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.referral import Referral
from app.services.credit_service import credit_service

router = APIRouter()

# 推荐奖励配置
REFERRER_REWARD = 200  # 推荐人获得积分
REFEREE_REWARD = 100   # 被推荐人获得积分


def generate_referral_code() -> str:
    """生成唯一的推荐码"""
    return secrets.token_urlsafe(6).upper()[:8]


@router.get("/code")
async def get_referral_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取当前用户的推荐码
    如果没有则自动创建
    """
    # 查找用户现有的推荐码
    result = await db.execute(
        select(Referral).where(
            Referral.referrer_id == current_user.id,
            Referral.referee_id == None  # 主推荐码记录
        ).order_by(Referral.created_at.desc()).limit(1)
    )
    referral = result.scalar_one_or_none()

    if not referral:
        # 创建新的推荐码
        code = generate_referral_code()
        # 确保唯一性
        while True:
            existing = await db.execute(
                select(Referral).where(Referral.referral_code == code)
            )
            if not existing.scalar_one_or_none():
                break
            code = generate_referral_code()

        referral = Referral(
            referrer_id=current_user.id,
            referral_code=code,
            reward_points=REFERRER_REWARD
        )
        db.add(referral)
        await db.commit()
        await db.refresh(referral)

    return {
        "referral_code": referral.referral_code,
        "referrer_reward": REFERRER_REWARD,
        "referee_reward": REFEREE_REWARD,
        "referral_link": f"https://xiazhestudy.com/sign-up?ref={referral.referral_code}"
    }


@router.get("/stats")
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取推荐统计数据
    """
    # 成功推荐数量
    success_count_result = await db.execute(
        select(func.count()).select_from(Referral).where(
            Referral.referrer_id == current_user.id,
            Referral.is_completed == True
        )
    )
    success_count = success_count_result.scalar() or 0

    # 累计获得积分
    total_points_result = await db.execute(
        select(func.sum(Referral.reward_points)).where(
            Referral.referrer_id == current_user.id,
            Referral.is_completed == True,
            Referral.reward_status == "completed"
        )
    )
    total_points = total_points_result.scalar() or 0

    # 最近邀请记录
    recent_result = await db.execute(
        select(Referral).where(
            Referral.referrer_id == current_user.id,
            Referral.referee_id != None
        ).order_by(Referral.created_at.desc()).limit(10)
    )
    recent_referrals = recent_result.scalars().all()

    # 获取被邀请用户信息
    records = []
    for ref in recent_referrals:
        if ref.referee_id:
            user_result = await db.execute(
                select(User).where(User.id == ref.referee_id)
            )
            referee = user_result.scalar_one_or_none()
            records.append({
                "id": ref.id,
                "referee_name": referee.username if referee else "未知用户",
                "reward_points": ref.reward_points,
                "is_completed": ref.is_completed,
                "reward_status": ref.reward_status,
                "created_at": ref.created_at.isoformat(),
                "completed_at": ref.completed_at.isoformat() if ref.completed_at else None
            })

    return {
        "success_count": success_count,
        "total_points_earned": total_points,
        "recent_referrals": records
    }


@router.post("/apply")
async def apply_referral_code(
    referral_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    新用户使用推荐码
    - 给推荐人和被推荐人都发放奖励
    """
    # 查找推荐码
    result = await db.execute(
        select(Referral).where(
            Referral.referral_code == referral_code.upper()
        ).limit(1)
    )
    referral = result.scalar_one_or_none()

    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="推荐码不存在"
        )

    # 不能使用自己的推荐码
    if referral.referrer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能使用自己的推荐码"
        )

    # 检查是否已经使用过推荐码
    existing_result = await db.execute(
        select(Referral).where(
            Referral.referee_id == current_user.id
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经使用过推荐码"
        )

    # 创建推荐记录
    new_referral = Referral(
        referrer_id=referral.referrer_id,
        referee_id=current_user.id,
        referral_code=referral_code.upper(),
        reward_points=REFERRER_REWARD,
        is_completed=True,
        reward_status="completed"
    )
    new_referral.completed_at = new_referral.created_at
    db.add(new_referral)

    # 给推荐人发放奖励
    await credit_service.add_credits(
        db=db,
        user_id=referral.referrer_id,
        amount=REFERRER_REWARD,
        transaction_type="REFERRAL_BONUS",
        description=f"推荐新用户 {current_user.username} 注册奖励"
    )

    # 给被推荐人发放奖励
    await credit_service.add_credits(
        db=db,
        user_id=current_user.id,
        amount=REFEREE_REWARD,
        transaction_type="REFERRAL_BONUS",
        description="使用推荐码注册奖励"
    )

    await db.commit()

    return {
        "message": "推荐码使用成功",
        "reward_received": REFEREE_REWARD
    }
