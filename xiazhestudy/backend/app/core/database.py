from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def connect_to_mongo():
    """Connect to MongoDB database"""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    # Import all models here
    from app.models.user import User
    from app.models.document import Document
    from app.models.course import Course
    from app.models.export_task import ExportTask
    from app.models.referral import Referral
    from app.models.subscription import Subscription
    from app.models.post import Post

    await init_beanie(
        database=db.client[settings.MONGODB_DB_NAME],
        document_models=[
            User,
            Document,
            Course,
            ExportTask,
            Referral,
            Subscription,
            Post,
        ],
    )


async def close_mongo_connection():
    """Close MongoDB connection"""
    db.client.close()
