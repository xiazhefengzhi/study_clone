"""
Task Queue Service using Upstash QStash (FREE)
"""
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings


class QStashService:
    """Task queue service using Upstash QStash"""

    def __init__(self):
        self.base_url = settings.QSTASH_URL
        self.token = settings.QSTASH_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def enqueue_task(
        self,
        task_name: str,
        payload: Dict[str, Any],
        delay: Optional[int] = None,
    ) -> dict:
        """
        Enqueue a task to QStash

        Args:
            task_name: Task handler endpoint (e.g., "generate_course")
            payload: Task data
            delay: Delay in seconds before execution

        Returns:
            Response with message ID
        """
        # Construct callback URL
        callback_url = f"{settings.API_URL}/api/tasks/{task_name}"

        # Build request
        url = f"{self.base_url}/v2/publish/{callback_url}"
        headers = self.headers.copy()

        # Add delay if specified
        if delay:
            headers["Upstash-Delay"] = f"{delay}s"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, headers=headers, json=payload, timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def schedule_task(
        self,
        task_name: str,
        payload: Dict[str, Any],
        cron: str,
    ) -> dict:
        """
        Schedule a recurring task

        Args:
            task_name: Task handler endpoint
            payload: Task data
            cron: Cron expression (e.g., "*/5 * * * *")

        Returns:
            Response with schedule ID
        """
        callback_url = f"{settings.API_URL}/api/tasks/{task_name}"
        url = f"{self.base_url}/v2/schedules"

        data = {
            "destination": callback_url,
            "cron": cron,
            "body": payload,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, headers=self.headers, json=data, timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def cancel_schedule(self, schedule_id: str) -> bool:
        """
        Cancel a scheduled task

        Args:
            schedule_id: ID returned from schedule_task

        Returns:
            True if successful
        """
        url = f"{self.base_url}/v2/schedules/{schedule_id}"

        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers, timeout=30.0)
            return response.status_code == 200


# Example task handlers
async def handle_document_processing(payload: Dict[str, Any]):
    """Task handler for document processing"""
    document_id = payload.get("document_id")
    # Process document...
    print(f"Processing document: {document_id}")


async def handle_course_generation(payload: Dict[str, Any]):
    """Task handler for course generation"""
    document_id = payload.get("document_id")
    # Generate course...
    print(f"Generating course for document: {document_id}")


async def handle_export_task(payload: Dict[str, Any]):
    """Task handler for export"""
    course_id = payload.get("course_id")
    export_type = payload.get("export_type")
    # Export course...
    print(f"Exporting course {course_id} as {export_type}")


# Singleton instance
qstash_service = QStashService() if settings.use_qstash else None
