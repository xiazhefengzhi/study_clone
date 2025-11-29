from fastapi import APIRouter

router = APIRouter()


@router.get("/current")
async def get_current_subscription():
    """Get current subscription"""
    return {"message": "Get subscription endpoint - to be implemented"}


@router.post("/upgrade")
async def upgrade_subscription():
    """Upgrade subscription"""
    return {"message": "Upgrade subscription endpoint - to be implemented"}
