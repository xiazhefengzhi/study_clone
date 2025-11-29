"""
Post Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request schemas
class PostCreate(BaseModel):
    """Post creation schema"""
    course_id: int
    category: Optional[str] = "other"


class PostUpdate(BaseModel):
    """Post update schema"""
    category: Optional[str] = None
    is_featured: Optional[bool] = None


# Response schemas
class PostResponse(BaseModel):
    """Post response schema"""
    id: int
    course_id: int
    user_id: int
    post_type: str
    category: str
    tags: Optional[list] = None
    views_count: int
    likes_count: int
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    # Include course info
    course_title: Optional[str] = None
    course_description: Optional[str] = None
    course_cover_image: Optional[str] = None

    # Include user info
    username: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """Post list response with pagination"""
    posts: list[PostResponse]
    total: int
    page: int
    page_size: int
