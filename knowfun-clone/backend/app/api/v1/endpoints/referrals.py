from fastapi import APIRouter

router = APIRouter()


@router.get("/code")
async def get_referral_code():
    """Get referral code"""
    return {"message": "Get referral code endpoint - to be implemented"}


@router.get("/stats")
async def get_referral_stats():
    """Get referral statistics"""
    return {"message": "Get referral stats endpoint - to be implemented"}
