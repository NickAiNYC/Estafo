# Engine V3 — Real Data, Outcomes, Clocks, Cross-Signals, Case Selection

This is the build that retires the synthetic cohort and turns Estafo into a
real-data lead engine with case-selection intelligence. Everything below is
live code, wired into the API and the scheduler, covered by
`backend/tests/test_engine_v3.py` (40 tests) and
`backend/scripts/smoke_nppes_import.py`.

---

## Move 1 — Real data pipeline (synthetic cohort retired)

| Piece | File | What it does |
|---|---|---|
| NPPES full monthly file | `backend/data_ingestion/nppes_full.py` | Downloads/imports the ~600MB dissemination ZIP. Chunked streaming, fuzzy header resolution across vintages, Luhn gate on every NPI, NYC ZIP-prefix scope, elderly-care taxonomy filter, deactivation capture, provider + location upserts. Idempotent per file SHA-256. |
| HHS release manager | `backend/data_ingestion/hhs_release_manager.py` | Weekly auto-discovery of new official releases into `hhs_release_registry`, multi-HCPCS slice imports (T2024, T2025, S510x, T1020, H0005, S9088) through the existing provenance-verified importer. |
| Nightly exclusion screens | `backend/data_ingestion/exclusion_screens.py` | LEIE + NYS OMIG screens of the whole cohort, NPI-exact + name-fuzzy matching (token-set similarity, ≥0.90 stored), content-addressed runs, **new-match detection** (excluded-yesterday alerts). |
| Synthetic retirement | `backend/services/data_audit.py`, `backend/scripts/retire_synthetic_cohort.py` | Quarantines `DEMO_*`/`SYNTHETIC_*`/`UNVERIFIED_LEGACY` rows. `/api/v1/intel/data-audit` continuously reports real-vs-synthetic share. |
| Re-seed guard | `backend/scripts/seed_hhs_aggregates.py` | Synthetic seeding now REFUSES to run unless `SYNTHETIC_DATA_ALLOWED=true` AND `ENVIRONMENT != production`. |

**Runbook:**
```bash
# one-time retirement (dry-run first)
python backend/scripts/retire_synthetic_cohort.py --dry-run
python backend/scripts/retire_synthetic_cohort.py --execute
# NPPES full import (finds + downloads latest monthly)
python -m data_ingestion.nppes_full --discover
# manual exclusion screen
curl -X POST .../api/v1/intel/exclusion-screens/run
```

---

## Move 2 — Outcomes database + ENPV calibration

* `backend/services/outcomes_database.py` — `fca_outcome_cases` table +
  seed corpus of publicly reported matters (confidence-labeled, `verified=false`
  until an operator checks the primary source), annual DOJ/MFCU aggregate
  rows, `outcome_stats()` and `sales_brief()` (the counsel-pitch one-pager).
* `backend/services/enpv_calibrator.py` — **models the intervenor's decision,
  not just the fraud**: scheme-level P(intervention) priors (excluded-provider
  billing 0.55, SADC 0.35, kickbacks 0.30–0.40 …), bounded feature
  multipliers (exclusion match ×1.6, insider witness ×1.3, weak evidence ×0.4,
  sub-$250k damages ×0.5), 2025 penalty band ($14,308–$28,619, mid-band
  unstacked), declined-case value priced (not ignored), empirical rows
  override priors at n≥8 verified.

Endpoints: `/outcomes`, `/outcomes/seed`, `/outcomes/stats`,
`/outcomes/sales-brief`, `/enpv/calibrate`.

---

## Move 3 — SOL clocks + ENPV decay on every lead

`backend/analytics/sol_clocks.py` computes, per lead:

* **31 U.S.C. §3731(b)** deadlines (6yr from violation / 3yr from government
  knowledge, 10-yr cap — calendar-year arithmetic) plus the parallel
  NY State Finance Law Art. 5-B and NYC Admin Code §5-325 mirrors.
* **Progressive time-bar**: share of the lead's billed dollars already outside
  the 6-year window (month-level, from the stored aggregates).
* **Staleness decay**: unengaged leads halve every 180 days
  (`ENPV_STALE_HALF_LIFE_DAYS`).
* **Urgency tiers**: FILE_NOW (<90d) / HIGH / MODERATE / MONITOR / EXPIRED,
  plus a portfolio aging report with value retention.

`enpv_current = enpv_at_discovery × 0.5^(stale_days/half_life) × (1 − barred_pct) × exculpatory_factor`

Endpoints: `/leads/{npi}/sol`, `/sol/portfolio`, `/sol/refresh` (daily 01:00 job).

---

## Move 4 — 311-idling × SADC geospatial cross-signal

