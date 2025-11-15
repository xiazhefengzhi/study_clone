"""
Document Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user
from app.services.storage_service import storage_service
from app.models.user import User
from app.models.document import Document
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse
)


router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Query(..., description="Document title"),
    description: str = Query(None, description="Document description"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a new document

    Supports PDF, PPT, Word files
    """
    # Validate file type
    allowed_extensions = {".pdf", ".ppt", ".pptx", ".doc", ".docx"}
    file_ext = "." + file.filename.split(".")[-1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )

    # Check storage limit
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)  # Reset file pointer

    # Simple storage limit check (can be enhanced with subscription tiers)
    storage_limit = 5 * 1024 * 1024 * 1024  # 5GB for free tier
    if current_user.storage_used + file_size > storage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storage limit exceeded"
        )

    # Upload to Supabase Storage
    upload_result = await storage_service.upload_file(
        file=file,
        user_id=current_user.id,
        folder="documents"
    )

    # Create document record
    document = Document(
        user_id=current_user.id,
        title=title,
        file_url=upload_result["public_url"],
        file_type=file_ext,
        file_size=file_size,
        status="success"
    )

    db.add(document)

    # Update user storage usage
    current_user.storage_used += file_size

    await db.commit()
    await db.refresh(document)

    return DocumentUploadResponse(
        document=DocumentResponse.model_validate(document),
        message="Document uploaded successfully"
    )


@router.get("/", response_model=DocumentListResponse)
async def get_documents(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's documents with pagination
    """
    # Get total count
    count_query = select(func.count()).select_from(Document).where(
        Document.user_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get documents
    offset = (page - 1) * page_size
    query = select(Document).where(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get document by ID
    """
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return DocumentResponse.model_validate(document)


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update document information
    """
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Update fields
    if document_data.title is not None:
        document.title = document_data.title
    if document_data.description is not None:
        document.description = document_data.description

    await db.commit()
    await db.refresh(document)

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete document

    Also deletes file from storage and updates user storage usage
    """
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Delete file from storage
    try:
        await storage_service.delete_file(document.file_path)
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Error deleting file from storage: {e}")

    # Update user storage usage
    current_user.storage_used -= document.file_size
    if current_user.storage_used < 0:
        current_user.storage_used = 0

    # Delete document record
    await db.delete(document)
    await db.commit()

    return {"message": "Document deleted successfully"}
