-- ==============================================================================
-- ESTAFO / VANGUARD INTELLIGENCE ENGINE — PRODUCTION POSTGRESQL SCHEMA
-- Mission 3: Relational schema for real-data ingestion, entity resolution,
-- opportunity scoring, operator task queues, and GAAP commercial accounting.
-- ==============================================================================

-- 1. DATA SOURCES & INGESTION TRACKING
CREATE TABLE IF NOT EXISTS data_sources (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'NYC_311_SODA', 'NYC_DOB_COMPLAINTS', 'CMS_OPEN_PAYMENTS'
    name VARCHAR(255) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL, -- e.g. 'erm2-nwe9', 'eabe-havv'
    endpoint_url TEXT NOT NULL,
    agency_owner VARCHAR(128) NOT NULL,
    license_type VARCHAR(64) DEFAULT 'PUBLIC_OPEN_DATA',
    refresh_frequency VARCHAR(64) DEFAULT 'CONTINUOUS_OR_DAILY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source_id VARCHAR(64) REFERENCES data_sources(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'SUCCESS', 'FAILED', 'DEGRADED'
    records_retrieved INT DEFAULT 0,
    records_inserted INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    error_message TEXT,
    source_etag VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS source_records (
    id VARCHAR(128) PRIMARY KEY, -- e.g. '311-6492019', 'DOB-3A43472'
    data_source_id VARCHAR(64) REFERENCES data_sources(id) ON DELETE CASCADE,
    ingestion_run_id UUID REFERENCES ingestion_runs(id) ON DELETE SET NULL,
    raw_payload JSONB NOT NULL,
    retrieval_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_record_timestamp TIMESTAMPTZ,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for idempotent ingestion
    is_stale BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_source_records_source_time ON source_records(data_source_id, source_record_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_source_records_hash ON source_records(content_hash);

-- 2. ENTITY RESOLUTION & HISTORICAL GRAPH
CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'ENT-NPI-1982736410', 'ENT-BBL-4001928'
    entity_type VARCHAR(64) NOT NULL, -- 'HEALTHCARE_PROVIDER', 'COMMERCIAL_HAULER', 'PARCEL_BBL', 'CORPORATE_SHELL'
    primary_name VARCHAR(255) NOT NULL,
    official_id VARCHAR(128), -- NPI, NYS DOS ID, BIN, BBL, DOT #
    jurisdiction VARCHAR(64) DEFAULT 'NEW_YORK',
    address_street VARCHAR(255),
    borough VARCHAR(64),
    zip_code VARCHAR(16),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    confidence_score DOUBLE PRECISION DEFAULT 1.0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entity_historical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    change_type VARCHAR(64) NOT NULL, -- 'NAME_CHANGE', 'ADDRESS_CHANGE', 'STATUS_CHANGE', 'SANCTION'
    previous_value TEXT,
    new_value TEXT,
    effective_date DATE,
    source_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(64) NOT NULL, -- 'VERIFIED_OWNERSHIP', 'SHARED_PHYSICAL_LOCATION', 'SHARED_BILLING_AGENT'
    provenance_doc TEXT,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    is_inferred BOOLEAN DEFAULT FALSE,
    observed_date TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_entity_link UNIQUE (source_entity_id, target_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_entity_rel_src ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_tgt ON entity_relationships(target_entity_id);

-- 3. OPPORTUNITIES & ENPV SCORING
CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'OPP-NYC-2026-081'
    category VARCHAR(64) NOT NULL, -- 'CITIZEN_ENFORCEMENT', 'CONSTRUCTION_LITIGATION', 'MEDICAID_RESEARCH_PILOT'
    title VARCHAR(255) NOT NULL,
    target_entity_id VARCHAR(64) REFERENCES entities(id) ON DELETE SET NULL,
    borough VARCHAR(64),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    first_observed TIMESTAMPTZ DEFAULT NOW(),
    last_observed TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deterministic ENPV Model (docs/OPPORTUNITY_MODEL.md)
    expected_gross_value NUMERIC(12, 2) NOT NULL,
    probability_of_success DOUBLE PRECISION NOT NULL, -- 0.05 to 0.90
    investigation_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_pursuit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    downside_risk NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_net_value NUMERIC(12, 2) NOT NULL, -- Computed ENPV
    
    confidence_band VARCHAR(32) NOT NULL DEFAULT 'PRELIMINARY', -- 'HIGH', 'MEDIUM', 'PRELIMINARY'
    recommended_action TEXT,
    exculpatory_notes TEXT,
    requires_human_review BOOLEAN DEFAULT TRUE,
    status VARCHAR(32) DEFAULT 'DETECTED', -- 'DETECTED', 'QUEUED', 'IN_PROGRESS', 'EXECUTED', 'ARCHIVED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL, -- 'OFFICIAL_RECORD', 'GOVERNMENT_PORTAL', 'STATISTICAL_DEVIATION'
    title VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    source_record_id VARCHAR(128),
    retrieval_timestamp TIMESTAMPTZ NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE
);

-- 4. OPERATOR TASKS & FIELD ASSIGNMENTS
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'TSK-001'
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'P1_HIGH', -- 'P0_IMMEDIATE', 'P1_HIGH', 'P2_STANDARD'
    status VARCHAR(32) NOT NULL DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'FILED', 'COMPLETED'
    location_name VARCHAR(255),
    borough VARCHAR(64),
    assigned_to VARCHAR(128),
    due_date TIMESTAMPTZ,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    expected_net_value NUMERIC(12, 2) DEFAULT 0.00,
    operator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 5. GAAP COMMERCIAL LEDGER & TRANSACTIONS
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'TX-2026-001'
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE SET NULL,
    transaction_type VARCHAR(64) NOT NULL, -- 'CASH_COLLECTED', 'INVOICE_SENT', 'CONTRACT_SIGNED', 'OPERATING_EXPENSE', 'STATUTORY_PIPELINE'
    counterparty VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    provenance_reference VARCHAR(255) NOT NULL,
    transaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_tx_type ON financial_transactions(transaction_type, is_settled);

-- 6. CLOSED-LOOP ATTORNEY DECISIONS (Component 7)
CREATE TABLE IF NOT EXISTS attorney_feedback (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'FB-2026-001'
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
    target_name VARCHAR(255) NOT NULL,
    law_firm_name VARCHAR(255) NOT NULL,
    disposition VARCHAR(64) NOT NULL, -- 'ACCEPTED_FOR_INVESTIGATION', 'REJECTED_ALREADY_KNOWN', 'REJECTED_INSUFFICIENT_EVIDENCE', 'REJECTED_EXCULPATORY_EXPLANATION', 'FORMAL_CASE_OPENED'
    attorney_notes TEXT,
    analyst_hours_saved INT DEFAULT 0,
    primary_signal VARCHAR(64) NOT NULL,
    corroborating_signals_count INT DEFAULT 1,
    review_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT TRAIL
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL, -- 'TASK_STATUS_CHANGE', 'DOSSIER_EXPORT', 'FEEDBACK_LOGGED', 'INGESTION_FAILURE'
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