`backend/analytics/geospatial_cross_signal.py` — the uniquely NYC moat:

* Pulls `Idling` complaints with coordinates from NYC Open Data (SODA,
  dataset `erm2-nwe9`), filters to the morning drop-off window (05:00–11:00).
* For each geocoded SADC site: complaints within 150m (haversine), versus a
  Poisson baseline from borough-wide morning idling density.
  `score = 1 − P(X ≥ observed)`; `p < 0.05 && ≥3 complaints` → **CORROBORATING**.
* Honesty rules baked in: complaints corroborate ambulatory traffic, never
  identify providers; ZIP-quality geocodes are excluded from radius matching
  (rooftop only); labels are CORROBORATING / NEUTRAL / NO_SIGNAL.

Endpoints: `/leads/{npi}/cross-signal`, `/cross-signal/sites`.

---

## Move 5 — Secret sauce

| Capability | File | One-liner |
|---|---|---|
| Public-disclosure bar check | `backend/services/bar_check_service.py` | §3730(e)(4) sweep: CourtListener dockets + Google News RSS + DOJ press → HIGH/MODERATE/LOW bar risk + original-source overlay; every hit persisted. |
| Original-source intake | `backend/services/original_source_intake.py` | Hash-locked zero-knowledge tips (no identity, no narrative stored — SHA-256 + timestamp only), counsel-side hash verification, 28 U.S.C. §1746 declaration skeleton generator. |
| Exculpatory engine | `backend/analytics/exculpatory_engine.py` | Generates the innocent explanation for every signal type, names the disproving evidence, auto-assesses OPEN/WEAKENED/ELIMINATED, and discounts ENPV accordingly (leads below 0.5 are parked, not pitched). |
| Release-diff intelligence | `backend/analytics/release_diff_intelligence.py` | NEW_BILLER / VELOCITY_REGIME / RETROACTIVE_RESTATEMENT findings between releases — the clone-facility detector (Fresh Meadows pattern) and the OMIG-recoupment breadcrumb. |
| Speed-to-seal | `backend/services/speed_to_seal.py` | TIP→DOSSIER→COUNSEL_REVIEW→FILING_READY→FILED_SEALED event log, transition medians, bottleneck detection, 30-day target, leaderboard. |
| Declination library | `backend/services/declination_library.py` | Declines as assets: reason codes, shop-to matrix (NY AG MFCU / NYC DOI / other states / solo litigation), outcomes that flow back into ENPV priors. |

---

## New API surface (`/api/v1/intel/*`, 33 routes)

```
GET  /data-audit                       POST /data-audit/retire-synthetic
GET  /exclusion-screens                POST /exclusion-screens/run
POST /hhs-release/check                GET  /hhs-release/registry
POST /release-diff/run                 GET  /release-diff/watchlist
GET  /outcomes  /outcomes/stats  /outcomes/sales-brief     POST /outcomes/seed
POST /enpv/calibrate
GET  /leads/{npi}/sol  /leads/{npi}/cross-signal  /leads/{npi}/exculpatory
GET  /sol/portfolio                    POST /sol/refresh
POST /bar-check
POST /tips   POST /tips/{ref}/verify   GET  /tips/{ref}
POST /tips/{ref}/engage-counsel        GET  /tips/{ref}/declaration
POST /pipeline/stage                   GET  /pipeline/speed-metrics  /pipeline/leaderboard
POST /declinations                     GET  /declinations  /declinations/routing
POST /declinations/{id}/shop           POST /declinations/{id}/resolve
```

## Scheduler (upgraded `backend/services/scheduler.py`)

| Job | Schedule |
|---|---|
| Exclusion screens (LEIE + OMIG) | nightly 02:30 |
| SOL clock refresh | daily 01:00 |
| HHS release poll | Mondays 05:00 |
| CMS enrollment update | every 30 days |

## Database

* 12 new tables (see migration `b7e2f9a1c3d5_engine_v3_intelligence.py`; also
  created automatically on SQLite via `Base.metadata.create_all`).
* New config flags in `backend/config.py`: `SYNTHETIC_DATA_ALLOWED`,
  `REAL_DATA_STRICT`, cross-signal tuning, SOL/decay parameters.

## Operating cautions (unchanged house rules)

* Research aids only — no provider allegations from aggregate data; counsel
  reviews every dossier.
* Zero-contact rule with targets; nothing is filed or sent to any government
  by the platform.
* Verify outcomes-database seed rows against primary sources before quoting
  (`verified=false` by default).
* Statutory references (§3731(b), §3730(e)(4), NY SFL Art. 5-B, NYC Admin
  Code §5-325) are engineering anchors — counsel confirms current text and
  tolling facts before any filing deadline is relied upon.
