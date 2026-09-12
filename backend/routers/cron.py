from fastapi import APIRouter
from models.schemas import CronResetResponse
from services.scheduler import execute_midnight_reset, scheduler
from config import settings

router = APIRouter(prefix="/api/cron", tags=["Automation & Cron Jobs"])

@router.post("/midnight-reset", response_model=CronResetResponse)
def trigger_midnight_reset():
    """
    Manually triggers the daily midnight habit rollover & streak audit.
    Useful for testing or external webhook automation.
    """
    result = execute_midnight_reset()
    return result

@router.get("/status")
def get_cron_status():
    """Checks the status of the background task scheduler."""
    jobs = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": str(job.next_run_time) if job.next_run_time else None
            })

    return {
        "scheduler_running": scheduler.running,
        "configured_timezone": settings.timezone,
        "active_jobs": jobs
    }
