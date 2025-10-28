"""Create OCR expense tables

Revision ID: 0004
Revises: 0003
Create Date: 2025-10-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ocr_expense_jobs table
    op.create_table(
        'ocr_expense_jobs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('profile', sa.String(length=50), nullable=False),
        sa.Column('hints', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create ocr_expense_results table
    op.create_table(
        'ocr_expense_results',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('transaction_date', sa.String(length=10), nullable=False),
        sa.Column('amount_value', sa.Integer(), nullable=False),
        sa.Column('amount_currency', sa.String(length=3), nullable=False),
        sa.Column('category_code', sa.String(length=3), nullable=False),
        sa.Column('category_name', sa.String(length=100), nullable=False),
        sa.Column('items_json', sa.JSON(), nullable=True),
        sa.Column('meta_json', sa.JSON(), nullable=True),
        sa.Column('processing_time', sa.Float(), nullable=False),
        sa.Column('word_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['ocr_expense_jobs.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create indexes
    op.create_index('ix_ocr_expense_jobs_session_id', 'ocr_expense_jobs', ['session_id'])
    op.create_index('ix_ocr_expense_jobs_user_id', 'ocr_expense_jobs', ['user_id'])
    op.create_index('ix_ocr_expense_jobs_status', 'ocr_expense_jobs', ['status'])
    op.create_index('ix_ocr_expense_jobs_created_at', 'ocr_expense_jobs', ['created_at'])
    op.create_index('ix_ocr_expense_results_job_id', 'ocr_expense_results', ['job_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_ocr_expense_results_job_id', table_name='ocr_expense_results')
    op.drop_index('ix_ocr_expense_jobs_created_at', table_name='ocr_expense_jobs')
    op.drop_index('ix_ocr_expense_jobs_status', table_name='ocr_expense_jobs')
    op.drop_index('ix_ocr_expense_jobs_user_id', table_name='ocr_expense_jobs')
    op.drop_index('ix_ocr_expense_jobs_session_id', table_name='ocr_expense_jobs')
    
    # Drop tables
    op.drop_table('ocr_expense_results')
    op.drop_table('ocr_expense_jobs')
