"""
Supabase Storage Service

Provides file upload/download functionality using Supabase Storage.
"""
from typing import BinaryIO, Optional, Dict, List
from fastapi import HTTPException, status, UploadFile
from supabase import create_client, Client
from pathlib import Path
import uuid
from datetime import datetime

from app.core.config import settings


class StorageService:
    """Supabase Storage service for file management"""

    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        self.bucket_name = settings.SUPABASE_BUCKET_NAME

    async def upload_file(
        self,
        file: UploadFile,
        user_id: int,
        folder: str = "documents"
    ) -> Dict[str, str]:
        """
        Upload file to Supabase Storage

        Args:
            file: File to upload
            user_id: User ID for organizing files
            folder: Storage folder (documents, courses, exports, etc.)

        Returns:
            Dictionary with file_path and public_url
        """
        try:
            # Generate unique filename
            file_ext = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = f"{folder}/user_{user_id}/{unique_filename}"

            # Read file content
            content = await file.read()

            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                file_path,
                content,
                file_options={
                    "content-type": file.content_type or "application/octet-stream"
                }
            )

            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)

            return {
                "file_path": file_path,
                "public_url": public_url,
                "filename": file.filename,
                "size": len(content)
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )

    async def upload_bytes(
        self,
        content: bytes,
        filename: str,
        user_id: int,
        folder: str = "exports",
        content_type: str = "application/octet-stream"
    ) -> Dict[str, str]:
        """
        Upload bytes directly to storage

        Args:
            content: File content as bytes
            filename: Original filename
            user_id: User ID
            folder: Storage folder
            content_type: MIME type

        Returns:
            Dictionary with file_path and public_url
        """
        try:
            # Generate unique filename
            file_ext = Path(filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = f"{folder}/user_{user_id}/{unique_filename}"

            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                file_path,
                content,
                file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)

            return {
                "file_path": file_path,
                "public_url": public_url,
                "filename": filename,
                "size": len(content)
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )

    async def download_file(self, file_path: str) -> bytes:
        """
        Download file from Supabase Storage

        Args:
            file_path: Path to file in storage

        Returns:
            File content as bytes
        """
        try:
            content = self.supabase.storage.from_(self.bucket_name).download(file_path)
            return content

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {str(e)}"
            )

    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file from Supabase Storage

        Args:
            file_path: Path to file in storage

        Returns:
            True if successful
        """
        try:
            self.supabase.storage.from_(self.bucket_name).remove([file_path])
            return True

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File deletion failed: {str(e)}"
            )

    async def delete_folder(self, folder_path: str) -> bool:
        """
        Delete entire folder from storage

        Args:
            folder_path: Path to folder

        Returns:
            True if successful
        """
        try:
            # List all files in folder
            files = self.supabase.storage.from_(self.bucket_name).list(folder_path)

            if files:
                # Delete all files
                file_paths = [f"{folder_path}/{file['name']}" for file in files]
                self.supabase.storage.from_(self.bucket_name).remove(file_paths)

            return True

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Folder deletion failed: {str(e)}"
            )

    async def list_files(self, folder_path: str) -> List[Dict]:
        """
        List files in a folder

        Args:
            folder_path: Path to folder

        Returns:
            List of file metadata
        """
        try:
            files = self.supabase.storage.from_(self.bucket_name).list(folder_path)
            return files

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list files: {str(e)}"
            )

    def get_public_url(self, file_path: str) -> str:
        """
        Get public URL for a file

        Args:
            file_path: Path to file in storage

        Returns:
            Public URL
        """
        return self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)


# Global storage service instance
storage_service = StorageService()
