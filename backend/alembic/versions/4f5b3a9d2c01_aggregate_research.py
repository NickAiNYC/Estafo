"""Add aggregate spending research and import provenance tables.

Revision ID: 4f5b3a9d2c01
Revises: f0038d702f7e
"""

from alembic import op
import sqlalchemy as sa

revision = "4f5b3a9d2c01"
down_revision = "f0038d702f7e"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    provider_columns = {column["name"] for column in inspector.get_columns("providers")}
    for name, column_type in (
        ("total_beneficiaries", sa.Integer()),
        ("total_claims", sa.Integer()),
        ("total_amount", sa.Float()),
    ):
        if name not in provider_columns:
            op.add_column("providers", sa.Column(name, column_type, nullable=True))
    if not inspector.has_table("aggregate_spending_records"):
        op.create_table(
            "aggregate_spending_records",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("billing_npi", sa.String(10), nullable=False),
            sa.Column("servicing_npi", sa.String(10)),
            sa.Column("hcpcs_code", sa.String(10), nullable=False),
            sa.Column("hcpcs_description", sa.Text()),
            sa.Column("year_month", sa.String(7), nullable=False),
            sa.Column("total_paid_amount", sa.Float(), nullable=False),
            sa.Column("total_claims", sa.Integer()),
            sa.Column("total_beneficiaries", sa.Integer()),
            sa.Column("is_suppressed", sa.Boolean()),
            sa.Column("state", sa.String(2)),
            sa.Column("source_dataset", sa.String(100)),
            sa.Column("retrieval_timestamp", sa.DateTime()),
        )
        op.create_index("idx_agg_spend_npi_month", "aggregate_spending_records", ["billing_npi", "year_month"])
        op.create_index("idx_agg_spend_hcpcs", "aggregate_spending_records", ["hcpcs_code", "state"])
    if not inspector.has_table("lead_verification_records"):
        op.create_table(
            "lead_verification_records",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("billing_npi", sa.String(10), nullable=False),
            sa.Column("provider_name", sa.String(255)),
            sa.Column("specialty", sa.String(100)),
            sa.Column("hcpcs_code", sa.String(10)),
            sa.Column("source_dataset", sa.String(100)),
            sa.Column("target_period", sa.String(50), nullable=False),
            sa.Column("total_spending", sa.Float(), nullable=False),
            sa.Column("peer_mean_spending", sa.Float(), nullable=False),
            sa.Column("peer_percentile", sa.Float(), nullable=False),
            sa.Column("z_score", sa.Float(), nullable=False),
            sa.Column("source_record_ids", sa.JSON()),
            sa.Column("documented_assumptions", sa.JSON()),
            sa.Column("checklist_status", sa.JSON()),
            sa.Column("outcome", sa.String(50)),
            sa.Column("outcome_rationale", sa.Text()),
            sa.Column("reviewed_by", sa.String(100)),
            sa.Column("review_time_seconds", sa.Integer()),
            sa.Column("statutory_route", sa.String(100)),
            sa.Column("legal_notice", sa.Text()),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("reviewed_at", sa.DateTime()),
        )
        op.create_index("idx_lead_npi_outcome", "lead_verification_records", ["billing_npi", "outcome"])
        op.create_index("idx_lead_specialty", "lead_verification_records", ["specialty", "outcome"])
    elif "source_dataset" not in {column["name"] for column in inspector.get_columns("lead_verification_records")}:
        op.add_column("lead_verification_records", sa.Column("source_dataset", sa.String(100)))
    if not inspector.has_table("aggregate_import_runs"):
        op.create_table(
            "aggregate_import_runs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("source_dataset", sa.String(100), nullable=False),
            sa.Column("source_url", sa.Text(), nullable=False),
            sa.Column("source_sha256", sa.String(64), nullable=False),
            sa.Column("release_id", sa.String(50), nullable=False),
            sa.Column("hcpcs_code", sa.String(10), nullable=False),
            sa.Column("npi_allowlist_sha256", sa.String(64), nullable=False),
            sa.Column("imported_rows", sa.Integer(), nullable=False),
            sa.Column("imported_at", sa.DateTime(), nullable=False),
            sa.UniqueConstraint("source_sha256", "hcpcs_code", "npi_allowlist_sha256", name="uq_aggregate_import_scope"),
        )
        op.create_index("ix_aggregate_import_runs_source_dataset", "aggregate_import_runs", ["source_dataset"])


def downgrade():
    op.drop_table("aggregate_import_runs")
    op.drop_table("lead_verification_records")
    op.drop_table("aggregate_spending_records")
