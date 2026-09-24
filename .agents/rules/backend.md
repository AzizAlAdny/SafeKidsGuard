# Safe Kids Guard — Backend Rules (FastAPI + SQLAlchemy)

## Stack
- **Python 3.12** — use modern syntax (f-strings, `match`, `|` union types)
- **FastAPI** — async first; use `async def` for all route handlers
- **SQLAlchemy 2.0 (async)** — use `AsyncSession` with `async with` context manager
- **Alembic** — all schema changes via migrations (`alembic revision --autogenerate`)
- **Pydantic v2** — for all request/response models and settings
- **asyncpg** — async PostgreSQL driver
- **Supabase (PostgreSQL)** — primary database

---

## Project Structure Rules

```
server/
├── app/
│   ├── <module>/
│   │   ├── router.py     ← FastAPI APIRouter, route definitions only
│   │   ├── service.py    ← Business logic (no DB code here)
│   │   ├── models.py     ← SQLAlchemy ORM models
│   │   └── schemas.py    ← Pydantic request/response schemas
│   └── core/
│       ├── config.py     ← Pydantic BaseSettings (reads .env)
│       ├── database.py   ← Async engine + session factory
│       ├── security.py   ← bcrypt, JWT encode/decode
│       └── dependencies.py ← FastAPI Depends: get_db, get_current_user
```

- **Never put business logic in `router.py`** — routers call services only
- **Never put DB queries in `router.py` or `service.py`** — use repository pattern or SQLAlchemy in service with injected session

---

## AI Engine Rules

- **Two models** must be loaded: AraBERT v2 (MSA) + CAMeLBERT (dialectal). Both loaded at startup.
- Use the modern **lifespan** pattern — `@app.on_event("startup")` is deprecated in FastAPI 0.95+:

```python
# ✅ CORRECT — modern FastAPI lifespan
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load both models into app.state
    app.state.arabert = load_arabert_model()       # MSA content
    app.state.camelbert = load_camelbert_model()   # Dialectal content
    app.state.redis = await create_redis_pool()
    yield
    # Shutdown: cleanup
    await app.state.redis.close()

app = FastAPI(lifespan=lifespan)
```

- Never instantiate the tokenizer or model inside a request handler
- Run model inference in a **thread pool** (`asyncio.run_in_executor`) — HuggingFace inference is synchronous/blocking
- **Redis cache is mandatory**: before running inference, check `redis.get(sha256(text))`. On miss, run model and store result with 24h TTL.
- Always apply the full preprocessing pipeline before tokenization:
  1. Strip HTML (`BeautifulSoup`)
  2. Normalize Arabic Unicode (`unicodedata.normalize`)
  3. Remove diacritics (regex)
  4. Truncate to 512 tokens

```python
# Correct pattern for async inference with Redis cache
async def classify(text: str, model_type: str = "arabert") -> ClassificationResult:
    cache_key = f"classify:{hashlib.sha256(text.encode()).hexdigest()}"
    cached = await redis.get(cache_key)
    if cached:
        return ClassificationResult.parse_raw(cached)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_classify, text, model_type)
    await redis.setex(cache_key, 86400, result.json())
    return result
```

---

## Database Rules

- All tables must have:
  - `id: UUID` primary key (use `uuid.uuid4()` as default)
  - `created_at: datetime` with server default `now()`
- Use `ENUM` types for categories and roles (not plain strings)
- All queries must use parameterized values — never string interpolation (SQL injection prevention)
- Use Alembic for every schema change — never alter tables manually
- Connection pooling: max `pool_size=10`, `max_overflow=20`

---

## WhatsApp Notification Rules

**WhatsApp Business API is the PRIMARY parent notification channel.**

```python
# server/app/alerts/whatsapp.py
import httpx
from app.core.config import settings

WHATSAPP_URL = (
    f"https://graph.facebook.com/v21.0/{settings.WA_PHONE_NUMBER_ID}/messages"
)

async def send_whatsapp_alert(
    parent_phone: str,   # Format: 966XXXXXXXXX (Saudi +966, no leading +)
    child_name: str,
    category: str,
    confidence: float,
) -> bool:
    """Send pre-approved template alert to parent via WhatsApp."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            WHATSAPP_URL,
            headers={
                "Authorization": f"Bearer {settings.WA_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "messaging_product": "whatsapp",
                "to": parent_phone,
                "type": "template",
                "template": {
                    "name": "safe_kids_alert",
                    "language": {"code": "ar"},
                    "components": [{
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": category},
                            {"type": "text", "text": child_name},
                            {"type": "text", "text": f"{confidence*100:.0f}"},
                        ]
                    }]
                }
            }
        )
    return resp.status_code == 200
```

