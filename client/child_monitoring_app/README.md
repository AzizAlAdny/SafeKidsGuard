# Safe Kids Guard — Android Child Monitoring Client 📱🛡️

[![Platform](https://img.shields.io/badge/Platform-Android_8.0+_(API_26--35)-green.svg)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0+-7F52FF.svg)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Jetpack_Compose-Material_3-4285F4.svg)](https://developer.android.com/jetpack/compose)
[![Architecture](https://img.shields.io/badge/Architecture-Clean_%2F_MVVM_%2B_Hilt-orange.svg)](https://developer.android.com/training/dependency-injection/hilt-android)
[![Networking](https://img.shields.io/badge/Networking-Retrofit_2_%2B_OkHttp-blue.svg)](https://square.github.io/retrofit/)
[![University](https://img.shields.io/badge/University_of_Jeddah-Graduation_Project-07365f.svg)](https://www.uj.edu.sa/)

**Safe Kids Guard Child Monitoring App** is a native Android application installed on children's devices to serve as an intelligent, non-intrusive safety guard. It continuously inspects on-screen textual content in real time to protect minors from cyberbullying, adult/sexual content, violence, and hate speech.

The client acts as the edge monitoring component of the University of Jeddah Safe Kids Guard ecosystem (2026/2027), communicating directly with the **FastAPI AI Backend** and syncing with the **Next.js Parent Dashboard**.

---

## 📑 Table of Contents
1. [Technical Highlights & Capabilities](#-technical-highlights--capabilities)
2. [Inspection & Protection Flow (How It Works)](#-inspection--protection-flow-how-it-works)
3. [Android Permissions & Privacy by Design](#-android-permissions--privacy-by-design)
4. [Project Directory Structure](#-project-directory-structure)
5. [Prerequisites & Development Environment](#-prerequisites--development-environment)
6. [Backend API Configuration](#-backend-api-configuration)
7. [Build & Installation](#-build--installation)
8. [Network API Integration](#-network-api-integration)

---

## 🚀 Technical Highlights & Capabilities

* **Intelligent Accessibility Engine (`MonitoringAccessibilityService`):**
  * Monitors on-screen UI changes across browsers and apps (`TYPE_WINDOW_CONTENT_CHANGED` and `TYPE_VIEW_TEXT_CHANGED`).
  * Performs recursive traversal of the accessibility node hierarchy.
  * Employs a 2-second debounce and deduplication buffer to eliminate battery drain.
* **Privacy by Design:**
  * Password and secure credential fields are skipped automatically (`node.isPassword == true`).
  * Personal browsing history is never stored locally or transmitted in full; only bounded snippets of intercepted threats are processed.
* **Low-Latency Edge Mediation:**
  * Offloads classification requests to the dual-model AI backend (**AraBERT v2 + CAMeLBERT**).
  * Executes fast-path local policy checks (blocked packages, bedtimes, blacklisted URLs) with immediate remediation.
  * Dismisses harmful content instantly using `GLOBAL_ACTION_HOME`.
* **Periodic Policy Synchronization:**
  * Periodically polls `GET /policies/{child_id}` to keep local blocking rules up to date.
* **Persistent Service Lifecycle (`BootReceiver`):**
  * Re-arms monitoring services on device reboot (`BOOT_COMPLETED`).
* **Material 3 Jetpack Compose Interface:**
  * Modern RTL Arabic UI themed with official brand colors (Navy & Cyan).
  * 6-digit PIN pairing wizard and parent-password protected unpairing.

---

## 🔍 Inspection & Protection Flow (How It Works)

```
        Active App on Child Device (TikTok / YouTube / Browser)
                              │
                              ▼ (On-screen text update event)
              [MonitoringAccessibilityService]
                              │
                              ├─ Password or sensitive field? ──▶ [Immediate Privacy Bypass]
                              │
                              ▼ (Visible text > 3 characters)
           Extract text snippet and capture app package context
                              │
                              ▼ (Retrofit POST /classification/predict)
                    [FastAPI AI Backend]
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        [Decision: ALLOWED]         [Decision: BLOCKED]
          Continue browsing          1. Dismiss app to home screen (GLOBAL_ACTION_HOME)
                                     2. Log violation in audit table
                                     3. Trigger instant WhatsApp alert to parent
```

---

## 🔒 Android Permissions & Privacy by Design

The application requests a minimal set of Android system permissions to operate effectively:

| Permission | Purpose & Scope |
|---|---|
| `android.permission.INTERNET` | Communicates with the FastAPI backend for classification and policy synchronization. |
| `android.permission.BIND_ACCESSIBILITY_SERVICE` | Inspects on-screen text nodes to identify harmful content. |
| `android.permission.PACKAGE_USAGE_STATS` | Tracks foreground application usage to enforce daily screen-time allowances. |
| `android.permission.RECEIVE_BOOT_COMPLETED` | Automatically re-engages protection services following device restart. |
| `android.permission.FOREGROUND_SERVICE` | Prevents the OS from terminating the monitoring service under memory pressure. |
| `android.permission.POST_NOTIFICATIONS` | Displays a persistent status notification to ensure total transparency. |

---

## 📁 Project Directory Structure

```
client/child_monitoring_app/
├── app/
│   ├── build.gradle.kts           # Dependencies, Compose, Hilt, and Android SDK configuration
│   ├── proguard-rules.pro         # Proguard / R8 optimization rules
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml # Service declarations, activities, and permissions
│           ├── java/sa/safekids/guard/
│           │   ├── SafeKidsGuardApp.kt  # Application entrypoint & Hilt container setup
│           │   ├── data/
│           │   │   └── SessionManager.kt # EncryptedSharedPreferences credentials store
│           │   ├── network/
│           │   │   ├── ApiClient.kt     # Retrofit client with sanitized headers
│           │   │   └── ApiService.kt    # Endpoint contracts and data models
│           │   ├── receiver/
│           │   │   └── BootReceiver.kt  # System boot completion broadcast receiver
│           │   ├── service/
│           │   │   └── MonitoringAccessibilityService.kt # Real-time screen text listener
│           │   └── ui/
│           │       ├── MainActivity.kt  # Compose UI: 6-digit pairing & status monitor
│           │       └── theme/           # Color palette and typography definitions
│           └── res/
│               ├── values/              # Strings, colors, styles
│               └── xml/                 # Accessibility service capabilities descriptor
├── gradle/
│   └── libs.versions.toml         # Gradle version catalog
├── build.gradle.kts               # Root project build script
├── gradle.properties              # JVM and build performance settings
└── settings.gradle.kts            # Repository and module mappings
```

---

## 💻 Prerequisites & Development Environment

* **Android Studio:** **Ladybug (2024.2+)**, **Meerkat**, or newer.
* **JDK:** **Java 17 (LTS)**.
* **Android SDK:**
  * **Compile SDK:** 35 (Android 15)
  * **Target SDK:** 35
  * **Min SDK:** 26 (Android 8.0 Oreo+ — covering >95% of active devices).

---

## ⚙️ Backend API Configuration

Set the backend server URL in the application's network configuration:

### 1. Android Emulator (Local Host)
The Android Emulator maps the host machine's `localhost` to `10.0.2.2`:
```kotlin
const val BASE_URL = "http://10.0.2.2:8000/"
```

### 2. Physical Android Device (Local Wi-Fi Network)
Use the local IP address of your host machine running the FastAPI server:
```kotlin
const val BASE_URL = "http://192.168.1.50:8000/"
```

### 3. Production Deployment (Cloud Run / VPS)
```kotlin
const val BASE_URL = "https://api.safekidsguard.uj.edu.sa/"
```

---

## 🔨 Build & Installation

### Using Gradle Wrapper:
```bash
# Navigate to Android project directory
cd client/child_monitoring_app

# Build debug APK:
./gradlew assembleDebug

# Install on connected device or running emulator:
./gradlew installDebug
```

### Live Logcat Monitoring:
Filter logs to observe real-time classification events:
```bash
adb logcat -s SafeKidsGuard_Monitor
```

---

## 📡 Network API Integration

The Android client integrates with the following FastAPI endpoints (defined in `ApiService.kt`):

| Method | Endpoint | Application Role |
|---|---|---|
| `POST` | `/auth/pair-device` | Pairs device using parent-generated 6-digit PIN and retrieves child JWT. |
| `POST` | `/auth/unpair-device` | Verifies parent password before permitting device unpairing. |
| `POST` | `/classification/predict` | Sends on-screen text snippets for real-time AI classification and policy enforcement. |
| `POST` | `/alerts/request-access` | Submits child access appeal when content or app is blocked by mistake (`UC-C5`). |
| `GET` | `/policies/{child_id}` | Synchronizes active safety policy (app/URL blacklist, screen-time, bedtimes). |
| `POST` | `/activity` | Logs daily usage events for parent review on the dashboard. |

---
