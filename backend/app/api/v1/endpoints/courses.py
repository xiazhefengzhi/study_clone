"""
Course Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
import json

from app.core.supabase_db import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.course import Course
from app.models.document import Document
from app.models.message import Message
from app.models.course_like import CourseLike
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
    CourseGenerationRequest
)
from app.services.ai_service import ai_service
from app.services.credit_service import credit_service


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
        description=course_data.description or "",
        style=course_data.style or "standard",
        difficulty=course_data.difficulty or "beginner",
        content=course_data.content,  # 支持保存生成的 HTML
        status=course_data.status or "draft",
        is_public=course_data.is_public or False
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


@router.get("/my-courses", response_model=CourseListResponse)
async def get_my_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="processing(含pending)/completed/failed"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取我的动画列表（包括所有状态）

    支持筛选：
    - processing: 生成中（包含 pending 排队中）
    - completed: 已完成
    - failed: 失败
    """
    # 构建查询条件
    query_filter = [Course.user_id == current_user.id]
    if status:
        if status == "processing":
            # processing 包含 pending 和 processing 两种状态
            query_filter.append(Course.status.in_(["pending", "processing"]))
        else:
            query_filter.append(Course.status == status)

    # 获取总数
    count_query = select(func.count()).select_from(Course).where(*query_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 获取列表
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


@router.get("/public/list", response_model=CourseListResponse)
async def get_public_courses(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="分类筛选"),
    sort_by: str = Query("latest", description="排序方式: latest/popular/rating"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取广场公开课程列表（无需登录）

    支持：
    - 分页
    - 分类筛选
    - 搜索
    - 多种排序方式
    """
    # 构建查询条件
    query_filter = [
        Course.is_public == True,
        Course.status == "completed"
    ]

    # 分类筛选
    if category and category != "全部":
        query_filter.append(Course.category == category)

    # 搜索
    if search:
        search_pattern = f"%{search}%"
        query_filter.append(
            (Course.title.ilike(search_pattern)) |
            (Course.description.ilike(search_pattern))
        )

    # 获取总数
    count_query = select(func.count()).select_from(Course).where(*query_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 构建排序
    if sort_by == "popular":
        order_by = Course.views_count.desc()
    elif sort_by == "rating":
        order_by = Course.likes_count.desc()
    else:  # latest
        order_by = Course.created_at.desc()

    # 获取列表（加载用户关系）
    offset = (page - 1) * page_size
    query = (
        select(Course)
        .options(selectinload(Course.user))  # 预加载用户信息
        .where(*query_filter)
        .order_by(order_by)
        .offset(offset)
        .limit(page_size)
    )

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    点赞课程

    防重复点赞：
    - 如果已点赞，则取消点赞
    - 如果未点赞，则添加点赞
    """
    # 检查课程是否存在且公开
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
            detail="课程不存在或未公开"
        )

    # 检查是否已点赞
    like_result = await db.execute(
        select(CourseLike).where(
            CourseLike.user_id == current_user.id,
            CourseLike.course_id == course_id
        )
    )
    existing_like = like_result.scalar_one_or_none()

    if existing_like:
        # 已点赞，取消点赞
        await db.delete(existing_like)
        course.likes_count -= 1
        await db.commit()
        return {"liked": False, "likes_count": course.likes_count}
    else:
        # 未点赞，添加点赞
        new_like = CourseLike(
            user_id=current_user.id,
            course_id=course_id
        )
        db.add(new_like)
        course.likes_count += 1
        await db.commit()
        return {"liked": True, "likes_count": course.likes_count}


@router.post("/generate/stream")
async def generate_course_stream(
    content: str = Form(...),
    style: str = Form("standard"),
    difficulty: str = Form("intermediate"),
    title: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream-generate course content using AI

    ⚠️ 重要：每次生成消耗 100 积分

    Supports both text input and file upload (PDF/PPT/Word)
    Returns Server-Sent Events (SSE) stream
    """
    # 🔥 步骤1：扣除积分（100积分/次）
    try:
        deduct_result = await credit_service.consume_credits(
            db=db,
            user_id=current_user.id,
            amount=100,
            description=f"生成动画讲解：{title or '未命名'}"
        )
    except HTTPException as e:
        # 积分不足，返回错误信息
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=e.detail
        )

    # Process file if uploaded
    file_content = ""
    if file:
        # Read file content
        file_bytes = await file.read()

        # TODO: Add file parsing logic for PDF/PPT/Word
        # For now, just use the text content
        try:
            file_content = file_bytes.decode('utf-8')
        except:
            file_content = f"[File uploaded: {file.filename}]"

    # Combine content
    full_content = content
    if file_content:
        full_content = f"{content}\n\n{file_content}"

    # Generate content stream
    async def event_generator():
        try:
            # 发送积分扣除成功消息
            credits_info = json.dumps({
                "event": "credits_deducted",
                "deducted": deduct_result["deducted"],
                "remaining": deduct_result["remaining"]
            }, ensure_ascii=False)
            yield f"data: {credits_info}\n\n"

            # 生成内容流
            async for chunk in ai_service.generate_course_content_stream(
                content=full_content,
                style=style,
                difficulty=difficulty,
                title=title
            ):
                yield chunk
        except Exception as e:
            error_data = json.dumps({"event": "error", "message": str(e)}, ensure_ascii=False)
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/generate", response_model=CourseResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_course_async(
    course_data: CourseGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    异步生成动画（立即返回，后台处理）

    流程：
    1. 扣除积分（100积分/次）
    2. 如果有 document_id，解析文档内容
    3. 创建 Course 记录（状态：pending）
    4. 添加后台任务
    5. 立即返回任务信息
    """
    from app.services.document_parser import document_parser

    # 1. 扣除积分（100积分/次）
    try:
        deduct_result = await credit_service.consume_credits(
            db=db,
            user_id=current_user.id,
            amount=100,
            description=f"生成动画讲解：{course_data.title or '未命名'}"
        )
    except HTTPException as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=e.detail
        )

    # 2. 获取内容（文本输入 或 从文档解析）
    content_to_generate = course_data.content or course_data.text_input or ""

    if course_data.document_id and not content_to_generate:
        # 查询文档
        doc_result = await db.execute(
            select(Document).where(
                Document.id == course_data.document_id,
                Document.user_id == current_user.id
            )
        )
        document = doc_result.scalar_one_or_none()

        if document:
            try:
                # 解析文档内容
                content_to_generate = await document_parser.parse_from_storage(document.file_url)
            except Exception as e:
                print(f"文档解析失败: {e}")
                # 如果解析失败，使用文档标题作为内容
                content_to_generate = f"请根据文档《{document.title}》生成动画讲解"

    if not content_to_generate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供文本内容或上传文档"
        )

    # 3. 创建 Course 记录
    course = Course(
        user_id=current_user.id,
        document_id=course_data.document_id,
        title=course_data.title or "未命名课程",
        description=course_data.description or "",
        style="auto",  # 自动风格（LLM自动选择）
        difficulty=course_data.difficulty or "beginner",
        status="pending",  # 初始状态：排队中
        is_public=False    # 默认私有
    )

    db.add(course)
    await db.commit()
    await db.refresh(course)

    # 4. 添加后台任务（异步生成）
    background_tasks.add_task(
        generate_course_background,
        course_id=course.id,
        user_id=current_user.id,
        content=content_to_generate,
        style="auto",  # LLM自动选择风格
        difficulty=course_data.difficulty or "beginner",
        title=course_data.title or "未命名课程"
    )

    return CourseResponse.model_validate(course)


