"""Engine V3 - real data pipeline, outcomes DB, SOL clocks, cross-signal, case-selection intel.

Adds 12 tables:
  provider_locations, nppes_import_runs, hhs_release_registry,
  exclusion_screen_runs, exclusion_matches, fca_outcome_cases,
  lead_sol_clocks, pipeline_stage_events, original_source_tips,
  public_disclosure_hits, declination_records, release_diff_findings

Revision ID: b7e2f9a1c3d5
Revises: 4f5b3a9d2c01
"""

from alembic import op
import sqlalchemy as sa

revision = "b7e2f9a1c3d5"
down_revision = "4f5b3a9d2c01"
branch_labels = None
depends_on = None

TABLES = {
    "provider_locations": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("npi", sa.String(10), dict(nullable=False, unique=True, index=True)),
        ("practice_address", sa.String(500), {}),
        ("city", sa.String(100), {}),
        ("state", sa.String(2), {}),
        ("zip_code", sa.String(10), {}),
        ("latitude", sa.Float(), {}),
        ("longitude", sa.Float(), {}),
        ("borough", sa.String(50), {}),
        ("geocode_source", sa.String(50), {}),
        ("geocode_quality", sa.String(20), {}),
        ("updated_at", sa.DateTime(), {}),
    ],
    "nppes_import_runs": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("file_label", sa.String(200), dict(nullable=False)),
        ("source_url", sa.Text(), {}),
        ("source_sha256", sa.String(64), dict(nullable=False)),
        ("rows_total", sa.Integer(), dict(nullable=False)),
        ("rows_luhn_valid", sa.Integer(), dict(nullable=False)),
        ("rows_nyc", sa.Integer(), dict(nullable=False)),
        ("rows_deactivated", sa.Integer(), {}),
        ("providers_upserted", sa.Integer(), {}),
        ("locations_upserted", sa.Integer(), {}),
        ("imported_at", sa.DateTime(), dict(nullable=False)),
    ],
    "hhs_release_registry": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("release_id", sa.String(50), dict(nullable=False, unique=True)),
        ("zip_url", sa.Text(), {}),
        ("expected_sha256", sa.String(64), {}),
        ("status", sa.String(20), dict(index=True)),
        ("hcpcs_imported", sa.JSON(), {}),
        ("imported_rows", sa.Integer(), {}),
        ("discovered_at", sa.DateTime(), {}),
        ("imported_at", sa.DateTime(), {}),
        ("notes", sa.Text(), {}),
    ],
    "exclusion_screen_runs": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("source", sa.String(30), dict(nullable=False, index=True)),
        ("source_url", sa.Text(), {}),
        ("source_sha256", sa.String(64), dict(nullable=False)),
        ("exclusion_records", sa.Integer(), dict(nullable=False)),
        ("providers_screened", sa.Integer(), dict(nullable=False)),
        ("matches_found", sa.Integer(), {}),
        ("new_matches", sa.Integer(), {}),
        ("ran_at", sa.DateTime(), dict(nullable=False)),
        ("status", sa.String(20), {}),
    ],
    "exclusion_matches": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("npi", sa.String(10), dict(nullable=False, index=True)),
        ("provider_name", sa.String(255), {}),
        ("source", sa.String(30), dict(nullable=False, index=True)),
        ("match_type", sa.String(20), dict(nullable=False)),
        ("match_score", sa.Float(), dict(nullable=False)),
        ("excluded_name", sa.String(255), {}),
        ("exclusion_type", sa.String(100), {}),
        ("exclusion_date", sa.Date(), {}),
        ("source_detail_url", sa.Text(), {}),
        ("first_seen_run_id", sa.Integer(), {}),
        ("last_seen_run_id", sa.Integer(), {}),
        ("status", sa.String(20), dict(index=True)),
        ("resolution_note", sa.Text(), {}),
        ("detected_at", sa.DateTime(), {}),
    ],
    "fca_outcome_cases": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("case_label", sa.String(300), dict(nullable=False)),
        ("docket_or_matter", sa.String(200), {}),
        ("scheme_type", sa.String(60), dict(nullable=False, index=True)),
        ("state", sa.String(2), dict(index=True)),
        ("jurisdiction", sa.String(20), {}),
        ("year", sa.Integer(), dict(index=True)),
        ("filed_year", sa.Integer(), {}),
        ("single_damages", sa.Float(), {}),
        ("penalties", sa.Float(), {}),
        ("total_recovery", sa.Float(), {}),
        ("relator_share_amount", sa.Float(), {}),
        ("relator_share_pct", sa.Float(), {}),
        ("intervened", sa.String(20), {}),
        ("days_filing_to_resolution", sa.Integer(), {}),
        ("outcome_type", sa.String(30), {}),
        ("source_url", sa.Text(), {}),
        ("source_label", sa.String(120), {}),
        ("confidence", sa.String(10), {}),
        ("verified", sa.Boolean(), {}),
        ("notes", sa.Text(), {}),
        ("created_at", sa.DateTime(), {}),
    ],
    "lead_sol_clocks": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("npi", sa.String(10), dict(nullable=False, unique=True, index=True)),
        ("hcpcs_code", sa.String(10), {}),
        ("first_violation_date", sa.Date(), {}),
        ("latest_violation_date", sa.Date(), {}),
        ("government_knowledge_date", sa.Date(), {}),
        ("anchor_verified", sa.Boolean(), {}),
        ("federal_deadline", sa.Date(), {}),
        ("federal_bar_date", sa.Date(), {}),
        ("ny_state_deadline", sa.Date(), {}),
        ("nyc_deadline", sa.Date(), {}),
        ("days_remaining", sa.Integer(), {}),
        ("urgency_tier", sa.String(20), {}),
        ("claims_time_barred_pct", sa.Float(), {}),
        ("enpv_at_discovery", sa.Float(), {}),
        ("enpv_current", sa.Float(), {}),
        ("decay_half_life_days", sa.Integer(), {}),
        ("stale_days", sa.Integer(), {}),
        ("last_computed_at", sa.DateTime(), {}),
        ("notes", sa.Text(), {}),
    ],
    "pipeline_stage_events": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("npi", sa.String(10), dict(nullable=False, index=True)),
        ("stage", sa.String(30), dict(nullable=False, index=True)),
        ("occurred_at", sa.DateTime(), dict(nullable=False, index=True)),
        ("actor", sa.String(100), {}),
        ("days_since_previous_stage", sa.Integer(), {}),
        ("notes", sa.Text(), {}),
    ],
    "original_source_tips": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("tip_ref", sa.String(20), dict(nullable=False, unique=True, index=True)),
        ("narrative_sha256", sa.String(64), dict(nullable=False)),
        ("narrative_length_chars", sa.Integer(), {}),
        ("allegation_scheme", sa.String(60), {}),
        ("target_state", sa.String(2), {}),
        ("received_at", sa.DateTime(), dict(nullable=False)),
        ("timestamp_note", sa.String(120), {}),
        ("bar_check_status", sa.String(20), {}),
        ("original_source_assessment", sa.String(20), {}),
        ("status", sa.String(20), dict(index=True)),
        ("counsel_engaged_at", sa.DateTime(), {}),
        ("declaration_generated_at", sa.DateTime(), {}),
        ("notes", sa.Text(), {}),
    ],
    "public_disclosure_hits": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("target", sa.String(255), dict(nullable=False, index=True)),
        ("npi", sa.String(10), dict(index=True)),
        ("source_type", sa.String(20), dict(nullable=False)),
        ("title", sa.String(500), {}),
        ("url", sa.Text(), {}),
        ("published_date", sa.Date(), {}),
        ("similarity", sa.Float(), {}),
        ("discloses_allegations", sa.Boolean(), {}),
        ("found_at", sa.DateTime(), {}),
        ("checked_against_tip_ref", sa.String(20), {}),
    ],
    "declination_records": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("npi", sa.String(10), dict(index=True)),
        ("case_label", sa.String(300), {}),
        ("scheme_type", sa.String(60), {}),
        ("declined_by", sa.String(30), dict(nullable=False)),
        ("declined_at", sa.Date(), {}),
        ("reason_code", sa.String(40), {}),
        ("reason_note", sa.Text(), {}),
        ("estimated_single_damages", sa.Float(), {}),
        ("shopped_to", sa.JSON(), {}),
        ("outcome", sa.String(30), {}),
        ("resolved_amount", sa.Float(), {}),
        ("notes", sa.Text(), {}),
        ("created_at", sa.DateTime(), {}),
    ],
    "release_diff_findings": [
        ("id", sa.Integer(), dict(primary_key=True)),
        ("release_a", sa.String(50), dict(nullable=False)),
        ("release_b", sa.String(50), dict(nullable=False)),
        ("finding_type", sa.String(30), dict(nullable=False, index=True)),
        ("npi", sa.String(10), dict(nullable=False, index=True)),
        ("hcpcs_code", sa.String(10), dict(nullable=False)),
        ("severity", sa.String(10), {}),
        ("details", sa.JSON(), {}),
        ("detected_at", sa.DateTime(), {}),
        ("reviewed", sa.Boolean(), {}),
    ],
}

UNIQUE_CONSTRAINTS = {
    "nppes_import_runs": [("uq_nppes_import_sha", ["source_sha256"])],
    "exclusion_screen_runs": [("uq_exclusion_run_source_file", ["source", "source_sha256"])],
    "release_diff_findings": [(
        "uq_release_diff_finding",
        ["release_a", "release_b", "npi", "hcpcs_code", "finding_type"])],
}


def upgrade():
    inspector = sa.inspect(op.get_bind())
    for table, columns in TABLES.items():
        if inspector.has_table(table):
            continue
        op.create_table(
            table,
            *[sa.Column(name, column_type, **kwargs) for name, column_type, kwargs in columns],
        )
        for name, columns_ in UNIQUE_CONSTRAINTS.get(table, []):
            op.create_unique_constraint(name, table, columns_)


def downgrade():
    for table in reversed(list(TABLES.keys())):
        op.drop_table(table)
