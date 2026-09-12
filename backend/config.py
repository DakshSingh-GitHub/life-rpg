import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Pre-load local environment file if present
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Settings(BaseSettings):
    app_name: str = "LifeRPG Game Engine API"
    app_version: str = "1.0.0"
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    cors_origins_str: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    timezone: str = os.getenv("TIMEZONE", "Asia/Kolkata")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
