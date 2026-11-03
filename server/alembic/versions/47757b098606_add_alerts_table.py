"""add_alerts_table

Revision ID: 47757b098606
Revises: c6598d2122c8
Create Date: 2026-09-24 22:08:26.768071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47757b098606'
down_revision: Union[str, Sequence[str], None] = 'c6598d2122c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'alerts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('child_id', sa.UUID(), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=False),
        sa.Column('content_snippet', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('verdict', sa.String(length=20), nullable=False),
        sa.Column('context_app', sa.String(length=100), nullable=True),
        sa.Column('whatsapp_sent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('web_push_sent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['child_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_alerts_category'), 'alerts', ['category'], unique=False)
    op.create_index(op.f('ix_alerts_child_id'), 'alerts', ['child_id'], unique=False)
    op.create_index(op.f('ix_alerts_created_at'), 'alerts', ['created_at'], unique=False)
    op.create_index(op.f('ix_alerts_parent_id'), 'alerts', ['parent_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_alerts_parent_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_created_at'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_child_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_category'), table_name='alerts')
    op.drop_table('alerts')
