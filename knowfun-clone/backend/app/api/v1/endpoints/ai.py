"""
AI Generation API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.document import Document
from app.models.course import Course
from app.services.ai_service import ai_service
from app.services.document_parser import document_parser
from pydantic import BaseModel


router = APIRouter()


class GenerateFromDocumentRequest(BaseModel):
    """Generate content from document"""
    document_id: int
    style: str = "standard"
    difficulty: str = "intermediate"
    title: str = ""


class GenerateFromTextRequest(BaseModel):
    """Generate content from text"""
    text: str
    style: str = "standard"
    difficulty: str = "intermediate"
    title: str = ""


class RegenerateRequest(BaseModel):
    """Regenerate existing course content"""
    course_id: int
    feedback: Optional[str] = None


@router.post("/generate/document")
async def generate_from_document(
    request: Request,
    gen_request: GenerateFromDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate course content from document (streaming)

    Returns SSE stream with generated HTML tokens
    """
    # Get document
    result = await db.execute(
        select(Document).where(
            Document.id == gen_request.document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Parse document content
    try:
        # Extract text from document file
        content = await document_parser.parse_from_storage(document.file_url)

        # Add title as context
        full_content = f"# {document.title}\n\n## 文档内容\n\n{content}"

    except Exception as e:
        # Fallback: use document title
        import logging
        logging.warning(f"Failed to parse document {document.id}: {e}")
        full_content = f"Document: {document.title}"

    # Generate streaming response
    async def event_generator():
        try:
            async for chunk in ai_service.generate_course_content_stream(
                content=full_content,
                style=gen_request.style,
                difficulty=gen_request.difficulty,
                title=gen_request.title or document.title
            ):
                if await request.is_disconnected():
                    break
                yield chunk
        except Exception as e:
            import json
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    headers = {
        "Cache-Control": "no-store",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(event_generator(), headers=headers)


@router.post("/generate/text")
async def generate_from_text(
    request: Request,
    gen_request: GenerateFromTextRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate course content from text (streaming)

    Returns SSE stream with generated HTML tokens
    """
    # Generate streaming response
    async def event_generator():
        try:
            async for chunk in ai_service.generate_course_content_stream(
                content=gen_request.text,
                style=gen_request.style,
                difficulty=gen_request.difficulty,
                title=gen_request.title
            ):
                if await request.is_disconnected():
                    break
                yield chunk
        except Exception as e:
            import json
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    headers = {
        "Cache-Control": "no-store",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(event_generator(), headers=headers)


@router.post("/regenerate")
async def regenerate_course(
    request: Request,
    regen_request: RegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Regenerate existing course content with optional feedback (streaming)

    Returns SSE stream with regenerated HTML tokens
    """
    # Get course
    result = await db.execute(
        select(Course).where(
            Course.id == regen_request.course_id,
            Course.user_id == current_user.id
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Build content with feedback
    if course.source_type == "document" and course.document_id:
        doc_result = await db.execute(
            select(Document).where(Document.id == course.document_id)
        )
        document = doc_result.scalar_one_or_none()

        if document:
            try:
                # Parse document content
                parsed_content = await document_parser.parse_from_storage(document.file_url)
                content = f"# {document.title}\n\n## 文档内容\n\n{parsed_content}"
            except Exception:
                content = f"Document: {document.title}"
        else:
            content = course.text_content or ""
    else:
        content = course.text_content or ""

    # Add feedback to history if provided
    history = []
    if regen_request.feedback:
        history = [
            {"role": "assistant", "content": course.content or ""},
            {"role": "user", "content": f"请根据以下反馈重新生成：{regen_request.feedback}"}
        ]

    # Generate streaming response
    async def event_generator():
        try:
            async for chunk in ai_service.generate_course_content_stream(
                content=content,
                style=course.style,
                difficulty=course.difficulty,
                title=course.title,
                history=history
            ):
                if await request.is_disconnected():
                    break
                yield chunk
        except Exception as e:
            import json
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    headers = {
        "Cache-Control": "no-store",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(event_generator(), headers=headers)
