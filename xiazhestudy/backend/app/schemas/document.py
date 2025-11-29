"""
Document Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request schemas
class DocumentCreate(BaseModel):
    """Document creation schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Document update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


# Response schemas
class DocumentResponse(BaseModel):
    """Document response schema"""
    id: int
    user_id: int
    title: str
    file_url: str
    file_type: str
    file_size: int
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Document list response with pagination"""
    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    document: DocumentResponse
    message: str = "Document uploaded successfully"
