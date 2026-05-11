"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from geoalchemy2 import Geometry

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "ways",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("theme", sa.String(), nullable=False),
        sa.Column("spot_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("distance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cover_photo", sa.String(), nullable=False, server_default=""),
        sa.Column("preview_polyline", Geometry("LINESTRING", srid=4326), nullable=True),
        sa.Column("heat_bucket", sa.String(), nullable=False),
        sa.Column("content_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("saved_count_label", sa.String(), nullable=False, server_default="0"),
        sa.Column("spots", JSONB(), nullable=True),
    )

    op.create_table(
        "spots",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("location", Geometry("POINT", srid=4326), nullable=False),
        sa.Column("region", JSONB(), nullable=True),
        sa.Column("tags", ARRAY(sa.Text()), nullable=True),
        sa.Column("photos", JSONB(), nullable=True),
        sa.Column("way_ids", ARRAY(sa.Text()), nullable=True),
        sa.Column("contents", JSONB(), nullable=True),
        sa.Column("related_ways", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("spots")
    op.drop_table("ways")