async def generate_course_background(
    course_id: int,
    user_id: int,
    content: str,
    style: str,
    difficulty: str,
    title: str
):
    """
    后台生成动画任务

    流程：
    1. 更新状态为 processing
    2. 调用 AI 服务生成内容
    3. 成功 -> 更新状态为 completed，发送成功通知
    4. 失败 -> 更新状态为 failed，退还积分，发送失败通知
    """
    from app.core.supabase_db import get_db
    from app.services.ai_service import ai_service

    # 创建新的数据库会话（后台任务）
    async for db in get_db():
        try:
            # 1. 获取 Course 记录
            result = await db.execute(
                select(Course).where(Course.id == course_id)
            )
            course = result.scalar_one()

            # 2. 更新状态为 processing
            course.status = "processing"
            await db.commit()

            # 3. 执行 AI 生成（耗时操作）
            # 收集所有生成的内容
            generated_content = ""
            async for chunk in ai_service.generate_course_content_stream(
                content=content,
                style=style,
                difficulty=difficulty,
                title=title
            ):
                # 解析 SSE 格式的数据
                if chunk.startswith("data: "):
                    data_str = chunk[6:].strip()
                    if data_str:
                        try:
                            data = json.loads(data_str)
                            # AI 服务发送 {"token": "..."} 格式
                            if "token" in data:
                                generated_content += data["token"]
                            elif data.get("error"):
                                raise Exception(data["error"])
                        except json.JSONDecodeError:
                            continue

            # 4. 成功：更新 Course 内容
            course.content = {"generated": generated_content}
            course.status = "completed"
            await db.commit()

            # 5. 发送成功通知
            message = Message(
                user_id=user_id,
                title="动画生成成功 🎉",
                content=f"您的课程《{title}》已生成完毕，快去查看吧！",
                message_type="animation_success",
                related_course_id=course_id
            )
            db.add(message)
            await db.commit()

        except Exception as e:
            # 失败处理
            print(f"生成失败: {e}")

            # 更新状态为 failed
            course.status = "failed"
            course.fail_reason = str(e)
            await db.commit()

            # 退还积分
            await credit_service.add_credits(
                db=db,
                user_id=user_id,
                amount=100,
                transaction_type="REFUND",
                description="动画生成失败，退还积分"
            )

            # 发送失败通知
            message = Message(
                user_id=user_id,
                title="动画生成失败 ❌",
                content=f"很抱歉，《{title}》生成失败。100积分已退回您的账户。",
                message_type="animation_failed",
                related_course_id=course_id
            )
            db.add(message)
            await db.commit()


@router.post("/{course_id}/publish")
async def publish_course_to_square(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    发布课程到广场（设置为公开）

    要求：
    - 必须是课程所有者
    - 课程状态必须是 completed
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
            detail="课程不存在或无权限"
        )

    if course.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能发布已完成的课程"
        )

    # 设置为公开
    course.is_public = True
    await db.commit()
    await db.refresh(course)

    return {
        "message": "发布成功",
        "course": CourseResponse.model_validate(course)
    }


@router.post("/{course_id}/unpublish")
async def unpublish_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取消发布（设置为私有）"""
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
            detail="课程不存在或无权限"
        )

    course.is_public = False
    await db.commit()
    await db.refresh(course)

    return {"message": "已取消发布"}
