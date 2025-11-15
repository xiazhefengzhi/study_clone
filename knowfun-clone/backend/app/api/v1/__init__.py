from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    documents,
    courses,
    posts,
    ai,
    referrals,
    subscriptions,
    export_tasks,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router.include_router(
    subscriptions.router, prefix="/subscriptions", tags=["subscriptions"]
)
api_router.include_router(
    export_tasks.router, prefix="/export-tasks", tags=["export-tasks"]
)
