"""add_pairing_pin_and_admin_fields

Revision ID: a1b2c3d4e5f6
Revises: 0f94376df0cc
Create Date: 2026-11-02 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0f94376df0cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pairing PIN fields, user active status, and alert review tracking."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))

    with op.batch_alter_table('family_members', schema=None) as batch_op:
        batch_op.add_column(sa.Column('pairing_pin', sa.String(length=12), nullable=True))
        batch_op.add_column(sa.Column('pairing_pin_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('is_paired', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.create_index(batch_op.f('ix_family_members_pairing_pin'), ['pairing_pin'], unique=False)

    with op.batch_alter_table('alerts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('review_status', sa.String(length=30), nullable=False, server_default='PENDING'))
        batch_op.add_column(sa.Column('access_request_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove pairing PIN fields, user active status, and alert review tracking."""
    with op.batch_alter_table('alerts', schema=None) as batch_op:
        batch_op.drop_column('access_request_reason')
        batch_op.drop_column('review_status')

    with op.batch_alter_table('family_members', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_family_members_pairing_pin'))
        batch_op.drop_column('is_paired')
        batch_op.drop_column('pairing_pin_expires_at')
        batch_op.drop_column('pairing_pin')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('is_active')
