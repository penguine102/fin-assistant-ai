"""Convert IDs to UUID

Revision ID: 0002
Revises: 0001
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name if bind else 'default'

    if dialect == 'sqlite':
        # Dev-friendly destructive migration for SQLite: drop and recreate with UUID schema
        with op.batch_alter_table('messages', recreate='always') as batch_op:
            pass
        op.drop_table('messages')

        with op.batch_alter_table('sessions', recreate='always') as batch_op:
            pass
        op.drop_table('sessions')

        with op.batch_alter_table('users', recreate='always') as batch_op:
            pass
        op.drop_table('users')

        # Recreate users with UUID primary key
        op.create_table(
            'users',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('password_hash', sa.String(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_users_email', 'users', ['email'], unique=True)

        # Recreate sessions with UUIDs
        op.create_table(
            'sessions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('session_name', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
        op.create_index('ix_sessions_created_at', 'sessions', ['created_at'])

        # Recreate messages with UUIDs
        op.create_table(
            'messages',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('session_id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('message_metadata', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['session_id'], ['sessions.id']),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_messages_session_id', 'messages', ['session_id'])
        op.create_index('ix_messages_user_id', 'messages', ['user_id'])
        op.create_index('ix_messages_created_at', 'messages', ['created_at'])

        return

    # Default path (e.g., PostgreSQL): original non-destructive UUID migration
    # Drop foreign key constraints first
    op.drop_constraint('messages_user_id_fkey', 'messages', type_='foreignkey')
    op.drop_constraint('messages_session_id_fkey', 'messages', type_='foreignkey')
    op.drop_constraint('sessions_user_id_fkey', 'sessions', type_='foreignkey')

    # Drop indexes that reference the columns we're changing
    op.drop_index('ix_messages_user_id', table_name='messages')
    op.drop_index('ix_messages_session_id', table_name='messages')
    op.drop_index('ix_sessions_user_id', table_name='sessions')

    # Add new UUID columns
    op.add_column('users', sa.Column('id_new', sa.String(36), nullable=True))
    op.add_column('sessions', sa.Column('id_new', sa.String(36), nullable=True))
    op.add_column('sessions', sa.Column('user_id_new', sa.String(36), nullable=True))
    op.add_column('messages', sa.Column('id_new', sa.String(36), nullable=True))
    op.add_column('messages', sa.Column('session_id_new', sa.String(36), nullable=True))
    op.add_column('messages', sa.Column('user_id_new', sa.String(36), nullable=True))

    # Generate UUIDs for existing records (Postgres-specific function)
    op.execute("UPDATE users SET id_new = gen_random_uuid()::text")
    op.execute("UPDATE sessions SET id_new = gen_random_uuid()::text")
    op.execute("UPDATE messages SET id_new = gen_random_uuid()::text")

    # Update foreign key references
    op.execute(
        """
        UPDATE sessions SET user_id_new = users.id_new 
        FROM users 
        WHERE sessions.user_id = users.id
        """
    )

    op.execute(
        """
        UPDATE messages SET session_id_new = sessions.id_new 
        FROM sessions 
        WHERE messages.session_id = sessions.id
        """
    )

    op.execute(
        """
        UPDATE messages SET user_id_new = users.id_new 
        FROM users 
        WHERE messages.user_id = users.id
        """
    )

    # Drop old columns
    op.drop_column('messages', 'user_id')
    op.drop_column('messages', 'session_id')
    op.drop_column('messages', 'id')
    op.drop_column('sessions', 'user_id')
    op.drop_column('sessions', 'id')
    op.drop_column('users', 'id')

    # Rename new columns to original names
    op.alter_column('users', 'id_new', new_column_name='id')
    op.alter_column('sessions', 'id_new', new_column_name='id')
    op.alter_column('sessions', 'user_id_new', new_column_name='user_id')
    op.alter_column('messages', 'id_new', new_column_name='id')
    op.alter_column('messages', 'session_id_new', new_column_name='session_id')
    op.alter_column('messages', 'user_id_new', new_column_name='user_id')

    # Make columns NOT NULL and set as primary keys
    op.alter_column('users', 'id', nullable=False)
    op.alter_column('sessions', 'id', nullable=False)
    op.alter_column('sessions', 'user_id', nullable=False)
    op.alter_column('messages', 'id', nullable=False)
    op.alter_column('messages', 'session_id', nullable=False)
    op.alter_column('messages', 'user_id', nullable=False)

    # Add primary key constraints
    op.create_primary_key('users_pkey', 'users', ['id'])
    op.create_primary_key('sessions_pkey', 'sessions', ['id'])
    op.create_primary_key('messages_pkey', 'messages', ['id'])

    # Add foreign key constraints
    op.create_foreign_key('sessions_user_id_fkey', 'sessions', 'users', ['user_id'], ['id'])
    op.create_foreign_key('messages_session_id_fkey', 'messages', 'sessions', ['session_id'], ['id'])
    op.create_foreign_key('messages_user_id_fkey', 'messages', 'users', ['user_id'], ['id'])

    # Recreate indexes
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
    op.create_index('ix_messages_session_id', 'messages', ['session_id'])
    op.create_index('ix_messages_user_id', 'messages', ['user_id'])


def downgrade() -> None:
    # This is a complex downgrade that would require careful handling
    # For now, we'll just drop the tables and recreate them
    # In production, you'd want a more sophisticated approach
    
    # Drop foreign key constraints
    op.drop_constraint('messages_user_id_fkey', 'messages', type_='foreignkey')
    op.drop_constraint('messages_session_id_fkey', 'messages', type_='foreignkey')
    op.drop_constraint('sessions_user_id_fkey', 'sessions', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('ix_messages_user_id', table_name='messages')
    op.drop_index('ix_messages_session_id', table_name='messages')
    op.drop_index('ix_sessions_user_id', table_name='sessions')
    
    # Drop primary key constraints
    op.drop_constraint('messages_pkey', 'messages', type_='primary')
    op.drop_constraint('sessions_pkey', 'sessions', type_='primary')
    op.drop_constraint('users_pkey', 'users', type_='primary')
    
    # Add new integer columns
    op.add_column('users', sa.Column('id_new', sa.Integer(), autoincrement=True, nullable=True))
    op.add_column('sessions', sa.Column('id_new', sa.Integer(), autoincrement=True, nullable=True))
    op.add_column('sessions', sa.Column('user_id_new', sa.Integer(), nullable=True))
    op.add_column('messages', sa.Column('id_new', sa.Integer(), autoincrement=True, nullable=True))
    op.add_column('messages', sa.Column('session_id_new', sa.Integer(), nullable=True))
    op.add_column('messages', sa.Column('user_id_new', sa.Integer(), nullable=True))
    
    # Generate sequential IDs for existing records
    op.execute("""
        WITH numbered_users AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_id
            FROM users
        )
        UPDATE users SET id_new = numbered_users.new_id
        FROM numbered_users
        WHERE users.id = numbered_users.id
    """)
    
    op.execute("""
        WITH numbered_sessions AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_id
            FROM sessions
        )
        UPDATE sessions SET id_new = numbered_sessions.new_id
        FROM numbered_sessions
        WHERE sessions.id = numbered_sessions.id
    """)
    
    op.execute("""
        WITH numbered_messages AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_id
            FROM messages
        )
        UPDATE messages SET id_new = numbered_messages.new_id
        FROM numbered_messages
        WHERE messages.id = numbered_messages.id
    """)
    
    # Update foreign key references
    op.execute("""
        UPDATE sessions SET user_id_new = users.id_new 
        FROM users 
        WHERE sessions.user_id = users.id
    """)
    
    op.execute("""
        UPDATE messages SET session_id_new = sessions.id_new 
        FROM sessions 
        WHERE messages.session_id = sessions.id
    """)
    
    op.execute("""
        UPDATE messages SET user_id_new = users.id_new 
        FROM users 
        WHERE messages.user_id = users.id
    """)
    
    # Drop old columns
    op.drop_column('messages', 'user_id')
    op.drop_column('messages', 'session_id')
    op.drop_column('messages', 'id')
    op.drop_column('sessions', 'user_id')
    op.drop_column('sessions', 'id')
    op.drop_column('users', 'id')
    
    # Rename new columns to original names
    op.alter_column('users', 'id_new', new_column_name='id')
    op.alter_column('sessions', 'id_new', new_column_name='id')
    op.alter_column('sessions', 'user_id_new', new_column_name='user_id')
    op.alter_column('messages', 'id_new', new_column_name='id')
    op.alter_column('messages', 'session_id_new', new_column_name='session_id')
    op.alter_column('messages', 'user_id_new', new_column_name='user_id')
    
    # Make columns NOT NULL and set as primary keys
    op.alter_column('users', 'id', nullable=False)
    op.alter_column('sessions', 'id', nullable=False)
    op.alter_column('sessions', 'user_id', nullable=False)
    op.alter_column('messages', 'id', nullable=False)
    op.alter_column('messages', 'session_id', nullable=False)
    op.alter_column('messages', 'user_id', nullable=False)
    
    # Add primary key constraints
    op.create_primary_key('users_pkey', 'users', ['id'])
    op.create_primary_key('sessions_pkey', 'sessions', ['id'])
    op.create_primary_key('messages_pkey', 'messages', ['id'])
    
    # Add foreign key constraints
    op.create_foreign_key('sessions_user_id_fkey', 'sessions', 'users', ['user_id'], ['id'])
    op.create_foreign_key('messages_session_id_fkey', 'messages', 'sessions', ['session_id'], ['id'])
    op.create_foreign_key('messages_user_id_fkey', 'messages', 'users', ['user_id'], ['id'])
    
    # Recreate indexes
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
    op.create_index('ix_messages_session_id', 'messages', ['session_id'])
    op.create_index('ix_messages_user_id', 'messages', ['user_id'])
