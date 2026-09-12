import logging
from typing import Optional
from supabase import create_client, Client
from config import settings

logger = logging.getLogger("liferpg.database")

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY is missing in backend configuration!")
        raise ValueError("Supabase configuration missing. Check backend/.env file.")

    try:
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise
