"""Create the versioned SIGNAL ledger and analysis tables."""
from alembic import op
from backend.db import meta
revision='001_signal'
down_revision=None
branch_labels=None
depends_on=None
def upgrade():meta.create_all(op.get_bind())
def downgrade():raise RuntimeError('Use a database backup to roll back; automated ledger deletion is disabled.')
