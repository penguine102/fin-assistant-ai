"""Create transactions table

Revision ID: 0003
Revises: 0002
Create Date: 2025-10-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('type', sa.String(length=16), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=True),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('occurred_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'])
    op.create_index('ix_transactions_occurred_at', 'transactions', ['occurred_at'])
    op.create_index('ix_transactions_type', 'transactions', ['type'])


def downgrade() -> None:
    op.drop_index('ix_transactions_type', table_name='transactions')
    op.drop_index('ix_transactions_occurred_at', table_name='transactions')
    op.drop_index('ix_transactions_user_id', table_name='transactions')
    op.drop_table('transactions')


