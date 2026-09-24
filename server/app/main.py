"""
Safe Kids Guard — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.auth.router import router as auth_router
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

# TODO (Phase 2): include ai_engine router
# TODO (Phase 3): include content_filter, activity, alerts routers
# TODO (Phase 4): include policies, reports routers
# TODO (Phase 5): include admin router


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Safe Kids Guard API", "version": "1.0.0"}
