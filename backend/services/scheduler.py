from apscheduler.schedulers.background import BackgroundScheduler
from services.cms_enrollment import update_dashboard_stats
from database import engine
import logging

logger = logging.getLogger(__name__)


def scheduled_enrollment_update():
    """Run every 30 days to keep enrollment data fresh"""
    logger.info("Running scheduled enrollment data update...")
    try:
        update_dashboard_stats(engine)
        logger.info("Scheduled update completed successfully")
    except Exception as e:
        logger.error(f"Scheduled update failed: {e}")


def scheduled_exclusion_screens():
    """Nightly 02:30 ET - LEIE + NYS OMIG screens of the whole cohort.

    A NEW match (excluded yesterday) is the single most actionable overnight
    signal in the pipeline: billing-while-excluded is a per-claim FCA
    violation with objective proof.
    """
    from database import SessionLocal
    from data_ingestion.exclusion_screens import run_nightly_exclusion_screens
    logger.info("Running scheduled exclusion screens...")
    try:
        with SessionLocal() as db:
            result = run_nightly_exclusion_screens(db)
            new_matches = {s: r.get("new_matches", 0) for s, r in result.items()}
            if any(new_matches.values()):
                logger.warning("NEW exclusion matches found: %s - route to ops review", new_matches)
            logger.info("Exclusion screens complete: %s", result)
    except Exception as e:
        logger.error(f"Exclusion screen run failed: {e}")


def scheduled_hhs_release_poll():
    """Weekly Monday 05:00 ET - check for a new HHS spending release."""
    from database import SessionLocal
    from data_ingestion.hhs_release_manager import check_for_new_release
    logger.info("Polling HHS dataset page for new release...")
    try:
        with SessionLocal() as db:
            new = check_for_new_release(db)
            if new:
                logger.info("NEW HHS release discovered: %s - run the import + release-diff", new["release_id"])
            else:
                logger.info("No new HHS release.")
    except Exception as e:
        logger.error(f"HHS release poll failed: {e}")


def scheduled_sol_refresh():
    """Daily 01:00 ET - recompute every SOL clock and decayed ENPV."""
    from database import SessionLocal
    from analytics.sol_clocks import refresh_all_clocks
    logger.info("Refreshing SOL clocks...")
    try:
        with SessionLocal() as db:
            report = refresh_all_clocks(db)
            logger.info("SOL refresh complete: %s tiers", list(report["tiers"].keys()))
    except Exception as e:
        logger.error(f"SOL refresh failed: {e}")


scheduler = BackgroundScheduler()
scheduler.add_job(
    scheduled_enrollment_update,
    'interval',
    days=30,
    id='enrollment_updater',
    replace_existing=True
)
scheduler.add_job(
    scheduled_exclusion_screens,
    'cron',
    hour=2, minute=30,
    id='nightly_exclusion_screens',
    replace_existing=True,
)
scheduler.add_job(
    scheduled_hhs_release_poll,
    'cron',
    day_of_week='mon', hour=5, minute=0,
    id='weekly_hhs_release_poll',
    replace_existing=True,
)
scheduler.add_job(
    scheduled_sol_refresh,
    'cron',
    hour=1, minute=0,
    id='daily_sol_refresh',
    replace_existing=True,
)


def start_scheduler():
    scheduler.start()
    logger.info(
        "Scheduler started - exclusion screens nightly 02:30, SOL refresh daily 01:00, "
        "HHS release poll Mondays 05:00, enrollment update every 30 days"
    )
