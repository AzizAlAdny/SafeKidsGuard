# Safe Kids Guard — Android App Rules (Kotlin + Jetpack Compose)

## Stack
- **Kotlin** — modern idiomatic Kotlin (coroutines, Flow, extension functions)
- **Jetpack Compose** — declarative UI (use `@Composable` for all UI)
- **Hilt** — dependency injection (`@HiltAndroidApp`, `@AndroidEntryPoint`, `@HiltViewModel`)
- **Room** — local SQLite database for policy caching
- **Retrofit + OkHttp** — REST API client
- **WorkManager** — reliable background task scheduling
- **Firebase Messaging (FCM)** — push notification reception
- **Coroutines + Flow** — async programming (never use `Thread` or `AsyncTask`)

---

## Critical Android Services

### VpnService
The `VpnService` creates a **local TUN interface** — no external VPN server needed. All child device traffic is routed through this interface for content inspection.

```kotlin
// Pattern for VPN traffic interception
class VpnInterceptorService : VpnService() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val builder = Builder()
            .addAddress("10.0.0.2", 32)
            .addRoute("0.0.0.0", 0)
            .setSession("SafeKidsGuard VPN")
        val vpnInterface = builder.establish()
        // Start coroutine to read packets from vpnInterface
        // Extract URLs/text → send to FastAPI /api/v1/filter
        // Enforce verdict: drop packet if BLOCKED
    }
}
```

**Rules:**
- The VPN must start as a **foreground service** with a persistent notification (Android requirement)
- Packet parsing must handle HTTP and HTTPS separately (HTTPS: SNI inspection for domain blocking; content inspection for HTTP)
- Use coroutines with `Dispatchers.IO` for all network I/O inside the VPN loop
- Never block the main VPN read loop — offload classification to a separate coroutine

### AccessibilityService
Monitors app window changes and on-screen text for in-app content monitoring.

```kotlin
class AccessibilityMonitorService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            val text = event.source?.text?.toString() ?: return
            // Send to classification if text is Arabic and non-empty
        }
    }
}
```

**Rules:**
- Only request `BIND_ACCESSIBILITY_SERVICE` permission — request only what is needed
- Throttle classification calls: max 1 request per 2 seconds per screen update (debounce)
- Accessibility service must handle `onInterrupt()` gracefully (no crash)

---

## Architecture (MVVM + Clean Architecture)

```
com.safekidsguard/
├── di/                    ← Hilt modules
├── data/
│   ├── local/
│   │   ├── PolicyDatabase.kt  ← Room database
│   │   ├── PolicyDao.kt
│   │   └── PolicyEntity.kt
│   ├── remote/
│   │   ├── ApiService.kt      ← Retrofit interface
│   │   └── dto/               ← Request/Response data classes
│   └── repository/
│       ├── PolicyRepository.kt
│       └── ActivityRepository.kt
├── domain/
│   ├── model/                 ← Domain models (pure Kotlin, no Android deps)
│   ├── usecase/               ← Use cases (one action per class)
│   └── repository/            ← Repository interfaces
├── ui/
│   ├── login/
│   │   ├── LoginScreen.kt     ← @Composable
│   │   └── LoginViewModel.kt  ← @HiltViewModel
│   └── status/
│       ├── StatusScreen.kt
│       └── StatusViewModel.kt
└── services/
    ├── VpnInterceptorService.kt
    ├── AccessibilityMonitorService.kt
    ├── BackgroundSyncWorker.kt
    └── FcmMessagingService.kt
```

**Rules:**
- `ViewModel` must expose state via `StateFlow<UiState>` — never `LiveData`
- `ViewModel` calls use cases; use cases call repositories; repositories call data sources
- UI layer only calls `ViewModel` — never directly accesses repositories or data sources
- All `@Composable` functions must be side-effect free (no direct API calls)

---

## Background Processing Rules

- Use **WorkManager** for periodic policy sync (every 15 minutes minimum — Android battery restriction)
- Use **foreground Service** for continuous VPN operation (Android kills background services)
- VPN and Accessibility services must restart if killed: implement `START_STICKY` and re-registration in `onTaskRemoved`
- Policy sync must be idempotent (safe to repeat without side effects)

```kotlin
// WorkManager sync pattern
class BackgroundSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            policyRepository.syncFromServer()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

---

## Local Data (Room) Rules

- Cache parent policies locally in Room — child app must enforce policies **even when offline**
- Policy data structure mirrors the server `policies` table
- Cache TTL: policies expire after 1 hour; re-sync on next background job
- Activity events are queued locally if the API is unreachable, then synced when connectivity returns (Room queue + WorkManager upload job)

---

## Kotlin Style Rules

- Use `data class` for all DTOs and domain models
- Use `sealed class` for UI state: `sealed class UiState { object Loading; data class Success(val data: T); data class Error(val msg: String) }`
- Use `object` for singletons declared in Hilt modules
- Coroutine scope: use `viewModelScope` in ViewModels, `lifecycleScope` in Services
- Handle all exceptions explicitly — never use bare `catch (e: Exception) { /* ignore */ }`
- Use `Result<T>` or a custom `Resource<T>` wrapper for repository return types

---

## Security Rules

- Store the JWT token in **EncryptedSharedPreferences** (Android Keystore-backed) — never in plain SharedPreferences
- Never log the JWT token or user credentials
- The child app UI must not expose parental control settings to the child user
- The VPN local interface must not route traffic to external servers — all classification traffic stays within the device→FastAPI channel (HTTPS only)
- Certificate pinning: pin the FastAPI server's TLS certificate in OkHttp

---

## Permissions Required

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Request only these permissions. Request `POST_NOTIFICATIONS` at runtime (Android 13+).

---

## Build Rules

- `minSdkVersion 26` (Android 8.0) — covers 95%+ of active devices
- `targetSdkVersion 35` (Android 15)
- Use `build.gradle.kts` (not Groovy)
- All dependencies declared with version catalogs (`libs.versions.toml`)
- ProGuard/R8 enabled for release builds
- Run `./gradlew test` and `./gradlew lint` in CI before every merge
