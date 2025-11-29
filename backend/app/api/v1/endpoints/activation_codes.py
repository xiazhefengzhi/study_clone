"""
Activation Codes API - 激活码接口
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.activation_code import ActivationCode
from app.services.credit_service import credit_service

router = APIRouter()

# 套餐配置
TIER_CONFIG = {
    "basic": {"name": "Basic版", "points": 1500},
    "plus": {"name": "Plus版", "points": 5000},
    "pro": {"name": "Pro版", "points": 100000},
}

# 万能激活码列表 (可无限使用，跳过套餐验证，使用用户选择的套餐)
MASTER_CODES = ["HXX123456"]


# --- Schemas ---
class ActivateCodeRequest(BaseModel):
    """激活码请求"""
    code: str = Field(..., min_length=1, max_length=50)
    tier: Optional[str] = Field(None, pattern="^(basic|plus|pro)$")  # 用户选择的套餐


class ActivateCodeResponse(BaseModel):
    """激活码响应"""
    success: bool
    message: str
    tier: Optional[str] = None
    tier_name: Optional[str] = None
    points_added: Optional[int] = None
    duration_days: Optional[int] = None
    expires_at: Optional[datetime] = None


class CreateCodeRequest(BaseModel):
    """创建激活码请求 (管理员)"""
    code: str = Field(..., min_length=6, max_length=50)
    tier: str = Field(..., pattern="^(basic|plus|pro)$")
    points_amount: int = Field(default=0, ge=0)
    duration_days: int = Field(default=30, ge=1, le=365)
    expires_at: Optional[datetime] = None
    note: Optional[str] = None


class CodeInfo(BaseModel):
    """激活码信息"""
    id: int
    code: str
    tier: str
    tier_name: str
    points_amount: int
    duration_days: int
    is_used: bool
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- API Endpoints ---

@router.post("/activate", response_model=ActivateCodeResponse)
async def activate_code(
    request: ActivateCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    使用激活码激活会员订阅

    - 验证激活码有效性
    - 升级用户订阅等级
    - 添加积分
    - 设置会员有效期
    """
    code_str = request.code.strip()
    code_upper = code_str.upper()

    # 检查是否是万能激活码 (不限次数使用，使用用户选择的套餐)
    # 万能激活码不区分大小写
    if code_upper in MASTER_CODES:
        # 万能激活码使用用户选择的套餐
        selected_tier = request.tier
        if not selected_tier or selected_tier not in TIER_CONFIG:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请选择要激活的套餐"
            )

        tier_info = TIER_CONFIG[selected_tier]
        duration_days = 365  # 万能激活码默认365天

        # 计算会员到期时间
        subscription_expires_at = datetime.utcnow() + timedelta(days=duration_days)

        # 更新用户订阅等级
        current_user.subscription_tier = selected_tier
        current_user.current_plan_id = selected_tier

        # 使用 credit_service 添加积分到钱包 (使用套餐自带积分)
        total_points = tier_info["points"]
        await credit_service.add_credits(
            db=db,
            user_id=current_user.id,
            amount=total_points,
            transaction_type="ACTIVATION_CODE",
            description=f"万能激活码充值: {code_str} ({tier_info['name']})"
        )

        await db.commit()

        return ActivateCodeResponse(
            success=True,
            message=f"恭喜！您已成功激活 {tier_info['name']} 会员",
            tier=selected_tier,
            tier_name=tier_info["name"],
            points_added=total_points,
            duration_days=duration_days,
            expires_at=subscription_expires_at
        )

    # 查找普通激活码 (转大写匹配)
    result = await db.execute(
        select(ActivationCode).where(ActivationCode.code == code_upper)
    )
    activation_code = result.scalar_one_or_none()

    if not activation_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="激活码不存在"
        )

    # 检查是否已使用
    if activation_code.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该激活码已被使用"
        )

    # 检查激活码是否过期
    if activation_code.expires_at and activation_code.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该激活码已过期"
        )

    # 获取套餐配置
    tier_info = TIER_CONFIG.get(activation_code.tier)
    if not tier_info:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="无效的套餐类型"
        )

    # 计算会员到期时间
    subscription_expires_at = datetime.utcnow() + timedelta(days=activation_code.duration_days)

    # 更新用户订阅等级
    current_user.subscription_tier = activation_code.tier
    current_user.current_plan_id = activation_code.tier

    # 使用 credit_service 添加积分 (套餐自带积分 + 额外赠送积分)
    total_points = tier_info["points"] + activation_code.points_amount
    await credit_service.add_credits(
        db=db,
        user_id=current_user.id,
        amount=total_points,
        transaction_type="ACTIVATION_CODE",
        description=f"激活码充值: {activation_code.code}"
    )

    # 标记激活码已使用
    activation_code.is_used = True
    activation_code.used_by_id = current_user.id
    activation_code.used_at = datetime.utcnow()

    await db.commit()

    return ActivateCodeResponse(
        success=True,
        message=f"恭喜！您已成功激活 {tier_info['name']} 会员",
        tier=activation_code.tier,
        tier_name=tier_info["name"],
        points_added=total_points,
        duration_days=activation_code.duration_days,
        expires_at=subscription_expires_at
    )


