"""
Course Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.course import Course
from app.models.document import Document
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseGenerationRequest
)


router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new course

    Can be created from a document or standalone
    """
    # Validate document if provided
    if course_data.document_id:
        result = await db.execute(
            select(Document).where(
                Document.id == course_data.document_id,
                Document.user_id == current_user.id
            )
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

    # Create course
    course = Course(
        user_id=current_user.id,
        document_id=course_data.document_id,
        title=course_data.title,
        description=course_data.description,
        style=course_data.style,
        difficulty=course_data.difficulty,
        status="draft",
        is_public=False
    )

    db.add(course)
    await db.commit()
    await db.refresh(course)

    return CourseResponse.model_validate(course)


@router.get("/", response_model=CourseListResponse)
async def get_courses(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's courses with pagination
    """
    # Build query
    query_filter = [Course.user_id == current_user.id]
    if status:
        query_filter.append(Course.status == status)

    # Get total count
    count_query = select(func.count()).select_from(Course).where(*query_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get courses
    offset = (page - 1) * page_size
    query = select(Course).where(*query_filter).order_by(
        Course.created_at.desc()
    ).offset(offset).limit(page_size)

    result = await db.execute(query)
    courses = result.scalars().all()

    return CourseListResponse(
        courses=[CourseResponse.model_validate(course) for course in courses],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Get course by ID

    Public courses can be accessed without authentication
    """
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Check access permission
    if not course.is_public:
        if not current_user or course.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    # Increment views count for public courses
    if course.is_public:
        course.views_count += 1
        await db.commit()
        await db.refresh(course)

    return CourseResponse.model_validate(course)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update course information
    """
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.user_id == current_user.id
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Update fields
    update_data = course_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)

    return CourseResponse.model_validate(course)


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete course
    """
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.user_id == current_user.id
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    await db.delete(course)
    await db.commit()

    return {"message": "Course deleted successfully"}


@router.post("/{course_id}/like")
async def like_course(
    course_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Like a public course
    """
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.is_public == True
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not public"
        )

    course.likes_count += 1
    await db.commit()
    await db.refresh(course)

    return {"likes_count": course.likes_count}
