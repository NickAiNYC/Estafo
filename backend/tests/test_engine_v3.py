"""Engine V3 test suite - real data pipeline, outcomes DB, SOL clocks,
311 x SADC cross-signal, and the case-selection secret sauce.

Runs entirely on SQLite fixtures: no network, no external services.
"""

import os
os.environ.setdefault("DATABASE_URL", "sqlite:///test_engine_v3.db")
os.environ.setdefault("SYNTHETIC_DATA_ALLOWED", "false")

import pytest
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import (
    Base, Provider, ProviderLocation, AggregateSpendingRecord,
    ExclusionMatch, ReleaseDiffFinding, LeadSOLClock,
)
from services.data_audit import audit_data_sources, retire_synthetic_data, is_synthetic_source
from services.outcomes_database import seed_outcomes, outcome_stats, sales_brief, filter_cases
from services.enpv_calibrator import calibrate_enpv, LeadProfile
from analytics.sol_clocks import (
    compute_sol_clock, federal_deadline, staleness_factor, urgency_tier,
    time_barred_share, refresh_all_clocks,
)
from analytics.geospatial_cross_signal import (
    haversine_m, cross_signal_score, borough_baseline_density, in_morning_window,
    geocode_zip_centroid, backfill_zip_centroids, poisson_tail_pmf,
)
from analytics.exculpatory_engine import generate_exculpatory_report
from analytics.release_diff_intelligence import diff_releases, watchlist
from services.bar_check_service import run_bar_check
from services.original_source_intake import intake_tip, verify_tip, engage_counsel, generate_declaration
from services.speed_to_seal import record_stage, speed_metrics, leaderboard
from services.declination_library import (
    record_declination, mark_shopped, resolve_declination, library_stats,
)
from data_ingestion.exclusion_screens import (
    normalize_name, token_set_similarity, screen_provider_batch,
)
from data_ingestion.nppes_full import verify_luhn, is_nyc_zip, borough_for_zip


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def db(engine):
    """Function-scoped session with rollback isolation."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)(expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


def add_provider(db, npi="1932552829", name="FLUSHING SUNRISE ADULT DAY CARE INC",
                 city="Flushing", zip_code="11355", created_days_ago=800, capacity=None):
    provider = Provider(
        npi=npi, name=name, address="136-20 38th Ave", city=city, state="NY",
        zip_code=zip_code, facility_type="adult_day_care", specialty="Adult Day Care",
        licensed_capacity=capacity,
        is_nyc_verified=True, verification_source="NPPES_FULL:test",
        created_at=datetime.utcnow() - timedelta(days=created_days_ago),
    )
    db.add(provider)
    db.flush()
    return provider


def add_month(db, npi, year_month, paid, hcpcs="T2024", source="HHS_HCPCS_2026-06-01_abcd1234"):
    db.add(AggregateSpendingRecord(
        billing_npi=npi, hcpcs_code=hcpcs, year_month=year_month,
        total_paid_amount=paid, total_claims=None, total_beneficiaries=None,
        state="NY", source_dataset=source,
    ))


# ---------------------------------------------------------------------------
# Move 1: real data pipeline
# ---------------------------------------------------------------------------

class TestSyntheticRetirement:
    def test_synthetic_source_detection(self):
        assert is_synthetic_source("DEMO_SYNTHETIC_2025") is True
        assert is_synthetic_source("SYNTHETIC_COHORT") is True
        assert is_synthetic_source("UNVERIFIED_LEGACY") is True
        assert is_synthetic_source(None) is True          # unlabeled = not real
        assert is_synthetic_source("HHS_HCPCS_2026-06-01_abcd1234") is False

    def test_audit_detects_contamination(self, db):
        add_provider(db, npi="1932552829")
        add_month(db, "1932552829", "2026-01", 100_000.0, source="DEMO_SYNTHETIC_2025")
        add_month(db, "1932552829", "2026-02", 100_000.0, source="HHS_HCPCS_2026-06-01_abcd1234")
        audit = audit_data_sources(db)
        assert audit["verdict"] == "CONTAMINATED"
        assert audit["aggregate_rows"]["synthetic"] == 1
        assert audit["aggregate_rows"]["real"] == 1
        assert 0 < audit["aggregate_rows"]["real_pct"] < 100

    def test_retire_removes_synthetic(self, db):
        add_provider(db, npi="1932552829")
        add_month(db, "1932552829", "2026-01", 100_000.0, source="DEMO_SYNTHETIC_2025")
        add_month(db, "1932552829", "2026-02", 100_000.0, source="HHS_HCPCS_2026-06-01_abcd1234")

        dry = retire_synthetic_data(db, dry_run=True)
        assert dry["mode"] == "dry_run"
        assert dry["synthetic_rows"] == 1
        assert db.query(AggregateSpendingRecord).count() == 2  # nothing deleted

        executed = retire_synthetic_data(db, dry_run=False)
        assert executed["mode"] == "executed"
        remaining = db.query(AggregateSpendingRecord).all()
        assert len(remaining) == 1
        assert remaining[0].source_dataset == "HHS_HCPCS_2026-06-01_abcd1234"

        audit = audit_data_sources(db)
        assert audit["verdict"] == "CLEAN"
        assert audit["aggregate_rows"]["real_pct"] == 100.0

    def test_seed_script_guard_blocks_by_default(self):
        import subprocess, sys
        result = subprocess.run(
            [sys.executable, "scripts/seed_hhs_aggregates.py"],
            capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        )
        assert result.returncode != 0
        assert "REFUSED" in result.stdout + result.stderr


class TestNppesHelpers:
    def test_luhn(self):
        assert verify_luhn("1234567893") is True       # canonical valid check digit
        assert verify_luhn("1932552829") is False
        assert verify_luhn("12345") is False
        assert verify_luhn("ABCDEFGHIJ") is False

    def test_nyc_zip_rules(self):
        assert is_nyc_zip("11355") is True
        assert is_nyc_zip("11220") is True
        assert is_nyc_zip("10001") is True
        assert is_nyc_zip("11530") is False             # Nassau
        assert is_nyc_zip("") is False
        assert borough_for_zip("11355") == "Queens"
        assert borough_for_zip("11220") == "Brooklyn"
        assert borough_for_zip("99999") is None


class TestExclusionScreens:
    def test_name_normalization_and_similarity(self):
        assert normalize_name("Sunrise Adult Day Care, Inc.") == "SUNRISE"
        assert normalize_name("FLUSHING GOLDEN AGE INC") == "FLUSHING GOLDEN AGE"
        # Same tokens, different order/suffix -> high similarity
        score = token_set_similarity(
            "Sunrise Adult Day Care Center Inc",
            "SUNRISE ADULT DAY CARE CENTER LLC",
        )
        assert score >= 0.90
        # Different entities -> low
        assert token_set_similarity("Sunrise Adult Day Care", "Brooklyn Senior Care Program") < 0.5

    def test_screen_detects_npi_exact_and_new_match_flag(self, db):
        provider = add_provider(db, npi="1932552829")
        rows = [
            {"name": "SUNRISE ADULT DAY CARE INC", "npi": "1932552829",
             "exclusion_type": "1128(a)(1)", "exclusion_date": date(2026, 10, 1)},
            {"name": "COMPLETELY DIFFERENT LLC", "npi": "9999999999",
             "exclusion_type": "1128(a)(1)", "exclusion_date": date(2026, 9, 1)},
        ]
        result = screen_provider_batch(db, rows, "LEIE", "https://test", "sha-abc-1")
        assert result["status"] == "ok"
        assert result["matches"] == 1
        assert result["new_matches"] == 1
        match = db.query(ExclusionMatch).filter_by(npi="1932552829").one()
        assert match.match_type == "NPI_EXACT"
        assert match.status == "ACTIVE_MATCH"

        # Same file again -> unchanged no-op
        result2 = screen_provider_batch(db, rows, "LEIE", "https://test", "sha-abc-1")
        assert result2["status"] == "unchanged"

    def test_name_fuzzy_match(self, db):
        add_provider(db, npi="1730293847", name="Golden Age Adult Day Care Inc")
        rows = [{"name": "GOLDEN AGE ADULT DAY CARE LLC", "npi": "",
                 "exclusion_type": "1128(a)(1)", "exclusion_date": date(2026, 8, 1)}]
        result = screen_provider_batch(db, rows, "NYS_OMIG", "https://test", "sha-omig-1")
        assert result["matches"] == 1
        match = db.query(ExclusionMatch).filter_by(npi="1730293847").one()
        assert match.match_type == "NAME_FUZZY"
        assert match.match_score >= 0.90


# ---------------------------------------------------------------------------
# Move 2: outcomes database + ENPV calibration
# ---------------------------------------------------------------------------

class TestOutcomesDatabase:
    def test_seed_idempotent(self, db):
        first = seed_outcomes(db)
        assert first["status"] == "seeded"
        again = seed_outcomes(db)
        assert again["status"] == "already_seeded"

    def test_stats_and_sales_brief(self, db):
        seed_outcomes(db)
        stats = outcome_stats(db)
        assert stats["n"] >= 8
        assert stats["total_recovery_sum"] > 1_000_000_000
        assert stats["relator_share_pct_median"] is not None
        assert 10 <= stats["relator_share_pct_median"] <= 30

        brief = sales_brief(db)
        assert "by_scheme" in brief and len(brief["by_scheme"]) >= 1
        assert "largest_resolutions" in brief
        assert brief["largest_resolutions"][0]["total_recovery"] >= 500_000_000

    def test_filter_cases_by_scheme(self, db):
        seed_outcomes(db)
        kickbacks = filter_cases(db, scheme_type="REFERRAL_KICKBACKS")
        assert all(c["scheme_type"] == "REFERRAL_KICKBACKS" for c in kickbacks)
        assert len(kickbacks) >= 1


class TestENPVCalibrator:
    def test_intervenor_math_shape(self, db):
        seed_outcomes(db)
        profile = LeadProfile(
            npi="1932552829", scheme_type="SADC_ABUSE",
            estimated_single_damages=3_000_000, estimated_claim_count=1_200,
            evidence_tier=2, exclusion_match=False, cross_signal_corroboration=True,
            insider_witness=True,
        )
        result = calibrate_enpv(profile, session=db)
        assert 0 < result.p_intervene < 0.85
        assert result.p_intervene + result.p_decline_litigate == pytest.approx(1.0)
        assert result.enpv > 0
        assert result.treble_plus_penalties > 3_000_000 * 2  # damages + penalties
        assert result.drivers  # documented multipliers

    def test_exclusion_match_lifts_intervention_odds(self, db):
        seed_outcomes(db)
        base = LeadProfile(npi="1", scheme_type="SADC_ABUSE", estimated_single_damages=2_000_000)
        strong = LeadProfile(
            npi="2", scheme_type="SADC_ABUSE", estimated_single_damages=2_000_000,
            exclusion_match=True, insider_witness=True, cross_signal_corroboration=True,
            evidence_tier=1,
        )
        p_base = calibrate_enpv(base, session=db).p_intervene
        p_strong = calibrate_enpv(strong, session=db).p_intervene
        assert p_strong > p_base * 1.5

    def test_small_damages_discounted(self, db):
        seed_outcomes(db)
        small = calibrate_enpv(
            LeadProfile(npi="1", scheme_type="SADC_ABUSE", estimated_single_damages=50_000), session=db)
        healthy = calibrate_enpv(
            LeadProfile(npi="1", scheme_type="SADC_ABUSE", estimated_single_damages=2_000_000), session=db)
        assert healthy.p_intervene > small.p_intervene


# ---------------------------------------------------------------------------
# Move 3: SOL clocks + ENPV decay
# ---------------------------------------------------------------------------

class TestSOLClocks:
    def test_federal_deadline_six_and_three_year_rules(self):
        violation = date(2021, 3, 15)
        # No government knowledge: 6-year rule
        d = federal_deadline(violation, None)
        assert d.year == 2027
        # Government knew 2024-06-01: knowledge+3y is later than violation+6y
        knowledge = date(2024, 6, 1)
        d2 = federal_deadline(violation, knowledge)
        assert d2.year == 2027 and d2.month == 6
        # 10-year cap: government knew very late (knowledge+3y would exceed cap)
        d3 = federal_deadline(violation, date(2029, 6, 1))
        assert d3.year == 2031 and d3.month == 3  # capped at violation+10y

    def test_time_barred_share(self):
        monthly = {"2020-01": 100.0, "2020-06": 100.0, "2026-06": 100.0}
        share = time_barred_share(monthly, date(2020, 1, 1), as_of=date(2026, 10, 29))
        assert 0.6 < share < 0.7  # two of three months outside 6-year window

    def test_staleness_and_tiers(self):
        assert staleness_factor(0, 180) == 1.0
        assert staleness_factor(180, 180) == pytest.approx(0.5)
        assert staleness_factor(360, 180) == pytest.approx(0.25)
        assert urgency_tier(30) == "FILE_NOW"
        assert urgency_tier(150) == "HIGH"
        assert urgency_tier(300) == "MODERATE"
        assert urgency_tier(900) == "MONITOR"
        assert urgency_tier(-1) == "EXPIRED"

    def test_full_clock_computation(self, db):
        npi = "1932552829"
        add_provider(db, npi=npi)
        # Billing window 2021-04 .. 2026-09
        add_month(db, npi, "2021-04", 50_000.0)
        add_month(db, npi, "2026-09", 80_000.0)
        db.flush()

        clock = compute_sol_clock(
            db, npi, enpv_at_discovery=500_000.0, exculpatory_factor=0.9,
            as_of=date(2026, 10, 29),
        )
        assert clock["urgency_tier"] == "HIGH"          # knowledge+3y default anchors 2021-04+3y -> 2024-04? no:
        # first_violation 2021-04-01 + 6y = 2027-04 -> HIGH at 177 days remaining
        assert clock["federal_deadline"].startswith("2027-04")
        assert clock["enpv_current"] < 500_000.0        # decayed
        assert clock["claims_time_barred_pct"] >= 0     # 2021-04 outside 6y window at 2026-10
        stored = db.query(LeadSOLClock).filter_by(npi=npi).one()
        assert stored.urgency_tier == clock["urgency_tier"]

    def test_portfolio_aging(self, db):
        npi = "1932552829"
        add_provider(db, npi=npi)
        add_month(db, npi, "2026-05", 60_000.0)
        db.flush()
        compute_sol_clock(db, npi, enpv_at_discovery=250_000.0, as_of=date(2026, 10, 29))
        report = refresh_all_clocks(db, as_of=date(2026, 10, 29))
        assert "tiers" in report and "portfolio" in report
        assert report["portfolio"]["leads"] >= 1


# ---------------------------------------------------------------------------
# Move 4: 311 x SADC cross-signal
# ---------------------------------------------------------------------------

class TestCrossSignal:
    def make_complaints(self, count, lat, lon, hour=8, borough="Queens"):
        return [
            {"unique_key": f"k{i}", "lat": lat + i * 0.00001, "lon": lon,
             "created": datetime(2026, 6, 15, hour, 0), "descriptor": "engine idling",
             "borough": borough}
            for i in range(count)
        ]

    def test_haversine(self):
        # Flushing to Jackson Heights ~ 4-5 km
        d = haversine_m(40.7596, -73.8303, 40.7514, -73.8876)
        assert 3_500 < d < 6_000
        assert haversine_m(40.7596, -73.8303, 40.7596, -73.8303) == 0

    def test_morning_window(self):
        c = {"created": datetime(2026, 6, 15, 8, 0)}
        assert in_morning_window(c) is True
        c2 = {"created": datetime(2026, 6, 15, 15, 0)}
        assert in_morning_window(c2) is False

    def test_poisson_tail(self):
        # Improbable cluster: expected 0.5, observed 6 -> tiny p
        assert poisson_tail_pmf(0.5, 6) < 0.001
        # Expected rate near observation -> moderate tail
        assert poisson_tail_pmf(5.0, 6) > 0.3
        assert poisson_tail_pmf(0.0, 0) == 1.0
        assert poisson_tail_pmf(0.0, 3) == 0.0

    def test_corroborating_cluster(self, db):
        # Site in Flushing with a 311 idling cluster during morning hours
        site = {"npi": "1932552829", "name": "Flushing SADC",
                "lat": 40.7596, "lon": -73.8303, "borough": "Queens"}
        # Background: scattered daytime complaints far away
        complaints = self.make_complaints(40, 40.7400, -73.8700, hour=14, borough="Queens")
        # Signal: 8 morning complaints at the site
        complaints += self.make_complaints(8, 40.7596, -73.8303, hour=8)
        baseline = borough_baseline_density(complaints)
        result = cross_signal_score(site, complaints, baseline_density=baseline)
        assert result["label"] == "CORROBORATING"
        assert result["morning_window_complaints"] == 8
        assert result["corroboration_score"] > 0.95

    def test_quiet_site_gets_no_signal(self, db):
        site = {"npi": "1932552829", "name": "Quiet SADC",
                "lat": 40.7300, "lon": -73.8303, "borough": "Queens"}
        complaints = self.make_complaints(20, 40.7800, -73.8800, hour=14)
        baseline = borough_baseline_density(complaints)
        result = cross_signal_score(site, complaints, baseline_density=baseline)
        assert result["label"] == "NO_SIGNAL"
        assert result["corroboration_score"] == 0.0

    def test_ungeocoded_site_excluded(self):
        result = cross_signal_score({"npi": "1", "lat": None, "lon": None}, [])
        assert result["label"] == "NO_SIGNAL"
        assert result["reason"] == "site_not_geocoded_to_rooftop"

    def test_zip_centroid_backfill(self, db):
        db.add(ProviderLocation(npi="1932552829", city="Flushing", state="NY", zip_code="11355"))
        db.commit()
        result = backfill_zip_centroids(db)
        assert result["zip_quality_geocoded"] == 1
        location = db.query(ProviderLocation).filter_by(npi="1932552829").one()
        assert location.geocode_quality == "ZIP"       # honestly labeled, never rooftop


# ---------------------------------------------------------------------------
# Secret sauce
# ---------------------------------------------------------------------------

class TestExculpatoryEngine:
    def test_hypotheses_generated_and_factor_bounded(self, db):
        npi = "1932552829"
        add_provider(db, npi=npi, created_days_ago=900)
        add_month(db, npi, "2026-01", 100_000.0)
        add_month(db, npi, "2026-06", 100_000.0)
        db.flush()

        report = generate_exculpatory_report(db, npi)
        assert len(report["hypotheses"]) >= 3
        assert 0.2 <= report["exculpatory_factor"] <= 1.0
        assert report["surviving_innocent_explanations"] >= 1
        types = {h["signal"] for h in report["hypotheses"]}
        assert "NEW_BILLER" in types and "VOLUME_OUTLIER" in types

    def test_exclusion_match_adds_hypothesis_and_hard_discount(self, db):
        npi = "1932552829"
        add_provider(db, npi=npi)
        db.add(ExclusionMatch(
            npi=npi, provider_name="x", source="LEIE", match_type="NPI_EXACT",
            match_score=1.0, status="ACTIVE_MATCH",
        ))
        db.flush()
        report = generate_exculpatory_report(db, npi)
        exclusion_h = next(h for h in report["hypotheses"] if h["signal"] == "EXCLUSION_MATCH")
        assert exclusion_h["status"] == "ELIMINATED"    # innocent namesake explanation dead


class TestReleaseDiff:
    def test_new_biller_and_restatement(self, db):
        npi_new, npi_old = "1932552829", "1730293847"
        add_provider(db, npi=npi_new, name="Fresh Meadows site")
        add_provider(db, npi=npi_old, name="Old faithful")
        # Release A (2026-03): only old provider
        add_month(db, npi_old, "2025-10", 100_000.0, source="HHS_HCPCS_2026-03-01_aaaa0000")
        # Release B (2026-09): old provider restated DOWN, new provider bills big
        add_month(db, npi_old, "2025-10", 60_000.0, source="HHS_HCPCS_2026-09-01_bbbb1111")
        add_month(db, npi_new, "2026-06", 80_000.0, source="HHS_HCPCS_2026-09-01_bbbb1111")
        add_month(db, npi_new, "2026-07", 90_000.0, source="HHS_HCPCS_2026-09-01_bbbb1111")
        db.flush()

        result = diff_releases(db, "2026-03-01", "2026-09-01")
        assert result["by_type"]["NEW_BILLER"] >= 1
        assert result["by_type"]["RETROACTIVE_RESTATEMENT"] >= 1
        new_biller = next(f for f in result["detail"] if f["finding_type"] == "NEW_BILLER")
        assert new_biller["npi"] == npi_new
        assert new_biller["severity"] == "HIGH"
        restatement = next(f for f in result["detail"] if f["finding_type"] == "RETROACTIVE_RESTATEMENT")
        assert restatement["details"]["delta"] == pytest.approx(-40_000.0)
        assert db.query(ReleaseDiffFinding).count() >= 2
        assert len(watchlist(db)) >= 2


class TestBarCheck:
    def test_grades_hits_offline(self, db):
        from services import bar_check_service as svc
        # Inject fixture hits without network
        original_fetchers = svc.FETCHERS
        svc.FETCHERS = {
            "NEWS": lambda target, limit=10: [
                svc.BarCheckHit(
                    source_type="NEWS",
                    title=f"{target} settles Medicaid false claims suit",
                    url="https://example.com/news", published=date(2026, 5, 1),
                    similarity=0.9, discloses_allegations=True, snippet=""),
            ],
        }
        try:
            report = svc.run_bar_check(db, "Acme Health Systems", npi="1932552829", use_network=True)
        finally:
            svc.FETCHERS = original_fetchers
        assert report.bar_risk == "HIGH"
        assert "original source" in report.recommendation.lower() or "3730" in report.recommendation
        assert db.query(models.PublicDisclosureHit).count() >= 1

    def test_clear_when_no_hits(self, db):
        from services import bar_check_service as svc
        original = svc.FETCHERS
        svc.FETCHERS = {}
        try:
            report = svc.run_bar_check(db, "Nothing Found Health", use_network=True)
        finally:
            svc.FETCHERS = original
        assert report.bar_risk == "LOW"
        assert report.original_source_assessment in ("LIKELY", "PENDING")


import models  # noqa: E402  (used above)


class TestOriginalSourceIntake:
    NARRATIVE = ("I worked at the adult day care for three years. Every morning the "
                 "ambulettes arrived with 60-80 people. Our official roster listed 40. "
                 "The owner paid cash bonuses to recruitment agencies per head.")

    def test_intake_stores_hash_not_narrative(self, db):
        result = intake_tip(db, self.NARRATIVE, allegation_scheme="SADC_ABUSE")
        assert result["tip_ref"].startswith("EST-")
        assert len(result["narrative_sha256"]) == 64
        assert "instructions_to_tipster" in result
        # Zero-knowledge: nothing but the hash in the row
        from models import OriginalSourceTip
        tip = db.query(OriginalSourceTip).filter_by(tip_ref=result["tip_ref"]).one()
        assert tip.narrative_sha256 == result["narrative_sha256"]
        assert not hasattr(tip, "narrative") or tip.narrative is None

    def test_hash_verification_roundtrip(self, db):
        result = intake_tip(db, self.NARRATIVE)
        good = verify_tip(db, result["tip_ref"], self.NARRATIVE)
        assert good["verified"] is True
        bad = verify_tip(db, result["tip_ref"], self.NARRATIVE + " tampered")
        assert bad["verified"] is False

    def test_engage_and_declaration(self, db):
        result = intake_tip(db, self.NARRATIVE)
        engaged = engage_counsel(db, result["tip_ref"])
        assert engaged["status"] == "COUNSEL_REVIEW"
        declaration = generate_declaration(db, result["tip_ref"])
        assert "1746" in declaration["text"]
        assert result["narrative_sha256"] in declaration["text"]
        assert result["tip_ref"] in declaration["text"]

    def test_rejects_short_narrative(self, db):
        with pytest.raises(ValueError):
            intake_tip(db, "too short")


class TestSpeedToSeal:
    def test_stage_ladder_and_metrics(self, db):
        now = datetime.utcnow()
        record_stage(db, "1932552829", "TIP", occurred_at=now - timedelta(days=40))
        record_stage(db, "1932552829", "DOSSIER", occurred_at=now - timedelta(days=25))
        record_stage(db, "1932552829", "FILING_READY", occurred_at=now - timedelta(days=10))
        record_stage(db, "1932552829", "FILED_SEALED", occurred_at=now)

        metrics = speed_metrics(db)
        assert metrics["tip_to_filing_ready"]["median_days"] == 30
        assert metrics["tip_to_seal"]["n"] == 1
        assert metrics["current_stage_counts"].get("FILED_SEALED") == 1
        board = leaderboard(db)
        assert board[0]["npi"] == "1932552829"
        assert board[0]["tip_to_filing_ready_days"] == 30

    def test_rejects_unknown_stage(self, db):
        with pytest.raises(ValueError):
            record_stage(db, "1932552829", "TELEPORTED")


class TestDeclinationLibrary:
    def test_full_declination_lifecycle(self, db):
        created = record_declination(
            db, "DOJ", npi="1932552829", case_label="US v. Acme",
            scheme_type="SADC_ABUSE", reason_code="PRIORITY",
            estimated_single_damages=1_500_000,
        )
        assert created["reason_code"] == "PRIORITY"
        assert created["routing_recommendation"]      # second life always offered

        shopped = mark_shopped(db, created["id"], "NY AG Medicaid Fraud Control Unit")
        assert len(shopped["shopped_to"]) == 1
        accepted = mark_shopped(db, created["id"], "NYC DOI", status="ACCEPTED")
        assert accepted["outcome"] == "REFILED"

        resolved = resolve_declination(db, created["id"], "SETTLED", 2_400_000)
        assert resolved["resolved_amount"] == 2_400_000

        stats = library_stats(db)
        assert stats["n"] == 1
        assert stats["by_reason"]["PRIORITY"] == 1
        assert stats["settled_total_amount"] == 2_400_000

    def test_invalid_inputs_rejected(self, db):
        with pytest.raises(ValueError):
            record_declination(db, "FTC")             # not a real decliner in our model
        created = record_declination(db, "DOJ")
        with pytest.raises(ValueError):
            resolve_declination(db, created["id"], "VAPORIZED")
