"""
Export Tasks API - 导出任务管理
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.export_task import ExportTask

router = APIRouter()


# Schemas
class ExportTaskCreate(BaseModel):
    course_id: int
    export_type: str = "html"  # html, pdf, mp4
    file_name: str
    file_size: Optional[int] = None


class ExportTaskResponse(BaseModel):
    id: int
    course_id: int
    export_type: str
    status: str
    file_name: str
    file_size: Optional[int]
    file_url: Optional[str]
    progress: int
    created_at: datetime
    completed_at: Optional[datetime]
    course_title: Optional[str] = None

    class Config:
        from_attributes = True


class ExportTaskListResponse(BaseModel):
    tasks: List[ExportTaskResponse]
    total: int
    page: int
    page_size: int


@router.get("/", response_model=ExportTaskListResponse)
async def get_export_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    export_type: Optional[str] = Query(None, description="html/pdf/mp4"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户的导出任务列表
    """
    # 构建查询条件
    query_filter = [ExportTask.user_id == current_user.id]
    if export_type:
        query_filter.append(ExportTask.export_type == export_type)

    # 获取总数
    count_query = select(func.count()).select_from(ExportTask).where(*query_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 获取列表（预加载课程信息）
    offset = (page - 1) * page_size
    query = (
        select(ExportTask)
        .options(selectinload(ExportTask.course))
        .where(*query_filter)
        .order_by(ExportTask.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(query)
    tasks = result.scalars().all()

    # 构建响应
    task_responses = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "course_id": task.course_id,
            "export_type": task.export_type,
            "status": task.status,
            "file_name": getattr(task, 'file_name', '') or f"导出_{task.id}",
            "file_size": getattr(task, 'file_size', None),
            "file_url": task.file_url,
            "progress": task.progress,
            "created_at": task.created_at,
            "completed_at": task.completed_at,
            "course_title": task.course.title if task.course else None
        }
        task_responses.append(ExportTaskResponse(**task_dict))

    return ExportTaskListResponse(
        tasks=task_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/", response_model=ExportTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_export_task(
    task_data: ExportTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建导出任务记录
    """
    # 验证课程存在且属于当前用户
    course_result = await db.execute(
        select(Course).where(
            Course.id == task_data.course_id,
            Course.user_id == current_user.id
        )
    )
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在或无权限"
        )

    # 创建导出任务
    export_task = ExportTask(
        user_id=current_user.id,
        course_id=task_data.course_id,
        export_type=task_data.export_type,
        status="completed",  # HTML 导出是即时完成的
        progress=100,
        completed_at=datetime.utcnow()
    )

    # 设置文件名和大小（如果模型支持）
    if hasattr(export_task, 'file_name'):
        export_task.file_name = task_data.file_name
    if hasattr(export_task, 'file_size') and task_data.file_size:
        export_task.file_size = task_data.file_size

    db.add(export_task)
    await db.commit()
    await db.refresh(export_task)

    return ExportTaskResponse(
        id=export_task.id,
        course_id=export_task.course_id,
        export_type=export_task.export_type,
        status=export_task.status,
        file_name=getattr(export_task, 'file_name', '') or task_data.file_name,
        file_size=getattr(export_task, 'file_size', None),
        file_url=export_task.file_url,
        progress=export_task.progress,
        created_at=export_task.created_at,
        completed_at=export_task.completed_at,
        course_title=course.title
    )


@router.get("/stats")
async def get_export_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取导出统计
    """
    # 总导出次数
    total_query = select(func.count()).select_from(ExportTask).where(
        ExportTask.user_id == current_user.id
    )
    total_result = await db.execute(total_query)
    total_exports = total_result.scalar()

    # 按类型统计
    type_query = select(
        ExportTask.export_type,
        func.count().label('count')
    ).where(
        ExportTask.user_id == current_user.id
    ).group_by(ExportTask.export_type)

    type_result = await db.execute(type_query)
    type_stats = {row.export_type: row.count for row in type_result}

    return {
        "total_exports": total_exports,
        "by_type": {
            "html": type_stats.get("html", 0),
            "pdf": type_stats.get("pdf", 0),
            "mp4": type_stats.get("mp4", 0)
        }
    }


@router.delete("/{task_id}")
async def delete_export_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除导出任务记录
    """
    result = await db.execute(
        select(ExportTask).where(
            ExportTask.id == task_id,
            ExportTask.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="导出记录不存在"
        )

    await db.delete(task)
    await db.commit()

    return {"message": "删除成功"}