@router.get("/verify/{code}")
async def verify_code(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    验证激活码是否有效（不需要登录）
    """
    code_str = code.strip().upper()

    result = await db.execute(
        select(ActivationCode).where(ActivationCode.code == code_str)
    )
    activation_code = result.scalar_one_or_none()

    if not activation_code:
        return {"valid": False, "message": "激活码不存在"}

    if activation_code.is_used:
        return {"valid": False, "message": "该激活码已被使用"}

    if activation_code.expires_at and activation_code.expires_at < datetime.utcnow():
        return {"valid": False, "message": "该激活码已过期"}

    tier_info = TIER_CONFIG.get(activation_code.tier, {})

    return {
        "valid": True,
        "message": "激活码有效",
        "tier": activation_code.tier,
        "tier_name": tier_info.get("name", activation_code.tier),
        "points": tier_info.get("points", 0) + activation_code.points_amount,
        "duration_days": activation_code.duration_days
    }


@router.post("/create", response_model=CodeInfo)
async def create_activation_code(
    request: CreateCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建激活码（管理员功能，暂时开放给所有用户测试）
    """
    code_str = request.code.strip().upper()

    # 检查是否已存在
    result = await db.execute(
        select(ActivationCode).where(ActivationCode.code == code_str)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该激活码已存在"
        )

    # 创建激活码
    new_code = ActivationCode(
        code=code_str,
        tier=request.tier,
        points_amount=request.points_amount,
        duration_days=request.duration_days,
        expires_at=request.expires_at,
        note=request.note
    )

    db.add(new_code)
    await db.commit()
    await db.refresh(new_code)

    tier_info = TIER_CONFIG.get(new_code.tier, {})

    return CodeInfo(
        id=new_code.id,
        code=new_code.code,
        tier=new_code.tier,
        tier_name=tier_info.get("name", new_code.tier),
        points_amount=new_code.points_amount,
        duration_days=new_code.duration_days,
        is_used=new_code.is_used,
        used_at=new_code.used_at,
        expires_at=new_code.expires_at,
        created_at=new_code.created_at
    )


@router.get("/list")
async def list_activation_codes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    列出所有激活码（管理员功能）
    """
    result = await db.execute(
        select(ActivationCode).order_by(ActivationCode.created_at.desc())
    )
    codes = result.scalars().all()

    return {
        "codes": [
            {
                "id": c.id,
                "code": c.code,
                "tier": c.tier,
                "tier_name": TIER_CONFIG.get(c.tier, {}).get("name", c.tier),
                "points_amount": c.points_amount,
                "duration_days": c.duration_days,
                "is_used": c.is_used,
                "used_by_id": c.used_by_id,
                "used_at": c.used_at.isoformat() if c.used_at else None,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None,
                "created_at": c.created_at.isoformat()
            }
            for c in codes
        ],
        "total": len(codes)
    }
