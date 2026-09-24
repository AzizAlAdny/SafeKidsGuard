# Safe Kids Guard — Project-Wide Rules

## Project Identity
- **Name:** Safe Kids Guard
- **Purpose:** AI-based child online protection system with Arabic NLP focus
- **Team:** Alanoud Mohammed, Shahd Aljahdali, Aseel Albeshry
- **Supervisor:** Dr. Faria'a Al-Bashir, UJ — B.Sc. Information Technology (1447 / 2026)
- **Methodology:** Agile (5 sprints)

---

## Monorepo Structure
```
SafeKidsGuard/
├── client/Dashboard/               ← Next.js 15 (Parent + Admin Web)
├── client/child_monitoring_app/    ← Kotlin + Jetpack Compose (Android)
├── server/                         ← FastAPI (Python 3.12)
└── docs/
```
Never create files outside these directories without explicit user approval.

---

## Actors & Roles
- **Child** — Android app user; content is monitored and filtered silently
- **Parent** — Web dashboard user; monitors, configures policies, receives alerts
- **Admin** — Web dashboard user (admin role); manages users, AI models, global settings

All routes, API endpoints, and UI pages must enforce role-based access control (RBAC). **Never** rely on frontend-only role checks — all authorization must be validated server-side.

---

## Language & Localization
- The primary content language is **Arabic (Modern Standard Arabic first, Saudi/Gulf dialect in Phase 2)**.
- All user-facing strings must support Arabic text rendering.
- Use `dir="rtl"` and Arabic fonts (Cairo or Tajawal from Google Fonts) for all UI components.
- Backend Arabic text processing must handle: diacritics (تشكيل), Unicode normalization, dialect variation.

---

## Security Non-Negotiables
- Passwords must be hashed with **bcrypt** (never MD5/SHA1/plaintext).
- All API endpoints must require a valid **JWT token** (except `/auth/login` and `/auth/register`).
- Role-specific endpoints must verify role in the JWT payload **server-side**.
- Never log full URLs or content from child browsing sessions — only content snippets (≤200 chars) and hashes for privacy.
- All environment secrets (DB passwords, FCM keys, JWT secret) must be stored in `.env` files. Never hard-code secrets.
- Use HTTPS in all environments (enforce in production).
- Implement **rate limiting** on all public endpoints (classify, login, register) using `slowapi`.

---

## Privacy Principles
- 92% of target users prefer on-device processing — minimize data sent to the server.
- Never send full web page content to the server; send only extracted text snippets for classification.
- Activity logs must store only the first 200 characters of flagged content.
- User PII must never appear in logs or error messages.

---

## AI / NLP Rules
- **Primary models:** `aubmindlab/bert-base-arabertv2` (AraBERT v2) for MSA/formal text + `CAMeL-Lab/bert-base-arabic-camelbert-mix` (CAMeLBERT) for dialectal/social media Arabic
- Both models must be loaded as **lazy singletons** (load once at startup, reuse across requests)
- Model selection is based on content source: formal web content → AraBERT; social/chat/user-generated → CAMeLBERT
- Classification categories: `SAFE`, `CYBERBULLYING`, `SEXUAL`, `VIOLENCE`, `HATE_SPEECH`
- Every classification response must include: `{category, confidence, label, is_blocked, model_used}`
- Minimum confidence threshold for blocking: **0.75** (configurable via admin panel)
- Always run the Arabic text preprocessor **before** model inference
- Results must be cached in Redis: key = `sha256(text)`, TTL = 24 hours

---

## API Design Rules
- All API paths use `/api/v1/` prefix
- Use snake_case for JSON field names
- All endpoints must return standard error shapes: `{detail: string, code: string}`
- Use HTTP status codes correctly: 200/201 success, 400 validation, 401 unauth, 403 forbidden, 422 unprocessable, 500 server error
- All list endpoints must support pagination (`page`, `page_size`, `total` in response)

---

## Git & Code Quality
- Branch naming: `feature/<component>-<description>`, `fix/<issue>`, `sprint/<number>`
- Commit messages: imperative mood — "Add JWT refresh endpoint" not "Added..."
- All code must pass linting before commit:
  - Backend: `ruff` + `black`
  - Frontend: `eslint` + `prettier`
  - Android: `ktlint`
- No direct commits to `main` — use pull requests with at least one reviewer
- Write tests for every new backend endpoint and AI module

---

## Documentation Rules
- All new modules/classes/functions must have docstrings (Python) or JSDoc (TypeScript) or KDoc (Kotlin)
- Keep `docs/` updated with any architecture or API changes
- Update `README.md` whenever a new environment variable or setup step is added
