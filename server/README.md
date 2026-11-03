# Safe Kids Guard API — Server & AI Engine 🛡️

[![Python 3.11](https://img.shields.io/badge/Python-3.11.9-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0_Async-red.svg)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D.svg)](https://redis.io/)
[![PyTorch](https://img.shields.io/badge/PyTorch-CPU_Optimized-EE4C2C.svg)](https://pytorch.org/)
[![Meta WhatsApp API](https://img.shields.io/badge/WhatsApp-Cloud_API_v21.0-25D366.svg)](https://developers.facebook.com/)
[![Tests](https://img.shields.io/badge/Pytest-39%2F39_Passed-brightgreen.svg)](https://docs.pytest.org/)

**Safe Kids Guard API** is an intelligent parental-control backend built with **FastAPI**, designed to protect children from digital threats and harmful content in Arabic digital environments. It serves as the core intelligence hub coordinating the three-tier system (Android child accessibility service + Parent web dashboard + AI moderation core).

---

## 📑 Table of Contents
1. [Core Features & Capabilities](#-core-features--capabilities)
2. [System Architecture](#-system-architecture)
3. [Project Directory Structure](#-project-directory-structure)
4. [Prerequisites](#-prerequisites)
5. [Quickstart & Local Installation](#-quickstart--local-installation)
6. [Environment Variables (.env Configuration)](#-environment-variables)
7. [Database & Migrations](#-database--migrations)
8. [Running the Server](#-running-the-server)
9. [Automated Testing](#-automated-testing)
10. [RESTful API Reference](#-restful-api-reference)

---

## 🚀 Core Features & Capabilities

### 1. Arabic NLP AI Moderation Engine (Dual-Model Ensemble)
* **Comprehensive Arabic Preprocessing Pipeline (`preprocessing.py`):**
  * Tashkeel (diacritics) removal.
  * Tatweel / Kashida (character elongation) removal.
  * Arabic letter normalization (Hamza variations, Alif Maqsura, Taa Marbuta).
  * Repeated character compression (Elongation Reduction).
  * Arabizi / Leetspeak translation (e.g., converting `7mar` to `حمار` while preserving pure numbers like `2026`).
* **Dual Ensemble Architecture:**
  * **AraBERT v2 (`aubmindlab/bert-base-arabertv2`):** Specialized for Modern Standard Arabic (MSA).
  * **CAMeLBERT (`CAMeL-Lab/bert-base-arabic-camelbert-da` / `hossam87/bert-base-arabic-hate-speech`):** Tuned for regional spoken dialects (Gulf, Egyptian, Levantine) and hate speech detection.
  * Fast-Path regex heuristics for explicit threats with sub-100ms response times.
* **Five Classification Categories:**
  * `SAFE`: Benign and appropriate content.
  * `CYBERBULLYING`: Harassment, insults, and verbal bullying.
  * `SEXUAL`: Inappropriate, explicit, or sexually suggestive text.
  * `VIOLENCE`: Physical threats, assault, weaponry, and self-harm incitement.
  * `HATE_SPEECH`: Racial, sectarian, or discriminatory speech.

### 2. High-Performance Redis Caching Layer
* Caches classification outcomes keyed by the SHA-256 fingerprint of preprocessed text.
* 24-hour TTL drastically reduces inference load on Transformer models, enabling sub-millisecond responses for repeated queries.
* Graceful fallback: the system seamlessly continues running in-memory if Redis is offline.

### 3. Multi-Channel Alert Dispatch
* **Primary Channel (Meta WhatsApp Cloud API v21.0):**
  * Real-time official template notifications delivered directly to parents upon detecting blocked content.
  * Automatic normalization of Saudi phone numbers to international E.164 format (`966XXXXXXXXX`).
* **Secondary Channel (FCM Web Push):**
  * Direct browser push notifications when WhatsApp delivery is unavailable.

### 4. Granular Parental Policies & Device Control
* Per-child configurable AI sensitivity threshold (50% to 95%).
* Independent toggles for each safety category.
* Application blacklisting via Android package names (e.g. TikTok, Instagram, Snapchat, Roblox).
* Custom website and domain blacklist (URL Blacklist).
* Daily screen-time allowances and enforced bedtime windows.

### 5. Live Activity Stream & Privacy Protection
* Records on-screen text events with originating app package, context, and timestamp.
* Child privacy is strictly preserved: text snippets are truncated to 200 characters, and sensitive input fields are filtered.

### 6. Analytics & Arabic PDF Reports
* Computes real-time Digital Safety Scores and threat distribution ratios.
* Generates downloadable executive PDF reports using `ReportLab` with complete Arabic bidirectional (BiDi) shaping and custom TrueType fonts.

---

## 🏛️ System Architecture

```
                     ┌───────────────────────────────────┐
                     │    Child Android Monitoring App   │
                     │  (AccessibilityService + Retrofit)│
                     └─────────────────┬─────────────────┘
                                       │ POST /classification/predict
                                       │ GET /policies/{child_id}
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FastAPI Backend                                 │
│                                                                             │
│  ┌──────────────────────┐   ┌───────────────────────┐   ┌────────────────┐ │
│  │   Auth & Security    │   │ Content Filter Service│   │ Alert Service  │ │
│  │   JWT + Bcrypt       │──▶│ Policies + Activity   │──▶│ Meta WhatsApp  │ │
│  │   Role Authorization │   │ Decision Engine       │   │ FCM Web Push   │ │
│  └──────────────────────┘   └───────────┬───────────┘   └────────────────┘ │
│                                         │                                   │
│                     ┌───────────────────┴───────────────────┐               │
│                     ▼                                       ▼               │
│         ┌───────────────────────┐               ┌───────────────────────┐   │
│         │   Redis Cache Engine  │               │   AI Moderation Core  │   │
│         │   SHA-256 Hash Store  │               │   AraBERT + CAMeLBERT │   │
│         └───────────────────────┘               └───────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQLAlchemy 2.0 (Async)
                                       ▼
                     ┌───────────────────────────────────┐
                     │  PostgreSQL (Supabase) / SQLite   │
                     │  users | policies | alerts        │
                     │  activity_events | preferences    │
                     └───────────────────────────────────┘
```

---

## 📁 Project Directory Structure

```
server/
├── app/
│   ├── activity/                # Live activity feed and browsing log services
│   │   ├── models.py            # ActivityEvent ORM entity
│   │   ├── router.py            # GET/POST /activity
│   │   ├── schemas.py           # Pydantic schemas for event batches and pagination
│   │   └── service.py           # Activity ingestion and child ownership validation
│   ├── ai_engine/               # Arabic NLP and dual-model classification core
│   │   ├── cache.py             # Redis caching layer with fallback
│   │   ├── classifier.py        # Dual ensemble classifier and threat rules
│   │   ├── model.py             # HuggingFace model loader (Lazy Singleton)
│   │   └── preprocessing.py     # Diacritics, Tatweel, Arabizi, and HTML cleaning
│   ├── alerts/                  # Notification and alert dispatch services
│   │   ├── router.py            # GET/PUT /notifications/preferences, test-whatsapp
│   │   ├── schemas.py           # Notification settings schemas
│   │   └── whatsapp.py          # Meta WhatsApp Cloud API integration
│   ├── auth/                    # Authentication, device pairing & RBAC
│   │   ├── models.py            # User, Family, FamilyMember, NotificationPreferences
│   │   ├── router.py            # /auth/register, /login, /refresh, /children, /me
│   │   ├── schemas.py           # Registration, credentials, and pairing models
│   │   └── service.py           # Bcrypt hashing, JWT generation, 6-digit PIN pairing
│   ├── content_filter/          # Content moderation and policy enforcement
│   │   ├── models.py            # Alert ORM entity
│   │   ├── router.py            # POST /classification/predict, GET /alerts, /request-access
│   │   ├── schemas.py           # Prediction request/response schemas
│   │   └── service.py           # Sensitivity threshold evaluation and alert triggers
│   ├── core/                    # System infrastructure and configuration
│   │   ├── config.py            # Pydantic Settings with multi-path .env resolution
│   │   ├── database.py          # SQLAlchemy AsyncSession and database engine
│   │   ├── dependencies.py      # Dependency injection (get_current_user, require_role)
│   │   ├── redis.py             # Redis client lifecycle management
│   │   └── security.py          # JWT issuance, revocation, and long-password hashing
│   ├── policies/                # Parental policies and application blacklist
│   │   ├── models.py            # Policy ORM entity
│   │   ├── router.py            # GET/PUT /policies/{child_id}
│   │   ├── schemas.py           # Policy configuration schemas
│   │   └── service.py           # Ownership verification and policy updates
│   ├── reports/                 # Reporting and Arabic PDF exports
│   │   ├── router.py            # GET /reports/summary, GET /reports/export-pdf
│   │   ├── schemas.py           # Safety score and threat distribution models
│   │   └── service.py           # Metrics aggregation and ReportLab BiDi PDF generator
│   ├── admin/                   # Administrator management module (FR10–FR13, UC-A1–UC-A6)
│   │   ├── router.py            # /admin/users, /ai-metrics, /flagged, /settings
│   │   ├── schemas.py           # User administration and flagged content schemas
│   │   └── service.py           # Account deactivation, metrics, and appeal review
│   └── main.py                  # FastAPI application entrypoint, CORS, and routers
├── alembic/                     # Database schema migration files
│   ├── versions/                # Ordered revision migration scripts
│   └── env.py                   # Alembic environment and model metadata registry
├── tests/                       # Comprehensive automated test suite (39 tests)
│   ├── conftest.py              # Test harness and in-memory database isolation
│   ├── test_activity.py         # Activity logging and policy exception tests
│   ├── test_auth.py             # Registration, login, rate limiting, and PIN pairing tests
│   ├── test_classification.py   # Classification accuracy and alert trigger tests
│   ├── test_notifications.py    # Notification preferences and WhatsApp tests
│   ├── test_policies.py         # Policy updates and authorization tests
│   ├── test_preprocessing.py    # Arabic normalization and Arabizi tests
│   ├── test_reports.py          # Summary analytics and binary PDF tests
│   └── test_security_and_admin.py # IDOR security, device pairing, and admin tests
├── .env.example                 # Reference environment template
├── alembic.ini                  # Alembic CLI configuration
├── Dockerfile                   # Production container definition
├── pytest.ini                   # Pytest configuration with asyncio mode
└── requirements.txt             # Pinned Python package dependencies
```

---

## 💻 Prerequisites

* **Python 3.11.9 (64-bit)**: Recommended version with pre-compiled wheels for `torch` and `transformers`.
* **Redis** (local, Docker, or managed cloud): Optional for local dev, recommended for production.
* **Git** for version control.

---

## ⚡ Quickstart & Local Installation

### 1. Clone Repository & Navigate to Server Directory
```bash
cd server
```

### 2. Create and Activate Virtual Environment
```bash
# Create virtual environment with Python 3.11
py -3.11 -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
cp .env.example .env
```
Open `.env` and verify your settings (see table below).

### 5. Apply Database Migrations & Seed Default Admin
```bash
alembic upgrade head
python create_admin.py
```

---

## 🔐 Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./safekids_dev.db` | Async database connection URL (SQLite local, PostgreSQL for production) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis caching connection string |
| `JWT_SECRET_KEY` | *(Random long string)* | Cryptographic key used to sign JWT tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifespan in minutes |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifespan in days |
| `WA_PHONE_NUMBER_ID` | `""` | WhatsApp Phone Number ID from Meta Developer Console |
| `WA_ACCESS_TOKEN` | `""` | Permanent System User Token for Meta Cloud API |
| `AI_CONFIDENCE_THRESHOLD` | `0.75` | Minimum AI probability required to trigger automated blocking |
| `APP_ENV` | `development` | Environment mode (`development` enables Swagger at `/docs`) |
| `APP_CORS_ORIGINS` | `http://localhost:3000,...` | Whitelisted origins allowed for CORS |

---

## 🗄️ Database & Migrations

The backend utilizes **Alembic** for asynchronous database schema management:

```bash
# Apply all pending migrations to the latest revision:
alembic upgrade head

# Generate a new migration revision automatically after updating models:
alembic revision --autogenerate -m "describe changes here"
```

---

## 🏃 Running the Server

### Local Development Mode
```bash
# Start server with live hot-reloading:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
* **Interactive OpenAPI Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative API Docs (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

### Running with Docker
```bash
# Build the container:
docker build -t safekidsguard-server .

# Run the container:
docker run -p 8000:8000 --env-file .env safekidsguard-server
```

### 👤 Administrator Account Management
A dedicated CLI script [create_admin.py](create_admin.py) is included to initialize or promote admin accounts:

```bash
# Create a new administrator account:
python create_admin.py --email admin@safekidsguard.com --password "Admin@123456" --name "System Administrator"

# Or promote an existing user account to admin:
python create_admin.py --promote aziz@gmail.com
```

> **Default Admin Account:**
> * **Email:** `admin@safekidsguard.com`
> * **Password:** `Admin@123456`
> * **Admin Portal URL:** `http://localhost:3000/admin` (or sign in via `http://localhost:3000/login`)

---

## 🧪 Automated Testing

The server includes an automated test suite executed against isolated in-memory SQLite instances:

```bash
# Run the complete test suite:
python -m pytest tests/ -v
```

### Test Suite Summary (39 / 39 Tests Passing, 100%):
* `tests/test_auth.py` (10 tests): User registration, password verification, JWT issuance and refresh, Saudi phone formatting, and SlowAPI rate limiting.
* `tests/test_preprocessing.py` (6 tests): Arabic cleaning, HTML tag stripping, Tashkeel/Tatweel removal, Arabizi transliteration, and repetition reduction.
* `tests/test_classification.py` (6 tests): Classification accuracy across five categories and automated alert triggering.
* `tests/test_notifications.py` (3 tests): Notification preferences retrieval, updates, and simulated WhatsApp delivery.
* `tests/test_policies.py` (2 tests): Policy fetching, sensitivity updates, and unauthorized access prevention.
* `tests/test_activity.py` (1 test): Activity logging and parental exception handling.
* `tests/test_reports.py` (1 test): Analytics data aggregation and valid binary Arabic PDF export (`%PDF-`).
* `tests/test_security_and_admin.py` (10 tests): IDOR protection, 6-digit PIN device pairing/unpairing, token revocation upon logout, Arabic false-positive regression, child appeals, and administrator control APIs.

---

## 📡 RESTful API Reference

### 1. Authentication, Users & Device Pairing (`/auth`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new parent account with phone number |
| `POST` | `/auth/login` | Public | Authenticate user and issue access and refresh tokens (JWT with `family_id`) |
| `POST` | `/auth/refresh` | Public | Rotate expired access token using valid refresh token |
| `POST` | `/auth/logout` | Bearer Token | Revoke refresh token and invalidate current session |
| `GET` | `/auth/me` | Bearer Token | Retrieve currently authenticated user profile |
| `POST` | `/auth/children` | Parent / Admin | Create child account, link to family, and generate initial PIN |
| `GET` | `/auth/children` | Parent / Admin | List children linked to authenticated parent with pairing status |
| `POST` | `/auth/children/{child_id}/pairing-pin` | Parent / Admin | Generate fresh 6-digit pairing PIN valid for 15 minutes |
| `POST` | `/auth/pair-device` | Public (Rate-Limited) | Pair Android child app using 6-digit PIN and issue child JWT |
| `POST` | `/auth/unpair-device` | Bearer Token | Unpair child device after verifying parent password |

### 2. Content Moderation & Alerts (`/classification` & `/alerts`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/classification/predict` | Bearer Token + Child Ownership | Inspect on-screen text, apply policies, and dispatch background alert if blocked |
| `GET` | `/alerts` | Parent / Admin | Retrieve threat alerts with category filtering |
| `POST` | `/alerts/request-access` | Child / Parent | Submit child review appeal when content is blocked by mistake (`UC-C5`) |

### 3. Notification Preferences (`/notifications`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/notifications/preferences` | Parent / Admin | Retrieve alert channel preferences (WhatsApp, Web Push) |
| `PUT` | `/notifications/preferences` | Parent / Admin | Update recipient phone number and toggle channels |
| `POST` | `/notifications/test-whatsapp` | Parent / Admin | Send immediate test WhatsApp alert to verify delivery |

### 4. Parental Protection Policies (`/policies`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/policies/{child_id}` | Parent / Child / Admin | Fetch active protection policy for target child |
| `PUT` | `/policies/{child_id}` | Parent / Admin | Update sensitivity, blocked categories, app blacklist, URL blacklist, and bedtimes |

### 5. Live Activity Logging (`/activity`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/activity` | Parent / Admin | View real-time child activity log with pagination and filters |
| `POST` | `/activity` | Bearer Token + Child Ownership | Ingest inspected screen text event from child device |
| `POST` | `/activity/batch` | Bearer Token + Child Ownership | Ingest a batch of activity events in a single transaction |

### 6. Analytics & Reports (`/reports`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/reports/summary` | Parent / Admin | Aggregate digital safety score and threat distribution statistics |
| `GET` | `/reports/export-pdf` | Parent / Admin | Generate and download executive Arabic PDF report (BiDi-formatted) |

### 7. Administration & Governance (`/admin`)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin (`role: admin`) | List all registered accounts with role filtering (`FR10`) |
| `PATCH` | `/admin/users/{user_id}` | Admin (`role: admin`) | Activate/deactivate user accounts or update roles (`UC-A1`) |
| `DELETE` | `/admin/users/{user_id}` | Admin (`role: admin`) | Delete user account and associated records (`UC-A1`) |
| `GET` | `/admin/ai-metrics` | Admin (`role: admin`) | AI model performance metrics and classification distribution (`FR11, FR13`) |
| `GET` | `/admin/flagged` | Admin (`role: admin`) | List flagged/blocked content and pending child access appeals (`UC-A4`) |
| `PATCH` | `/admin/flagged/{alert_id}` | Admin (`role: admin`) | Mark item as confirmed threat or approved false positive (`UC-A4`) |
| `GET` | `/admin/settings` | Admin (`role: admin`) | Fetch system-wide security settings and AI threshold (`FR12`) |
| `PUT` | `/admin/settings` | Admin (`role: admin`) | Update global confidence threshold and toggle transformer inference (`UC-A6`) |

---
