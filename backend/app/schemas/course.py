"""
Course Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


# Request schemas
class CourseCreate(BaseModel):
    """Course creation schema"""
    title: str = Field(..., min_length=1, max_length=255)
    document_id: Optional[int] = None
    style: str = Field(default="standard", max_length=50)
    difficulty: str = Field(default="medium", max_length=20)
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None  # 存储生成的 HTML: {"generated": html}
    status: Optional[str] = Field(default="draft", max_length=20)  # draft/pending/completed
    is_public: Optional[bool] = Field(default=False)


class CourseUpdate(BaseModel):
    """Course update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    style: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None
    cover_image: Optional[str] = Field(None, max_length=1000)


# Nested schema for user info
class UserBrief(BaseModel):
    """Brief user info for course response"""
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


# Response schemas
class CourseResponse(BaseModel):
    """Course response schema"""
    id: int
    user_id: int
    document_id: Optional[int] = None
    title: str
    style: str
    difficulty: str
    status: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    views_count: int
    likes_count: int
    is_public: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBrief] = None  # 用户信息（广场页面需要）

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Course list response with pagination"""
    courses: list[CourseResponse]
    total: int
    page: int
    page_size: int


class CourseGenerationRequest(BaseModel):
    """Request to generate course content using AI"""
    document_id: Optional[int] = None
    content: Optional[str] = None  # 新增：用于文本输入
    text_input: Optional[str] = None  # 保留兼容性
    title: Optional[str] = None
    description: Optional[str] = None  # 新增：课程描述
    difficulty: str = "beginner"  # 默认难度
