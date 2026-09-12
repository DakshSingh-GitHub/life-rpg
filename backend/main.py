import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from services.scheduler import start_scheduler, shutdown_scheduler
from routers import quests, shop, cron, leaderboards, ai

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("liferpg.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LifeRPG Game Engine Server...")
    start_scheduler()
    yield
    logger.info("Shutting down LifeRPG Game Engine Server...")
    shutdown_scheduler()

app = FastAPI(
    title="LifeRPG Authoritative Game Engine & AI API",
    description="""
⚔️ **LifeRPG Backend Services**:
- **Authoritative Quest Engine**: Non-linear XP, level thresholds, critical bounty rolls, and streak maintenance.
- **Economy & Armory Vault**: Atomic gold transactions and reward redemption.
- **Automated Midnight Reset**: Scheduled daily habit resets and streak verification at 00:00.
- **AI Dungeon Master**: Generative AI quest chain creation powered by Google Gemini.
- **Guild Hall Leaderboards**: Real-time attribute rankings and adventurer competition.
    """,
    version=settings.app_version,
    lifespan=lifespan
)

# Normalize /api/backend path prefix for Vercel serverless proxy parity
@app.middleware("http")
async def normalize_backend_prefix(request: Request, call_next):
    if request.scope.get("path", "").startswith("/api/backend"):
        request.scope["path"] = request.scope["path"].replace("/api/backend", "/api", 1)
    return await call_next(request)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(quests.router)
app.include_router(shop.router)
app.include_router(leaderboards.router)
app.include_router(ai.router)
app.include_router(cron.router)

@app.get("/", tags=["System"])
def root():
    return {
        "realm": "LifeRPG Core Engine",
        "status": "online",
        "version": settings.app_version,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected" if settings.supabase_url else "unconfigured",
        "timezone": settings.timezone
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", settings.port))
    host = os.getenv("HOST", settings.host)
    print(f"🗡️ Starting LifeRPG Game Engine on http://{host}:{port}")
    print(f"📖 Swagger Docs available at http://localhost:{port}/docs")
    uvicorn.run("main:app", host=host, port=port, reload=True)

