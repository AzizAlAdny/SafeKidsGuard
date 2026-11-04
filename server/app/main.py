"""
Safe Kids Guard — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
import logging
import socket

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import engine
from app.core.limiter import limiter
from app.auth.router import router as auth_router
from app.content_filter.router import router as content_filter_router
from app.alerts.router import router as alerts_router
from app.policies.router import router as policies_router
from app.activity.router import router as activity_router
from app.reports.router import router as reports_router
from app.admin.router import router as admin_router
from app.ai_engine.model import load_models
from app.core.redis import init_redis, close_redis


def _get_local_lan_ip() -> str:
    """Detect the host machine's active LAN/Wi-Fi IPv4 address for mobile device testing."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    # ── Startup ──────────────────────────────────────────
    await init_redis()
    await load_models()  # AraBERT v2 + CAMeLBERT — lazy singletons
    lan_ip = _get_local_lan_ip()
    uvicorn_logger = logging.getLogger("uvicorn.error")
    uvicorn_logger.info("Uvicorn running on http://%s:8000 (Android Phone Wi-Fi)", lan_ip)
    uvicorn_logger.info("Uvicorn running on http://localhost:8000 (Local PC)")
    uvicorn_logger.info("Swagger API Docs:  http://%s:8000/docs", lan_ip)
    uvicorn_logger.info("Health Check URL:  http://%s:8000/api/v1/health", lan_ip)
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

# ── Rate Limiting (SlowAPI) ──────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.APP_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Standard API v1 Router ───────────────────────────────
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(content_filter_router, tags=["Content Moderation & Alerts"])
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(policies_router)
api_v1_router.include_router(activity_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(admin_router)

@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
@api_v1_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Safe Kids Guard API", "version": "1.0.0"}


app.include_router(api_v1_router)

# ── Root Backward-Compatibility Aliases ──────────────────
app.include_router(auth_router, prefix="/auth", include_in_schema=False)
app.include_router(content_filter_router, include_in_schema=False)
app.include_router(alerts_router, include_in_schema=False)
app.include_router(policies_router, include_in_schema=False)
app.include_router(activity_router, include_in_schema=False)
app.include_router(reports_router, include_in_schema=False)
app.include_router(admin_router, include_in_schema=False)
