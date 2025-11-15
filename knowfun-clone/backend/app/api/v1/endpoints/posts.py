"""
Posts API endpoints - Fun Square (内容广场)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.course import Course
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse


router = APIRouter()


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Publish a course to Fun Square (content plaza)

    Makes the course public and creates a post entry
    """
    # Verify course exists and belongs to user
    result = await db.execute(
        select(Course).where(
            Course.id == post_data.course_id,
            Course.user_id == current_user.id
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Check if already published
    existing_post = await db.execute(
        select(Post).where(Post.course_id == post_data.course_id)
    )
    if existing_post.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course already published"
        )

    # Make course public
    course.is_public = True

    # Create post
    post = Post(
        course_id=post_data.course_id,
        user_id=current_user.id,
        post_type="article",
        category=post_data.category or "other",
        views_count=0,
        likes_count=0,
        is_featured=False
    )

    db.add(post)
    await db.commit()
    await db.refresh(post)

    return await get_post_with_details(post.id, db)


@router.get("/", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("latest", regex="^(latest|popular|trending)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get posts from Fun Square with filtering and pagination

    - category: Filter by category
    - search: Search in course titles
    - sort: latest (newest first), popular (most views), trending (most likes)
    """
    # Build query
    query = select(Post).join(Course, Post.course_id == Course.id)

    # Filters
    filters = [Course.is_public == True]

    if category:
        filters.append(Post.category == category)

    if search:
        filters.append(Course.title.ilike(f"%{search}%"))

    query = query.where(*filters)

    # Sorting
    if sort == "popular":
        query = query.order_by(Post.views_count.desc())
    elif sort == "trending":
        query = query.order_by(Post.likes_count.desc())
    else:  # latest
        query = query.order_by(Post.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(Post).join(
        Course, Post.course_id == Course.id
    ).where(*filters)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    posts = result.scalars().all()

    # Get detailed post info
    posts_with_details = []
    for post in posts:
        post_detail = await get_post_with_details(post.id, db)
        posts_with_details.append(post_detail)

    return PostListResponse(
        posts=posts_with_details,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get post by ID with course and user details
    """
    return await get_post_with_details(post_id, db)


@router.post("/{post_id}/view")
async def increment_post_view(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Increment view count for a post
    """
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    post.views_count += 1
    await db.commit()

    return {"views_count": post.views_count}


@router.post("/{post_id}/like")
async def like_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Like a post (increments like count)
    """
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    post.likes_count += 1

    # Also update course likes
    course_result = await db.execute(
        select(Course).where(Course.id == post.course_id)
    )
    course = course_result.scalar_one_or_none()
    if course:
        course.likes_count += 1

    await db.commit()

    return {"likes_count": post.likes_count}


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a post (unpublish from Fun Square)
    """
    result = await db.execute(
        select(Post).where(
            Post.id == post_id,
            Post.user_id == current_user.id
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Make course private
    course_result = await db.execute(
        select(Course).where(Course.id == post.course_id)
    )
    course = course_result.scalar_one_or_none()
    if course:
        course.is_public = False

    await db.delete(post)
    await db.commit()

    return {"message": "Post deleted successfully"}


# Helper function
async def get_post_with_details(post_id: int, db: AsyncSession) -> PostResponse:
    """Get post with course and user details"""
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Get course
    course_result = await db.execute(
        select(Course).where(Course.id == post.course_id)
    )
    course = course_result.scalar_one_or_none()

    # Get user
    user_result = await db.execute(
        select(User).where(User.id == post.user_id)
    )
    user = user_result.scalar_one_or_none()

    return PostResponse(
        **post.__dict__,
        course_title=course.title if course else None,
        course_description=course.description if course else None,
        course_cover_image=course.cover_image if course else None,
        username=user.username if user else None,
        user_avatar=user.avatar_url if user else None
    )
