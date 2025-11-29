"""Fix schema issues - add fail_reason and rename metadata

Revision ID: 003_fix_schema_issues
Revises: 002_complete_schema
Create Date: 2025-11-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_fix_schema_issues'
down_revision = '002_complete_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    升级数据库 schema:
    1. 给 courses 表添加 fail_reason 字段（用于记录课程生成失败原因）
    2. 重命名 subscriptions.metadata -> extra_metadata（避免与 Alembic metadata 混淆）

    注意：使用IF NOT EXISTS确保迁移幂等性
    """
    # Import necessary modules for conditional logic
    from sqlalchemy import inspect
    from alembic import context

    # Get connection
    conn = context.get_bind()
    inspector = inspect(conn)

    # 1. 添加 courses.fail_reason 字段（仅当不存在时）
    courses_columns = [col['name'] for col in inspector.get_columns('courses')]
    if 'fail_reason' not in courses_columns:
        op.add_column('courses',
            sa.Column('fail_reason', sa.Text(), nullable=True,
                      comment='失败原因（status=failed时记录）')
        )

    # 2. 重命名 subscriptions.metadata -> extra_metadata（仅当metadata存在且extra_metadata不存在时）
    subscriptions_columns = [col['name'] for col in inspector.get_columns('subscriptions')]
    if 'metadata' in subscriptions_columns and 'extra_metadata' not in subscriptions_columns:
        op.alter_column('subscriptions', 'metadata',
                        new_column_name='extra_metadata')


def downgrade() -> None:
    """
    回滚数据库 schema
    """
    # 1. 删除 courses.fail_reason 字段
    op.drop_column('courses', 'fail_reason')

    # 2. 恢复 subscriptions.extra_metadata -> metadata
    op.alter_column('subscriptions', 'extra_metadata',
                    new_column_name='metadata')
