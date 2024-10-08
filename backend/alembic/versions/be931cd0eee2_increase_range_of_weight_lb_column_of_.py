"""increase range of weight_lb column of superheroes table

Revision ID: be931cd0eee2
Revises: ad2e3a5a9359
Create Date: 2024-09-09 00:13:03.741083

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "be931cd0eee2"
down_revision: Union[str, None] = "ad2e3a5a9359"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "superheroes",
        "weight_lb",
        existing_type=mysql.DECIMAL(precision=5, scale=2),
        type_=sa.DECIMAL(precision=6, scale=2),
        existing_nullable=True,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "superheroes",
        "weight_lb",
        existing_type=sa.DECIMAL(precision=6, scale=2),
        type_=mysql.DECIMAL(precision=5, scale=2),
        existing_nullable=True,
    )
    # ### end Alembic commands ###
