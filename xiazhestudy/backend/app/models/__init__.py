"""
PostgreSQL/SQLAlchemy Models

All models use async SQLAlchemy with Supabase PostgreSQL.
"""
from app.models.user import User
from app.models.document import Document
from app.models.course import Course
from app.models.export_task import ExportTask
from app.models.post import Post
from app.models.referral import Referral
from app.models.subscription import Subscription

# Credit System Models（积分系统模型）
from app.models.user_wallet import UserWallet
from app.models.credit_transaction import CreditTransaction
from app.models.invitation import Invitation

# Message & Like Models（消息和点赞模型）
from app.models.message import Message
from app.models.course_like import CourseLike

# Activation Code Model（激活码模型）
from app.models.activation_code import ActivationCode

__all__ = [
    "User",
    "Document",
    "Course",
    "ExportTask",
    "Post",
    "Referral",
    "Subscription",
    # Credit System
    "UserWallet",
    "CreditTransaction",
    "Invitation",
    # Message & Like
    "Message",
    "CourseLike",
    # Activation Code
    "ActivationCode",
]
