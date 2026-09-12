import logging
from datetime import datetime, date, timedelta
import zoneinfo
from typing import Dict, Any
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from config import settings
from database import get_supabase

logger = logging.getLogger("liferpg.scheduler")

scheduler = BackgroundScheduler()

def execute_midnight_reset() -> Dict[str, Any]:
    """
    Authoritative Midnight Engine:
    1. Unchecks and resets all recurring daily habits (is_recurring = True).
    2. Audits active player streaks and penalizes inactivity past midnight.
    """
    logger.info("Executing Midnight Reset Job...")
    supabase = get_supabase()
    now_iso = datetime.utcnow().isoformat()

    try:
        tz = zoneinfo.ZoneInfo(settings.timezone)
        today = datetime.now(tz).date()
    except Exception:
        today = date.today()

    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")

    # 1. Reset all recurring quests that were completed
    recurring_res = supabase.table("quests").update({
        "completed": False,
        "completed_at": None
    }).eq("is_recurring", True).eq("completed", True).execute()

    reset_count = len(recurring_res.data) if recurring_res.data else 0
    logger.info(f"Reset {reset_count} daily recurring quests to active status.")

    # 2. Audit player streaks
    # Players with streak_days > 0 whose last_active_date is older than yesterday
    streaks_res = supabase.table("user_progression").select("user_id, streak_days, last_active_date").gt("streak_days", 0).execute()
    users_with_streaks = streaks_res.data or []

    broken_count = 0
    audited_count = len(users_with_streaks)

    for record in users_with_streaks:
        last_active = record.get("last_active_date")
        user_id = record.get("user_id")

        if not last_active or last_active < yesterday_str:
            # Inactivity detected: reset streak
            supabase.table("user_progression").update({
                "streak_days": 0,
                "updated_at": now_iso
            }).eq("user_id", user_id).execute()

            supabase.table("streak_records").insert({
                "user_id": user_id,
                "streak_count": 0,
                "activity_date": today.strftime("%Y-%m-%d"),
                "tasks_completed_count": 0,
                "action": "reset"
            }).execute()

            broken_count += 1

    logger.info(f"Audited {audited_count} adventurers: {broken_count} broken streaks reset to 0.")

    return {
        "status": "success",
        "recurring_tasks_reset_count": reset_count,
        "streaks_audited_count": audited_count,
        "streaks_broken_count": broken_count,
        "timestamp": now_iso
    }

def start_scheduler():
    """Starts the background cron scheduler configured for midnight reset."""
    import os
    if os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        logger.info("Running in serverless environment (Vercel); background daemon bypassed in favor of Vercel Crons.")
        return

    if scheduler.running:
        logger.info("Scheduler already running.")
        return

    try:
        # Schedule daily at 00:00:00 according to configured timezone
        scheduler.add_job(
            execute_midnight_reset,
            trigger=CronTrigger(hour=0, minute=0, second=0, timezone=settings.timezone),
            id="midnight_reset_job",
            name="Daily Habit Rollover & Streak Audit",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"APScheduler started successfully for timezone {settings.timezone} (Daily at 00:00:00).")
    except Exception as e:
        logger.error(f"Failed to start APScheduler: {e}")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
