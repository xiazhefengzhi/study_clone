import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from supabase import create_client, Client
from app.core.config import settings


class ImageUploader:
    """图片上传工具类 - 使用 Supabase Storage"""

    def __init__(self, bucket_name: str = "images"):
        """
        初始化上传器

        Args:
            bucket_name: Supabase Storage 的 bucket 名称，默认为 'images'
        """
        self.bucket_name = bucket_name

        # 检查 Supabase 配置
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise ValueError(
                "Supabase 配置缺失。请在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY"
            )

        # 初始化 Supabase 客户端（使用 Service Key 以绕过 RLS）
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

        # 允许的图片格式和最大文件大小
        self.allowed_content_types = {
            "image/jpeg", "image/jpg", "image/png",
            "image/gif", "image/webp"
        }
        self.max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    def _validate_file(self, file: UploadFile, file_content: bytes) -> str:
        """
        校验文件类型和大小

        Args:
            file: 上传的文件对象
            file_content: 文件内容

        Returns:
            str: 文件扩展名

        Raises:
            HTTPException: 文件不符合要求
        """
        # 1. 校验文件类型
        if file.content_type not in self.allowed_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型: {file.content_type}. 仅支持: jpg, jpeg, png, gif, webp"
            )

        # 2. 校验文件大小
        if len(file_content) > self.max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件过大. 最大限制: {settings.MAX_FILE_SIZE_MB}MB"
            )

        # 3. 获取文件扩展名
        file_ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
        if not file_ext or file_ext == ".":
            file_ext = ".jpg"  # 默认扩展名

        return file_ext

    def _generate_file_path(self, ext: str, folder: str = "uploads") -> str:
        """
        生成唯一的文件路径
        格式: {folder}/{YYYY}/{MM}/{uuid}.{ext}

        Args:
            ext: 文件扩展名（含点号，如 '.jpg'）
            folder: 业务文件夹名称（如 'avatars', 'courses', 'uploads'）

        Returns:
            str: 完整的存储路径
        """
        now = datetime.now()
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = f"{folder}/{now.year}/{now.month:02d}/{unique_name}"
        return file_path

    async def save_image(self, file: UploadFile, folder: str = "uploads") -> str:
        """
        上传图片到 Supabase Storage 并返回公开访问 URL

        Args:
            file: FastAPI 的 UploadFile 对象
            folder: 存储桶内的子文件夹，如 'avatars', 'courses', 'uploads'

        Returns:
            str: 图片的公开访问 URL

        Raises:
            HTTPException: 上传失败
        """
        try:
            # 1. 读取文件内容
            file_content = await file.read()

            # 2. 校验文件
            file_ext = self._validate_file(file, file_content)

            # 3. 生成存储路径
            file_path = self._generate_file_path(file_ext, folder)

            # 4. 上传到 Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file.content_type}
            )

            # 5. 获取公开访问 URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)

            # 6. 重置文件指针（如果后续还需要使用）
            await file.seek(0)

            return public_url

        except HTTPException:
            # 重新抛出已知的业务异常
            raise
        except Exception as e:
            # 捕获所有其他异常并记录
            error_msg = str(e)
            print(f"[ImageUploader] 上传失败: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"图片上传失败: {error_msg}"
            )
        finally:
            # 确保文件对象被关闭
            await file.close()


# 创建默认的图片上传器实例
image_uploader = ImageUploader(bucket_name="images")
