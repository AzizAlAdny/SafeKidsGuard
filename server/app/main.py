"""
Safe Kids Guard — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.auth.router import router as auth_router
from app.content_filter.router import router as content_filter_router
from app.alerts.router import router as alerts_router
from app.policies.router import router as policies_router
from app.activity.router import router as activity_router
from app.reports.router import router as reports_router
from app.ai_engine.model import load_models
from app.core.redis import init_redis, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    # ── Startup ──────────────────────────────────────────
    await init_redis()
    await load_models()  # AraBERT v2 + CAMeLBERT — lazy singletons
    yield
    # ── Shutdown ─────────────────────────────────────────
    await close_redis()


app = FastAPI(
    title="Safe Kids Guard API",
    description="AI-based Arabic content moderation for child online safety",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/redoc" if settings.APP_ENV == "development" else None,
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.APP_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(content_filter_router, tags=["Content Moderation & Alerts"])
app.include_router(alerts_router)
app.include_router(policies_router)
app.include_router(activity_router)
app.include_router(reports_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Safe Kids Guard API", "version": "1.0.0"}
