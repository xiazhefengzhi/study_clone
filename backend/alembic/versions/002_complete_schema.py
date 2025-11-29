"""Complete schema - All tables with latest structure

Revision ID: 002_complete_schema
Revises: 001_initial
Create Date: 2025-11-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_complete_schema'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop all existing tables
    op.execute('DROP TABLE IF EXISTS course_likes CASCADE')
    op.execute('DROP TABLE IF EXISTS messages CASCADE')
    op.execute('DROP TABLE IF EXISTS credit_transactions CASCADE')
    op.execute('DROP TABLE IF EXISTS user_wallets CASCADE')
    op.execute('DROP TABLE IF EXISTS invitations CASCADE')
    op.execute('DROP TABLE IF EXISTS subscriptions CASCADE')
    op.execute('DROP TABLE IF EXISTS referrals CASCADE')
    op.execute('DROP TABLE IF EXISTS posts CASCADE')
    op.execute('DROP TABLE IF EXISTS export_tasks CASCADE')
    op.execute('DROP TABLE IF EXISTS courses CASCADE')
    op.execute('DROP TABLE IF EXISTS documents CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('supabase_user_id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('auth_provider', sa.String(length=20), nullable=False, server_default='email', comment='Authentication provider: email, google, etc.'),
        sa.Column('subscription_tier', sa.String(length=20), nullable=False, server_default='free'),
        sa.Column('points_balance', sa.Integer(), nullable=False, server_default='500'),
        sa.Column('storage_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('referral_code', sa.String(length=20), nullable=True, comment='用户的邀请码'),
        sa.Column('referred_by_id', sa.Integer(), nullable=True, comment='谁邀请了我（邀请人ID）'),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True, comment='Stripe客户ID'),
        sa.Column('current_plan_id', sa.String(length=50), nullable=False, server_default='free', comment='当前套餐ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_email', 'users', ['email'])
    op.create_index('idx_user_supabase_id', 'users', ['supabase_user_id'])
    op.create_index('idx_user_subscription', 'users', ['subscription_tier'])
    op.create_index('idx_user_referral_code', 'users', ['referral_code'])
    op.create_index('idx_user_stripe_customer', 'users', ['stripe_customer_id'])
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_supabase_user_id'), 'users', ['supabase_user_id'], unique=True)
    op.create_index(op.f('ix_users_referral_code'), 'users', ['referral_code'], unique=True)
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)

    # Create user_wallets table (双账户积分系统)
    op.create_table(
        'user_wallets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permanent_balance', sa.Integer(), nullable=False, server_default='0', comment='永久积分余额，永不过期'),
        sa.Column('subscription_balance', sa.Integer(), nullable=False, server_default='0', comment='订阅积分余额，每月重置'),
        sa.Column('subscription_expires_at', sa.DateTime(), nullable=True, comment='订阅积分过期时间'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_wallet_user', 'user_wallets', ['user_id'], unique=True)

    # Create credit_transactions table (积分交易记录)
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False, comment='积分变动金额，正数为获取，负数为消耗'),
        sa.Column('transaction_type', sa.String(length=50), nullable=False, comment='交易类型'),
        sa.Column('balance_source', sa.String(length=20), nullable=True, comment='资金来源：PERMANENT/SUBSCRIPTION/MIXED'),
        sa.Column('snapshot_permanent', sa.Integer(), nullable=True, comment='变动后永久积分余额快照'),
        sa.Column('snapshot_subscription', sa.Integer(), nullable=True, comment='变动后订阅积分余额快照'),
        sa.Column('description', sa.Text(), nullable=True, comment='交易描述'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_trans_user', 'credit_transactions', ['user_id'])
    op.create_index('idx_trans_type', 'credit_transactions', ['transaction_type'])
    op.create_index('idx_trans_created', 'credit_transactions', ['created_at'])
    op.create_index('idx_trans_user_created', 'credit_transactions', ['user_id', 'created_at'])

    # Create invitations table (邀请记录)
    op.create_table(
        'invitations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('inviter_id', sa.Integer(), nullable=False, comment='邀请人ID'),
        sa.Column('invitee_id', sa.Integer(), nullable=False, comment='被邀请人ID（一个用户只能被邀请一次）'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING', comment='邀请状态'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), comment='邀请创建时间（注册时间）'),
        sa.Column('completed_at', sa.DateTime(), nullable=True, comment='邀请完成时间（验证邮箱时间）'),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invitee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_invitation_inviter', 'invitations', ['inviter_id'])
    op.create_index('idx_invitation_invitee', 'invitations', ['invitee_id'], unique=True)
    op.create_index('idx_invitation_status', 'invitations', ['status'])
    op.create_index('idx_invitation_created', 'invitations', ['created_at'])
    op.create_index('idx_invitation_inviter_created', 'invitations', ['inviter_id', 'created_at'])
    op.create_index('idx_invitation_inviter_status', 'invitations', ['inviter_id', 'status'])

    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=1000), nullable=False),
        sa.Column('file_type', sa.String(length=20), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_document_created', 'documents', ['created_at'])
    op.create_index('idx_document_status', 'documents', ['status'])
    op.create_index('idx_document_user', 'documents', ['user_id'])
    op.create_index('idx_document_user_status', 'documents', ['user_id', 'status'])

    # Create courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_image', sa.String(length=1000), nullable=True),
        sa.Column('style', sa.String(length=50), nullable=False, server_default='standard'),
        sa.Column('difficulty', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('content', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('fail_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_course_category', 'courses', ['category'])
    op.create_index('idx_course_created', 'courses', ['created_at'])
    op.create_index('idx_course_document', 'courses', ['document_id'])
    op.create_index('idx_course_public', 'courses', ['is_public'])
    op.create_index('idx_course_status', 'courses', ['status'])
    op.create_index('idx_course_user', 'courses', ['user_id'])

    # Create course_likes table (课程点赞)
    op.create_table(
        'course_likes',
        sa.Column('user_id', sa.Integer(), nullable=False, comment='点赞用户ID'),
        sa.Column('course_id', sa.Integer(), nullable=False, comment='被点赞的课程ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), comment='点赞时间'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'course_id')
    )
    op.create_index('idx_course_like_user', 'course_likes', ['user_id'])
    op.create_index('idx_course_like_course', 'course_likes', ['course_id'])
    op.create_index('idx_course_like_created', 'course_likes', ['created_at'])

    # Create export_tasks table
    op.create_table(
        'export_tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('export_type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('file_url', sa.String(length=1000), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estimated_time', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_export_course', 'export_tasks', ['course_id'])
    op.create_index('idx_export_created', 'export_tasks', ['created_at'])
    op.create_index('idx_export_status', 'export_tasks', ['status'])
    op.create_index('idx_export_type', 'export_tasks', ['export_type'])
    op.create_index('idx_export_user', 'export_tasks', ['user_id'])
    op.create_index('idx_export_user_status', 'export_tasks', ['user_id', 'status'])

    # Create posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('cover_image', sa.String(length=1000), nullable=True),
        sa.Column('post_type', sa.String(length=20), nullable=False, server_default='article'),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('shares_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='published'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_post_category', 'posts', ['category'])
    op.create_index('idx_post_course', 'posts', ['course_id'])
    op.create_index('idx_post_created', 'posts', ['created_at'])
    op.create_index('idx_post_featured', 'posts', ['is_featured'])
    op.create_index('idx_post_public', 'posts', ['is_public'])
    op.create_index('idx_post_published', 'posts', ['published_at'])
    op.create_index('idx_post_status', 'posts', ['status'])
    op.create_index('idx_post_type', 'posts', ['post_type'])
    op.create_index('idx_post_user', 'posts', ['user_id'])

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tier', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('payment_provider', sa.String(length=50), nullable=True),
        sa.Column('payment_id', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('billing_cycle', sa.String(length=20), nullable=False, server_default='monthly'),
        sa.Column('current_period_start', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('current_period_end', sa.DateTime(), nullable=False),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('credits_granted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('storage_quota', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('extra_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_subscription_payment_id', 'subscriptions', ['payment_id'])
    op.create_index('idx_subscription_period_end', 'subscriptions', ['current_period_end'])
    op.create_index('idx_subscription_status', 'subscriptions', ['status'])
    op.create_index('idx_subscription_tier', 'subscriptions', ['tier'])
    op.create_index('idx_subscription_user', 'subscriptions', ['user_id'])
    op.create_index('idx_subscription_user_status', 'subscriptions', ['user_id', 'status'])

    # Create messages table (站内信)
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, comment='接收消息的用户ID'),
        sa.Column('title', sa.String(length=200), nullable=False, comment='消息标题'),
        sa.Column('content', sa.Text(), nullable=False, comment='消息内容'),
        sa.Column('message_type', sa.String(length=50), nullable=False, server_default='system', comment='消息类型'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false', comment='是否已读'),
        sa.Column('related_course_id', sa.Integer(), nullable=True, comment='关联的课程/动画ID，方便点击跳转'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('read_at', sa.DateTime(), nullable=True, comment='阅读时间'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_message_user', 'messages', ['user_id'])
    op.create_index('idx_message_is_read', 'messages', ['is_read'])
    op.create_index('idx_message_type', 'messages', ['message_type'])
    op.create_index('idx_message_created', 'messages', ['created_at'])
    op.create_index('idx_message_user_unread', 'messages', ['user_id', 'is_read'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('messages')
    op.drop_table('subscriptions')
    op.drop_table('posts')
    op.drop_table('export_tasks')
    op.drop_table('course_likes')
    op.drop_table('courses')
    op.drop_table('documents')
    op.drop_table('invitations')
    op.drop_table('credit_transactions')
    op.drop_table('user_wallets')
    op.drop_table('users')
