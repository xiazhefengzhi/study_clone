#!/bin/bash
# 数据库重建脚本

echo "🗑️  删除现有数据库和迁移历史..."
cd /Users/ganguohua/Desktop/xiazhe_2025/project_front/knowfun-clone/backend

# 重置 Alembic 版本历史
alembic stamp head
alembic downgrade base

echo "✨ 应用新的完整架构..."
# 直接应用最新的迁移
alembic upgrade head

echo "✅ 数据库重建完成！"
echo ""
echo "📊 表结构："
echo "  - users (包含 auth_provider 字段)"
echo "  - user_wallets (双账户积分系统)"
echo "  - credit_transactions (积分流水)"
echo "  - invitations (邀请记录)"
echo "  - documents"
echo "  - courses"
echo "  - course_likes (课程点赞)"
echo "  - export_tasks"
echo "  - posts"
echo "  - subscriptions"
echo "  - messages (站内信)"
