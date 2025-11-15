"""Initial migration - Create all tables

Revision ID: 001_initial
Revises:
Create Date: 2025-11-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('supabase_user_id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('subscription_tier', sa.String(length=20), nullable=False, server_default='free'),
        sa.Column('points_balance', sa.Integer(), nullable=False, server_default='500'),
        sa.Column('storage_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_email', 'users', ['email'])
    op.create_index('idx_user_supabase_id', 'users', ['supabase_user_id'])
    op.create_index('idx_user_subscription', 'users', ['subscription_tier'])
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_supabase_user_id'), 'users', ['supabase_user_id'], unique=True)

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

    # Create referrals table
    op.create_table(
        'referrals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('referrer_id', sa.Integer(), nullable=False),
        sa.Column('referee_id', sa.Integer(), nullable=True),
        sa.Column('referral_code', sa.String(length=50), nullable=False),
        sa.Column('reward_points', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('reward_status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['referee_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_referral_code', 'referrals', ['referral_code'])
    op.create_index('idx_referral_completed', 'referrals', ['is_completed'])
    op.create_index('idx_referral_created', 'referrals', ['created_at'])
    op.create_index('idx_referral_referee', 'referrals', ['referee_id'])
    op.create_index('idx_referral_referrer', 'referrals', ['referrer_id'])
    op.create_index('idx_referral_status', 'referrals', ['reward_status'])
    op.create_index(op.f('ix_referrals_referral_code'), 'referrals', ['referral_code'], unique=True)

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
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
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


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('subscriptions')
    op.drop_table('referrals')
    op.drop_table('posts')
    op.drop_table('export_tasks')
    op.drop_table('courses')
    op.drop_table('documents')
    op.drop_table('users')
