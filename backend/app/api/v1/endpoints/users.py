"""
User Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.course import Course
from app.schemas.user import UserResponse, UserUpdate, UserProfile
from app.services.credit_service import credit_service


router = APIRouter()


@router.get("/me/profile", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's complete profile with statistics
    """
    # Count documents
    doc_count_query = select(func.count()).select_from(Document).where(
        Document.user_id == current_user.id
    )
    doc_count_result = await db.execute(doc_count_query)
    documents_count = doc_count_result.scalar()

    # Count courses
    course_count_query = select(func.count()).select_from(Course).where(
        Course.user_id == current_user.id
    )
    course_count_result = await db.execute(course_count_query)
    courses_count = course_count_result.scalar()

    # Calculate storage limit based on subscription tier
    storage_limits = {
        "free": 5 * 1024 * 1024 * 1024,      # 5GB
        "basic": 10 * 1024 * 1024 * 1024,    # 10GB
        "plus": 30 * 1024 * 1024 * 1024,     # 30GB
        "pro": 100 * 1024 * 1024 * 1024,     # 100GB
    }
    storage_limit = storage_limits.get(current_user.subscription_tier, storage_limits["free"])

    return UserProfile(
        **UserResponse.model_validate(current_user).model_dump(),
        documents_count=documents_count,
        courses_count=courses_count,
        storage_limit=storage_limit
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile
    """
    # Update fields
    if user_data.username is not None:
        current_user.username = user_data.username
    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/me/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics

    Returns document count, course count, storage usage, etc.
    """
    # Count documents
    doc_count_query = select(func.count()).select_from(Document).where(
        Document.user_id == current_user.id
    )
    doc_count_result = await db.execute(doc_count_query)
    documents_count = doc_count_result.scalar()

    # Count courses
    course_count_query = select(func.count()).select_from(Course).where(
        Course.user_id == current_user.id
    )
    course_count_result = await db.execute(course_count_query)
    courses_count = course_count_result.scalar()

    # Count public courses
    public_course_query = select(func.count()).select_from(Course).where(
        Course.user_id == current_user.id,
        Course.is_public == True
    )
    public_course_result = await db.execute(public_course_query)
    public_courses_count = public_course_result.scalar()

    # Get total views and likes
    views_query = select(func.sum(Course.views_count)).where(
        Course.user_id == current_user.id
    )
    views_result = await db.execute(views_query)
    total_views = views_result.scalar() or 0

    likes_query = select(func.sum(Course.likes_count)).where(
        Course.user_id == current_user.id
    )
    likes_result = await db.execute(likes_query)
    total_likes = likes_result.scalar() or 0

    # Storage limits
    storage_limits = {
        "free": 5 * 1024 * 1024 * 1024,
        "basic": 10 * 1024 * 1024 * 1024,
        "plus": 30 * 1024 * 1024 * 1024,
        "pro": 100 * 1024 * 1024 * 1024,
    }
    storage_limit = storage_limits.get(current_user.subscription_tier, storage_limits["free"])
    storage_used_percent = (current_user.storage_used / storage_limit * 100) if storage_limit > 0 else 0

    # 从 UserWallet 获取真实积分余额
    wallet_balance = await credit_service.get_balance(db, current_user.id)

    return {
        "documents_count": documents_count,
        "courses_count": courses_count,
        "public_courses_count": public_courses_count,
        "points_balance": wallet_balance["total_balance"],  # 从钱包读取
        "permanent_balance": wallet_balance["permanent_balance"],
        "subscription_balance": wallet_balance["subscription_balance"],
        "can_generate": wallet_balance["can_generate"],  # 可生成次数
        "storage_used": current_user.storage_used,
        "storage_limit": storage_limit,
        "storage_used_percent": round(storage_used_percent, 2),
        "subscription_tier": current_user.subscription_tier,
        "total_views": total_views,
        "total_likes": total_likes,
    }
