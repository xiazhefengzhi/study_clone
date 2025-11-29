"""
直接使用 SQL 重建数据库

此脚本会：
1. 删除所有现有表
2. 根据最新的模型定义重新创建所有表
"""
import asyncio
from app.core.supabase_db import engine, Base
from app.models import *  # 导入所有模型


async def rebuild_database():
    """重建数据库"""
    print("🗑️  删除所有现有表...")

    async with engine.begin() as conn:
        # 删除所有表
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ 所有表已删除")

        print("\n✨ 创建所有新表...")
        # 根据模型定义创建所有表
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 所有表已创建")

    print("\n📊 已创建的表：")
    table_names = [
        "users (包含 auth_provider 字段)",
        "user_wallets (双账户积分系统)",
        "credit_transactions (积分流水)",
        "invitations (邀请记录)",
        "documents",
        "courses",
        "course_likes (课程点赞)",
        "export_tasks",
        "posts",
        "subscriptions",
        "messages (站内信)"
    ]
    for table in table_names:
        print(f"  ✓ {table}")

    print("\n🎉 数据库重建完成！")


if __name__ == "__main__":
    asyncio.run(rebuild_database())
