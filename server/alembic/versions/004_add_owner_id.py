"""add owner_id to ways and spots

Revision ID: 004
Revises: 003
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ways", sa.Column("owner_id", sa.String(), nullable=True))
    op.add_column("spots", sa.Column("owner_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("ways", "owner_id")
    op.drop_column("spots", "owner_id")
