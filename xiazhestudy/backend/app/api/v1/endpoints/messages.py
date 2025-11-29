"""
Messages API - 站内信
"""
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message


router = APIRouter()


@router.get("/")
async def get_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False, description="只显示未读"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取站内信列表"""
    query_filter = [Message.user_id == current_user.id]
    if unread_only:
        query_filter.append(Message.is_read == False)

    # 获取总数
    count_query = select(func.count()).select_from(Message).where(*query_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 获取列表
    offset = (page - 1) * page_size
    query = select(Message).where(*query_filter).order_by(
        Message.created_at.desc()
    ).offset(offset).limit(page_size)

    result = await db.execute(query)
    messages = result.scalars().all()

    return {
        "messages": [
            {
                "id": m.id,
                "title": m.title,
                "content": m.content,
                "message_type": m.message_type,
                "is_read": m.is_read,
                "related_course_id": m.related_course_id,
                "created_at": m.created_at.isoformat(),
                "read_at": m.read_at.isoformat() if m.read_at else None
            }
            for m in messages
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/{message_id}/read")
async def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记消息为已读"""
    result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.user_id == current_user.id
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="消息不存在"
        )

    message.mark_as_read()
    await db.commit()

    return {"message": "已标记为已读"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取未读消息数量"""
    result = await db.execute(
        select(func.count()).where(
            Message.user_id == current_user.id,
            Message.is_read == False
        )
    )
    count = result.scalar()

    return {"unread_count": count}
