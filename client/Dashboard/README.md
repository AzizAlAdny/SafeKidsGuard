# Safe Kids Guard — Parent & Admin Dashboard 🖥️🛡️

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6_(Turbopack)-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Recharts](https://img.shields.io/badge/Recharts-3.10.1-22c55e.svg)](https://recharts.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)
[![RTL Supported](https://img.shields.io/badge/Language-Arabic_RTL_(Cairo)-07365f.svg)](https://fonts.google.com/specimen/Cairo)

**Safe Kids Guard Dashboard** is a progressive web application (PWA) built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**. It is tailored for parents to configure child safety policies, monitor real-time activity feeds, receive instant push security alerts, review safety analytics, and for administrators to manage accounts and review model performance.

The dashboard features native Right-to-Left (RTL) layout support using the Arabic **Cairo** font family and adheres to strict user experience standards.

---

## 📑 Table of Contents
1. [Implemented Routes & Features](#-implemented-routes--features)
2. [Design System & Color Palette](#-design-system--color-palette)
3. [Project Structure](#-project-structure)
4. [Prerequisites](#-prerequisites)
5. [Installation & Local Setup](#-installation--local-setup)
6. [Environment Variables (.env.local)](#-environment-variables)
7. [Build & Production Commands](#-build--production-commands)
8. [Progressive Web App (PWA & Service Worker)](#-progressive-web-app)

---

## 🌟 Implemented Routes & Features

The dashboard includes **18 verified routes** covering both the Parent portal and the Central Administration console:

| Route | Page | Purpose & Core Capabilities |
|---|---|---|
| `/` | **Landing / Root** | Smart redirection based on user authentication state. |
| `/login` | **Sign In** | Role-based authentication redirecting parents to `/dashboard` and admins to `/admin`. |
| `/register` | **Parent Registration** | New parent registration with password strength meter, policy checklist, and password confirmation. |
| `/dashboard` | **Parent Overview** | Real-time safety KPIs, recent threat feed, and paired device summary. |
| `/alerts` | **Threat & Alerts Feed** | Filterable table of intercepted content, confidence scores, and context snippets. |
| `/children` | **Child Account Manager** | Add children, issue official 6-digit pairing PINs, and monitor pairing status. |
| `/activity` | **Live Activity Log** | Real-time audit log of inspected screen text (safe and blocked) and originating apps. |
| `/policies` | **Protection Policies** | Preset templates (Child/Teen), category toggles, AI sensitivity slider, 11 popular app quick-toggles + custom app/package blocker, URL blacklist with domain normalization, and instant auto-save. |
| `/reports` | **Analytics & PDF Export** | Interactive safety AreaChart, RTL threat distribution breakdown, and on-demand 100% Arabic RTL Executive PDF report generator (`format=base64` transport). |
| `/notifications` | **Alert Settings** | Manage Web Push security notifications, interactive browser permission test badge, 4-second real-time background alert watcher with Web Audio chimes, and instant verification alerts. |
| `/admin` | **Admin Command Center** | Macro-level system metrics: active users, total scans, and blocked threats (`FR13`). |
| `/admin/users` | **User Management** | Search, filter, activate/deactivate, and delete accounts (`FR10, UC-A1`). |
| `/admin/models` | **AI Model Telemetry** | Status monitor for `AraBERTv2` & `CAMeLBERT`, category counts, and model reloader (`FR11, UC-A2`). |
| `/admin/flagged` | **Flagged Content Review** | Audit blocked content, process child access appeals, and approve false positives (`UC-A4, UC-C5`). |
| `/admin/settings` | **System Governance** | Global confidence threshold adjustment and neural model toggle (`FR12, UC-A6`). |

---

## 🎨 Design System & Color Palette

The visual identity is derived directly from the official Safe Kids Guard branding and defined in **Tailwind CSS v4** `@theme` variables:

* **Primary Navy:** `#07365f` and `#0b518e` (Communicates security, stability, and authority).
* **Vibrant Cyan:** `#159cb7`, `#1bc3e4`, and `#76dbef` (Interactive controls, highlights, and primary actions).
* **Safe / Allowed Green:** `#2abe50` and `#eaf9ef` (Benign content status and high safety scores).
* **Threat / Blocked Red:** `#e33a0a` and `#feebe6` (Blocked content and critical alerts).
* **Warning Orange:** `#e5820a` and `#fff6eb` (Cyberbullying warnings and review indicators).
* **Sexual Content Pink:** `#d81b60` and `#fde8ef` (Inappropriate content indicators).
* **Canvas Backgrounds:** `#f0fafc` and `#edf5f8` (High-contrast, eye-friendly layout surfaces).

---

## 📁 Project Structure

```
client/Dashboard/
├── public/
│   ├── firebase-messaging-sw.js   # FCM Service Worker for background push notifications
│   ├── manifest.json              # Progressive Web App manifest definition
│   ├── logo.jpeg                  # Official Safe Kids Guard brand emblem
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/                # Unauthenticated authentication layout
│   │   │   ├── login/page.tsx     # Role-aware login view
│   │   │   └── register/page.tsx  # Registration with password policy & strength meter
│   │   ├── (parent)/              # Parent portal with persistent sidebar & RTL layout
│   │   │   ├── layout.tsx         # Sidebar, navigation, 4s real-time alert watcher & popup stack
│   │   │   ├── dashboard/page.tsx # Executive overview cards
│   │   │   ├── alerts/page.tsx    # Threat alerts feed
│   │   │   ├── children/page.tsx  # Child account & PIN pairing manager
│   │   │   ├── activity/page.tsx  # Real-time activity audit log
│   │   │   ├── policies/page.tsx  # Safety policies, app/URL blacklists & instant auto-save
│   │   │   ├── reports/page.tsx   # Visual charts, RTL threat progress list & Arabic PDF export
│   │   │   └── notifications/page.tsx # Push & in-app security alert settings
│   │   ├── (admin)/               # Administrator portal
│   │   │   ├── layout.tsx         # Admin sidebar and header layout
│   │   │   ├── admin/page.tsx     # Macro system health overview
│   │   │   ├── admin/users/page.tsx # User account management
│   │   │   ├── admin/models/page.tsx # AI model telemetry
│   │   │   ├── admin/flagged/page.tsx # Content review and child appeals
│   │   │   └── admin/settings/page.tsx # Global thresholds and system settings
│   │   ├── globals.css            # Cairo typography imports and Tailwind v4 theme
│   │   ├── layout.tsx             # Root document layout with dir="rtl" and lang="ar"
│   │   └── page.tsx               # Root entrypoint redirector
│   ├── components/
│   │   └── ConfirmModal.tsx       # Accessible RTL confirmation dialog component
│   ├── proxy.ts                   # Next.js 16 route proxy enforcing role-based route access (RBAC)
│   └── lib/
│       ├── api.ts                 # Axios instance with dynamic LAN/localhost URL resolution & JWT refresh
│       ├── auth-store.ts          # Zustand authentication store with cookie synchronization
│       ├── browser-notifications.ts # Native browser Notification API & Web Audio chime engine
│       └── utils.ts               # Tailwind class merge utilities
├── Dockerfile                     # Standalone production container definition
├── next.config.ts                 # Next.js, Turbopack, and allowedDevOrigins configuration
├── package.json                   # Dependency manifests and build scripts
└── tsconfig.json                  # TypeScript compiler options
```

---

## 💻 Prerequisites

* **Node.js:** Version **20.x (LTS)** or newer (v20 or v22 recommended).
* **NPM:** Version **10.x** or newer.

---

## ⚡ Installation & Local Setup

### 1. Install Dependencies
```bash
cd client/Dashboard
npm install
```

### 2. Configure Environment Variables (`.env.local`)
Create `.env.local` in the dashboard folder (note: `src/lib/api.ts` also automatically resolves `http://${window.location.hostname}:8000` in the browser so both `http://localhost:3000` and LAN access via `http://192.168.1.102:3000` work seamlessly out of the box):
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Web Push Configuration (Optional for local dev)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server with Turbopack
```bash
npm run dev
```
Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## 🔨 Build & Production Commands

```bash
# Typecheck TypeScript and compile production assets:
npm run build

# Start production server:
npm run start

# Run ESLint validation:
npm run lint
```

---

## 📱 Progressive Web App (PWA & Service Worker)

* **Installable Application:** Supported via `manifest.json`, allowing parents to install the dashboard to mobile homescreens (Android / iOS) or desktops (Windows / macOS) as a standalone app.
* **Background Notification Worker (`firebase-messaging-sw.js`):** Receives push alerts even when the browser tab is closed, ensuring parents never miss urgent safety warnings.
