# Safe Kids Guard 🛡️👨‍👩‍👧‍👦

> **An Intelligent AI-Powered Parental Control & Child Safety Platform for Arabic Digital Content**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-009688.svg)](server/)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js_16_Turbopack-black.svg)](client/Dashboard/)
[![Tailwind](https://img.shields.io/badge/CSS-Tailwind_v4_RTL-38B2AC.svg)](client/Dashboard/)
[![Android](https://img.shields.io/badge/Client-Android_Kotlin_Compose-green.svg)](client/child_monitoring_app/)
[![PyTorch](https://img.shields.io/badge/AI_Engine-PyTorch_%2B_Transformers-EE4C2C.svg)](server/)
[![Web Push](https://img.shields.io/badge/Notifications-FCM_Web_Push-0B518E.svg)](server/)
[![Tests](https://img.shields.io/badge/Pytest-50%2F50_Passed_(100%25)-brightgreen.svg)](server/)
[![Android Tests](https://img.shields.io/badge/Android_JUnit-6%2F6_Passed_(100%25)-brightgreen.svg)](client/child_monitoring_app/)
[![Build](https://img.shields.io/badge/Next.js_Build-18_Routes_Passed-brightgreen.svg)](client/Dashboard/)

---

## 🌟 Project Overview

With the rapid adoption of smartphones and social media among children in the Arabic-speaking world, major safety challenges have emerged—including exposure to **Cyberbullying**, **Inappropriate/Sexual Content**, **Violence & Self-Harm**, and **Hate Speech**. Arabic content presents distinct linguistic hurdles, including spoken colloquial dialects, unvocalized text (omitted Tashkeel), letter stretching (Tatweel), and Arabizi (Latin-script Arabic).

**Safe Kids Guard** addresses this challenge through an integrated, three-tier architecture:

1. **Android Child Monitoring App (`client/child_monitoring_app/`):** Observes on-screen text in real time using Android's `AccessibilityService` with a 1.5-second debounce and deduplication window to prevent battery drain, plus a 10-second live policy synchronization loop. It protects privacy by ignoring password fields, bounds payloads safely (`<= 4,500` chars), normalizes URL domains and regional app package aliases, rotates JWT tokens automatically on expiration, logs local policy violations (`POST /activity`), and takes immediate protective action (returning to home via `GLOBAL_ACTION_HOME` with a block & appeal overlay) upon detecting harmful content or blocked apps/URLs.
2. **AI & Mediation Backend (`server/`):** Processes Arabic text through an advanced preprocessing pipeline and evaluates it with a dual-tier NLP architecture (**AraBERT v2 + CAMeLBERT**) executed off the event loop via `asyncio.to_thread`. It features **SlowAPI** rate limiting and flexible database support (**SQLite** by default with zero configuration, **XAMPP MySQL**, or **PostgreSQL**).
3. **Parent & Administrator Dashboard (`client/Dashboard/`):** A responsive Progressive Web App (PWA) built with **Next.js 16**, **React 19**, and **Tailwind CSS v4** using the Arabic **Cairo** typography and standardized English numerals (`0–9`) for dates and times. Connected to live backend APIs (with automatic `localhost` and LAN IP resolution) for device pairing, real-time 4-second browser push notifications & Web Audio chimes, live activity logs, instant-save protection policies, and 100% Arabic RTL executive PDF reports.

---

## 🏗️ System Architecture

```
                             [ Child Device - Android Kotlin App ]
                      (MonitoringAccessibilityService + 1.5s Debounce)
                                            │
                                            │ 1. Real-time on-screen text inspection
                                            ▼ (POST /api/v1/classification/predict)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Backend Server (FastAPI + SlowAPI)                              │
│                                                                                        │
│  [1. Preprocessing] ───▶ [2. Redis Cache] ────▶ [3. AI Engine] ─────▶ [4. Policies]   │
│  • Tashkeel removal       • SHA-256 fingerprint  • AraBERT v2 (MSA)    • Sensitivity   │
│  • Tatweel removal        • Latency < 1ms        • CAMeLBERT (Dialect) • Category block│
│  • Arabizi conversion     • TTL: 24 hours        • Fast-Path Regex     • App blacklist │
│  • HTML / password filter • Graceful fallback    • Async thread worker • URL blacklist │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼ (When harmful content is detected)             ▼ (Audit logging & state update)
       [ Real-Time Alert Dispatch ]                     [ Database (SQLAlchemy 2.0 Async) ]
       • Firebase Cloud Messaging (Web Push)            • SQLite (safekids_dev.db - local default)
       • Instant Browser & In-App Security Alerts       • XAMPP MySQL or PostgreSQL
       • Immediate local app dismissal on child device  • Users, Families, Policies, Members
                    │                                   • Alerts & Child Activity Logs
                    ▼                                                   │
       [ Parent Device / Browser ]                                      │
       (Instant Security Push Alert)                                    ▼
                                                        [ Parent Dashboard (Next.js) ]
                                                        • Live activity feed & alerts review
                                                        • Child policy configuration & schedules
                                                        • Analytics charts & Arabic PDF exports
```

---

## 📂 Repository Components

The repository is organized into three decoupled, complementary components:

```
SafeKidsGuard/
├── server/                     # FastAPI AI engine, database models, and RESTful APIs
│   ├── app/                    # Application source (auth, ai_engine, content_filter, alerts, policies, activity, reports, admin)
│   ├── alembic/                # Database schema migrations
│   ├── tests/                  # Automated pytest suite (50/50 passing tests, 100%)
│   └── README.md               # 📄 Comprehensive server documentation & environment variables
│
├── client/
│   ├── Dashboard/              # Parent & Admin web portal (Next.js 16 + React 19 + Tailwind v4 + Cairo)
│   │   ├── src/app/            # App routes ((parent): dashboard, alerts, children, activity, policies, reports, notifications | (admin): users, models, flagged, settings)
│   │   ├── src/proxy.ts        # Role-Based Access Control (RBAC) route proxy (Next.js 16)
│   │   ├── public/             # Static assets, PWA manifest, and Firebase service worker
│   │   └── README.md           # 📄 Dashboard documentation, theming & route structure
│   │
│   └── child_monitoring_app/   # Native Android protection client (Kotlin + Jetpack Compose M3)
│       ├── app/src/main/       # Application code, AccessibilityService, PolicyEvaluator, EncryptedSharedPreferences, Retrofit
│       ├── app/src/test/       # JUnit 4 automated unit test suite (6/6 passing tests, 100%)
│       └── README.md           # 📄 Android app documentation, permissions & pairing flow
│
├── docs/                       # Project documentation, academic requirements, and system diagrams
├── docker-compose.yml          # Container orchestration (FastAPI + PostgreSQL + Redis + Dashboard)
└── .github/workflows/ci.yml    # Continuous Integration (CI) automated testing workflow
```

---

## ⚡ Quickstart Guide

You can run the system locally using either a lightweight local setup or full Docker orchestration:

### Option 1: Local Development (Default SQLite, Zero External Dependencies)

A fresh clone requires Python 3.11 and Node.js 20+ (with npm). SQLite is the default database and requires zero installation.

**Windows (PowerShell) — Backend:**

```powershell
cd server
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

# 1. Initialize environment configuration
Copy-Item .env.example .env

# 2. Apply database migrations & seed default admin
alembic upgrade head
python create_admin.py

# 3. Start the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> [!NOTE]
> If PowerShell blocks virtual environment script execution, run:  
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

**In a second terminal — Dashboard:**

```powershell
cd client/Dashboard
npm install
npm run dev
```

**macOS / Linux:**
```bash
# Terminal 1 — Backend:
cd server
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python create_admin.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Dashboard:
cd client/Dashboard
npm install
npm run dev
```

> [!TIP]
> The backend supports instant switching to **XAMPP MySQL** by updating one line in `server/.env`:  
> `DATABASE_URL=mysql+aiomysql://root:@localhost:3306/safekidsguard`

---

### Option 2: Full Docker Compose Environment

Launches the complete production stack (FastAPI + PostgreSQL + Redis + Dashboard):

```bash
# 1. Clone repository and enter directory
git clone https://github.com/AzizAlAdny/SafeKidsGuard.git
cd SafeKidsGuard

# 2. Build and start all services including the Next.js Dashboard:
docker compose --profile full up --build
```

* **Parent & Admin Dashboard (Next.js):** [http://localhost:3000](http://localhost:3000)
* **Interactive API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Standard API Base Path (v1):** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
* **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 🔑 Default Credentials for Evaluation

| Role | Email | Password | Post-Login Landing Page |
|---|---|---|---|
| **System Administrator (Admin)** | `admin@safekidsguard.com` | `Admin@123456` | `/admin` (User management, AI metrics, content moderation) |

> [!NOTE]
> To create an additional administrator or promote any existing registered user:  
> `cd server && python create_admin.py`

---

## 🧪 Testing & Quality Assurance

All system modules are backed by automated tests covering functionality, edge cases, and security:

### 1. Backend Automated Suite (`server/tests`)
* **50 out of 50 tests passing (100%)**:
  * `test_unit_suite.py` (10 tests): Dedicated unit test suite (`UT-01`–`UT-10`) covering password hashing & verification, JWT validation, Arabic preprocessing, Arabizi normalization, safe & inappropriate content classification, dialect detection, backend policy evaluation, and Android local policy evaluation.
  * `test_auth.py` (11 tests): Registration, login, international E.164 & Saudi phone format validation, JWT token rotation, child device queries, `/api/v1/` compatibility, and SlowAPI rate limiting (HTTP 429).
  * `test_preprocessing.py` (6 tests): Arabic text normalization, HTML stripping, Tashkeel/Tatweel removal, Arabizi parsing (preserving standalone digits), and elongation reduction.
  * `test_classification.py` (6 tests): Five-category classification accuracy, automated Web Push alert triggering, and UUID validation.
  * `test_notifications.py` (3 tests): Notification preferences and instant security push notification testing.
  * `test_policies.py` (2 tests): Sensitivity thresholds, category blocking rules, and access authorization.
  * `test_activity.py` (1 test): Activity stream recording and custom policy bypass exceptions.
  * `test_reports.py` (1 test): Summary analytics aggregation and valid binary Arabic PDF generation (`%PDF-`).
  * `test_security_and_admin.py` (10 tests): Safe handling of long Arabic passwords (>72 bytes), IDOR prevention, 6-digit PIN device pairing and unpairing, false-positive prevention for benign Arabic roots (e.g. `كرة القدم`, `القادم`, `تبرع بالدم`), child access appeals (`UC-C5`), and the administrator control lifecycle (`FR10–FR13`).

### 2. Frontend & Type Safety (`client/Dashboard`)
* **18 distinct routes** verified across `(parent)` and `(admin)` layouts with server-side RBAC protection via [src/proxy.ts](client/Dashboard/src/proxy.ts).

### 3. Android Child Client Automated Suite (`client/child_monitoring_app/app/src/test`)
* **6 out of 6 JUnit tests passing (100%)** in `PolicyEvaluatorTest.kt`:
  * Screen text payload truncation (`<= 4,500` chars) under FastAPI's `max_length=5000` limit.
  * Cross-midnight (`21:00–06:00`) and same-day (`13:00–15:30`) bedtime window evaluation.
  * Case-insensitive blacklisted domain matching with `https://`, `www.`, `m.`, and path normalization (`normalizeDomain`).
  * Blocked application matching across exact package names, regional package variants (e.g., TikTok `com.zhiliaoapp.musically` / `com.ss.android.ugc.trill`), and custom app keywords (`isAppBlocked`).
  * 6-digit pairing PIN sanitization and validation.

---

## 📑 Component Documentation Links

* 📘 [Backend & AI Engine Guide (Server README)](server/README.md)
* 💻 [Parent Dashboard Guide (Dashboard README)](client/Dashboard/README.md)
* 📱 [Android Child Monitoring Client Guide (Android App README)](client/child_monitoring_app/README.md)
* 🧪 [Complete Real-World Testing Guide (Phone, Server & Dashboard)](SYSTEM_TESTING_GUIDE.md)

---