**Dispatch order (3-layer strategy):**
```python
# server/app/alerts/service.py
async def dispatch_alert(alert: Alert, parent: User, prefs: NotificationPreferences):
    # Layer 1: DB write → Supabase Realtime handles open-tab delivery automatically
    await db.insert(alert)

    # Layer 2: WhatsApp (PRIMARY — attempt first)
    if prefs.whatsapp_enabled and prefs.whatsapp_phone:
        delivered = await send_whatsapp_alert(
            parent_phone=prefs.whatsapp_phone,
            child_name=alert.child_name,
            category=alert.category,
            confidence=alert.confidence,
        )
        if delivered:
            return  # WhatsApp succeeded — done

    # Layer 3: FCM Web Push (FALLBACK — only if WhatsApp failed or not configured)
    if prefs.web_push_enabled and prefs.web_push_token:
        await send_fcm_web_push(
            token=prefs.web_push_token,
            title="⚠️ تنبيه - Safe Kids Guard",
            body=f"محتوى {alert.category} على جهاز {alert.child_name}",
        )
```

**Rules:**
- ❌ Never use unofficial WhatsApp libraries (Baileys, whatsapp-web.js) — ToS violation + ban risk
- ❌ Never use `requests` library for WhatsApp calls — it is synchronous and blocks the event loop
- ✅ Always use `httpx.AsyncClient` for WhatsApp API calls
- ✅ All WhatsApp alert message formats must be pre-approved Arabic templates in Meta Dashboard
- ✅ Parent phone must be stored in international format without `+`: e.g. `966501234567`
- ✅ WhatsApp delivery failure must fall through to FCM Web Push — never silently drop the alert
- ✅ Log `whatsapp_sent` and `web_push_sent` booleans to the `alerts` table for each dispatch

**Required environment variables (add to `.env.example`):**
```
WA_PHONE_NUMBER_ID=your_meta_phone_number_id
WA_ACCESS_TOKEN=your_permanent_system_user_token
WA_VERIFY_TOKEN=your_webhook_verify_token
```

**Required Arabic templates (register in Meta Business Dashboard):**
```
safe_kids_alert       — category: UTILITY
safe_kids_daily       — category: UTILITY  
safe_kids_screen_time — category: UTILITY
safe_kids_app_block   — category: UTILITY
```

---

## API Rules

- Use `APIRouter` with `prefix` and `tags` for each module
- All protected routes must use `Depends(get_current_user)` and role checks
- Paginated responses must follow this schema:
  ```json
  { "items": [...], "total": 100, "page": 1, "page_size": 20 }
  ```
- Use `HTTPException` for all error responses — never return 200 with error inside
- Add request ID middleware for traceability

---

## Authentication Rules

- JWT tokens: `access_token` (15 min expiry) + `refresh_token` (7 days)
- JWT payload must include: `sub` (user_id), `role`, `family_id`, `exp`
- Always validate `role` from JWT payload server-side before granting access
- Store refresh tokens in the DB (for revocation support)
- Rate limit login endpoint: max 5 attempts per IP per minute

---

## Testing Rules

- Use `pytest` + `pytest-asyncio` + `httpx.AsyncClient` for API tests
- Every new route must have at minimum: happy path test + auth failure test + validation error test
- Use `factory_boy` for test data generation
- AI classifier tests must include a minimum of 10 Arabic text samples covering all 5 categories
- Run `pytest --cov=app --cov-fail-under=70` in CI

---

## Dependencies (requirements.txt must include)
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
alembic>=1.13.0
pydantic>=2.7.0
pydantic-settings>=2.2.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
transformers>=4.44.0
torch>=2.3.0
firebase-admin>=6.5.0
httpx>=0.27.0              # WhatsApp API + async HTTP (replaces requests)
slowapi>=0.1.9
reportlab>=4.2.0
pandas>=2.2.0
beautifulsoup4>=4.12.0
python-dotenv>=1.0.0
redis[asyncio]>=5.0.0      # Async Redis client
ruff>=0.4.0
black>=24.0.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```
