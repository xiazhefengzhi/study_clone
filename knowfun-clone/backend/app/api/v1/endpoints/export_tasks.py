from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_export_tasks():
    """Get export tasks"""
    return {"message": "Get export tasks endpoint - to be implemented"}


@router.post("/")
async def create_export_task():
    """Create export task"""
    return {"message": "Create export task endpoint - to be implemented"}


@router.get("/stats")
async def get_export_stats():
    """Get export task statistics"""
    return {"message": "Get export stats endpoint - to be implemented"}
