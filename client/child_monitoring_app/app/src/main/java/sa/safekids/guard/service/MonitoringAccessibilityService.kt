package sa.safekids.guard.service

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import sa.safekids.guard.data.SessionManager
import sa.safekids.guard.network.ActivityBatchRequestDto
import sa.safekids.guard.network.ActivityEventDto
import sa.safekids.guard.network.ApiClient
import sa.safekids.guard.network.ApiService
import sa.safekids.guard.network.ClassificationRequest
import sa.safekids.guard.ui.MainActivity
import java.io.IOException
import java.util.Calendar
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * MonitoringAccessibilityService silently inspects on-screen Arabic text in real time,
 * periodically syncs parental policies with adaptive backoff and instant network recovery,
 * queues offline local violations, and enforces blocked apps, blacklisted URLs,
 * daily screen-time limits, and bedtime windows even when offline.
 */
class MonitoringAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SafeKidsGuard_Monitor"
        private const val DEBOUNCE_DELAY_MS = 1500L // 1.5-second debouncing window
        private const val POLICY_SYNC_INTERVAL_MS = 10_000L // 10-second live policy sync when online
        private const val MAX_OFFLINE_BACKOFF_MS = 60_000L // Max 60s backoff when server is shut down
        private const val WATCHDOG_RECONNECT_COOLDOWN_MS = 10_000L // Min interval for event-triggered reconnect
        private const val LOCAL_LOG_COOLDOWN_MS = 15_000L // 15-second cooldown for local block activity logs

        // Packages to ignore to prevent loops and unnecessary processing (Launchers, System UI, Keyboards, Settings)
        private val IGNORED_PACKAGES = setOf(
            "sa.safekids.guard",
            "sa.safekids.guard.debug",
            "com.android.systemui",
            "com.android.settings",
            "com.sec.android.app.launcher",
            "com.google.android.apps.nexuslauncher",
            "com.android.launcher",
            "com.android.launcher3",
            "com.miui.home",
            "com.huawei.android.launcher",
            "com.google.android.permissioncontroller",
            "com.android.permissioncontroller",
            "com.android.packageinstaller",
            "com.google.android.inputmethod.latin",
            "com.samsung.android.honeyboard",
            "com.sec.android.inputmethod"
        )
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var debounceJob: Job? = null
    private var policySyncJob: Job? = null
    private var lastInspectedTextHash: Int = 0
    private var lastInspectionTime: Long = 0L
    private var lastSyncAttemptElapsedMs: Long = 0L
    private var consecutiveSyncFailures: Int = 0
    private val isSyncInProgress = AtomicBoolean(false)
    private var serviceStartElapsedMs: Long = SystemClock.elapsedRealtime()
    private val localViolationTimestamps = ConcurrentHashMap<String, Long>()

    private lateinit var sessionManager: SessionManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallbackRegistered = false
    private var receiverRegistered = false

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            Log.i(TAG, "Network available — triggering immediate server reconnect.")
            triggerImmediateReconnect()
        }

        override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
            if (networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                !sessionManager.isServerReachable
            ) {
                triggerImmediateReconnect()
            }
        }
    }

    private val reconnectReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == SessionManager.ACTION_FORCE_RECONNECT) {
                Log.i(TAG, "Received force reconnect broadcast — syncing now.")
                consecutiveSyncFailures = 0
                lastInspectedTextHash = 0
                triggerImmediateReconnect()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager.getInstance(this)
        serviceStartElapsedMs = SystemClock.elapsedRealtime()
        Log.i(TAG, "MonitoringAccessibilityService initialized.")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Safe Kids Guard Accessibility Service connected and active.")
        registerConnectivityWatchers()
        startPeriodicPolicySync()
    }

    private fun registerConnectivityWatchers() {
        if (!networkCallbackRegistered) {
            try {
                connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                val request = NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()
                connectivityManager?.registerNetworkCallback(request, networkCallback)
                networkCallbackRegistered = true
            } catch (e: Exception) {
                Log.w(TAG, "Could not register NetworkCallback: ${e.message}")
            }
        }

        if (!receiverRegistered) {
            try {
                val filter = IntentFilter(SessionManager.ACTION_FORCE_RECONNECT)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    registerReceiver(reconnectReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
                } else {
                    @Suppress("UnspecifiedRegisterReceiverFlag")
                    registerReceiver(reconnectReceiver, filter)
                }
                receiverRegistered = true
            } catch (e: Exception) {
                Log.w(TAG, "Could not register reconnect receiver: ${e.message}")
            }
        }
    }

    private fun unregisterConnectivityWatchers() {
        if (networkCallbackRegistered) {
            try {
                connectivityManager?.unregisterNetworkCallback(networkCallback)
            } catch (_: Exception) {
            }
            networkCallbackRegistered = false
        }
        if (receiverRegistered) {
            try {
                unregisterReceiver(reconnectReceiver)
            } catch (_: Exception) {
            }
            receiverRegistered = false
        }
    }

    private fun startPeriodicPolicySync() {
        if (policySyncJob?.isActive == true) return
        policySyncJob = serviceScope.launch {
            while (isActive) {
                syncPolicyFromServer()
                val nextDelayMs = if (consecutiveSyncFailures == 0) {
                    POLICY_SYNC_INTERVAL_MS
                } else {
                    val backoff = 15_000L * (1L shl (consecutiveSyncFailures - 1).coerceAtMost(2))
                    backoff.coerceAtMost(MAX_OFFLINE_BACKOFF_MS)
                }
                delay(nextDelayMs)
            }
        }
    }

    private fun triggerImmediateReconnect() {
        if (policySyncJob?.isActive != true) {
            startPeriodicPolicySync()
            return
        }
        serviceScope.launch {
            syncPolicyFromServer()
        }
    }

    private suspend fun syncPolicyFromServer() {
        if (!sessionManager.isPaired || sessionManager.childId.isBlank() || sessionManager.accessToken.isBlank()) {
            return
        }
        if (!isSyncInProgress.compareAndSet(false, true)) {
            return
        }
        lastSyncAttemptElapsedMs = SystemClock.elapsedRealtime()
        try {
            val apiService = ApiClient.getApiService(this)
            var resp = apiService.getPolicy("Bearer ${sessionManager.accessToken}", sessionManager.childId)

            // Self-heal if access token expired overnight and OkHttp Authenticator missed rotation during server boot
            if (resp.code() == 401 && sessionManager.refreshToken.isNotBlank()) {
                val refreshed = ApiClient.refreshTokenSynchronously(sessionManager, sessionManager.baseUrl)
                if (refreshed) {
                    resp = apiService.getPolicy("Bearer ${sessionManager.accessToken}", sessionManager.childId)
                }
            }

            if (resp.isSuccessful) {
                resp.body()?.let { policy ->
                    val wasOffline = !sessionManager.isServerReachable || consecutiveSyncFailures > 0
                    consecutiveSyncFailures = 0
                    sessionManager.cachePolicy(policy)
                    if (wasOffline) {
                        lastInspectedTextHash = 0
                        Log.i(TAG, "Reconnected to FastAPI server and synchronized child policy.")
                    } else {
                        Log.d(TAG, "Synchronized child policy from server.")
                    }
                    flushOfflineActivityQueue(apiService)
                    mainHandler.post {
                        enforceCurrentForegroundWindow()
                    }
                }
            } else if (resp.code() == 401 || resp.code() == 403) {
                consecutiveSyncFailures++
                sessionManager.isServerReachable = true
                sessionManager.isAuthExpired = true
                Log.w(TAG, "Policy sync unauthorized (${resp.code()}) — session requires re-pairing or refresh.")
            } else {
                consecutiveSyncFailures++
                sessionManager.isServerReachable = false
            }
        } catch (e: Exception) {
            consecutiveSyncFailures++
            sessionManager.isServerReachable = false
            Log.w(TAG, "Policy sync skipped (offline, attempt #$consecutiveSyncFailures): ${e.message}")
        } finally {
            isSyncInProgress.set(false)
        }
    }

    private suspend fun flushOfflineActivityQueue(apiService: ApiService) {
        if (sessionManager.getOfflineActivityCount() == 0) return
        val queuedEvents = sessionManager.drainOfflineActivities()
        if (queuedEvents.isEmpty()) return

        try {
            val resp = apiService.logActivityBatch(
                token = "Bearer ${sessionManager.accessToken}",
                batch = ActivityBatchRequestDto(events = queuedEvents)
            )
            if (resp.isSuccessful) {
                Log.i(TAG, "Flushed ${queuedEvents.size} offline activity event(s) to server.")
            } else {
                queuedEvents.forEach { sessionManager.enqueueOfflineActivity(it) }
            }
        } catch (e: Exception) {
            queuedEvents.forEach { sessionManager.enqueueOfflineActivity(it) }
            Log.w(TAG, "Could not flush offline activity queue yet: ${e.message}")
        }
    }

    /**
     * Immediately checks the currently active foreground window after a policy sync
     * so newly blocked apps or blacklisted URLs are enforced even if the child is already inside them.
     */
    private fun enforceCurrentForegroundWindow() {
        val rootNode = rootInActiveWindow ?: return
        val pkg = rootNode.packageName?.toString() ?: return
        if (pkg.isBlank() || IGNORED_PACKAGES.contains(pkg)) return

        if (PolicyEvaluator.isAppBlocked(pkg, sessionManager.blockedApps)) {
            val reason = "هذا التطبيق محظور بواسطة إعدادات العائلة ($pkg)"
            logLocalViolationToServer("BLOCKED_APP", pkg, null, reason)
            handleHarmfulContentDetected("BLOCKED_APP", pkg, reason)
            return
        }

        val sb = StringBuilder()
        extractVisibleText(rootNode, sb)
        val combinedText = PolicyEvaluator.boundTextPayload(sb.toString())
        val matchedDomain = PolicyEvaluator.findMatchingBlacklistedDomain(
            text = combinedText,
            blacklistedUrls = sessionManager.blacklistedUrls
        )
        if (matchedDomain != null) {
            val reason = "الرابط محظور بواسطة إعدادات الحماية: $matchedDomain"
            logLocalViolationToServer("BLACKLISTED_URL", pkg, matchedDomain, reason)
            handleHarmfulContentDetected("BLACKLISTED_URL", pkg, reason)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (!sessionManager.isPaired || sessionManager.childId.isBlank()) return

        // Watchdog: if the background sync job was suspended by Doze or server was offline > 10s, reconnect on user activity
        val nowElapsed = SystemClock.elapsedRealtime()
        if (policySyncJob?.isActive != true ||
            (!sessionManager.isServerReachable && (nowElapsed - lastSyncAttemptElapsedMs) > WATCHDOG_RECONNECT_COOLDOWN_MS)
        ) {
            triggerImmediateReconnect()
        }

        val packageName = event.packageName?.toString() ?: ""
        if (packageName.isBlank() || IGNORED_PACKAGES.contains(packageName)) return

        // Immediate local blocked-app check on ANY event in the foreground app (<50ms response)
        if (PolicyEvaluator.isAppBlocked(packageName, sessionManager.blockedApps)) {
            val reason = "هذا التطبيق محظور بواسطة إعدادات العائلة ($packageName)"
            logLocalViolationToServer(
                category = "BLOCKED_APP",
                packageName = packageName,
                url = null,
                snippet = reason
            )
            handleHarmfulContentDetected(
                category = "BLOCKED_APP",
                packageName = packageName,
                reason = reason
            )
            return
        }

        // Bedtime and screen-time checks on window state changes
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (isCurrentlyInBedtimeWindow()) {
                val reason = "وقت النوم نشط الآن (${sessionManager.bedtimeStart} - ${sessionManager.bedtimeEnd})"
                logLocalViolationToServer(
                    category = "BEDTIME",
                    packageName = packageName,
                    url = null,
                    snippet = reason
                )
                handleHarmfulContentDetected(
                    category = "BEDTIME",
                    packageName = packageName,
                    reason = reason
                )
                return
            }

            if (isDailyScreenTimeExceeded()) {
                val reason = "انتهى الحد اليومي المسموح لاستخدام الشاشة (${sessionManager.screenTimeDailyLimitMins} دقيقة)"
                logLocalViolationToServer(
                    category = "SCREEN_TIME",
                    packageName = packageName,
                    url = null,
                    snippet = reason
                )
                handleHarmfulContentDetected(
                    category = "SCREEN_TIME",
                    packageName = packageName,
                    reason = reason
                )
                return
            }
        }

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val rootNode = rootInActiveWindow ?: return
                scheduleDebouncedInspection(rootNode, packageName)
            }
        }
    }

    private fun isCurrentlyInBedtimeWindow(): Boolean {
        val cal = Calendar.getInstance()
        return PolicyEvaluator.isInBedtimeWindow(
            start = sessionManager.bedtimeStart,
            end = sessionManager.bedtimeEnd,
            currentHour = cal.get(Calendar.HOUR_OF_DAY),
            currentMinute = cal.get(Calendar.MINUTE)
        )
    }

    private fun isDailyScreenTimeExceeded(): Boolean {
        val limitMins = sessionManager.screenTimeDailyLimitMins
        // 0 or >= 1440 means unlimited daily screen time
        if (limitMins <= 0 || limitMins >= 1440) return false

        // Track elapsed time since service started / device was paired in this session
        val activeSessionMins = ((SystemClock.elapsedRealtime() - serviceStartElapsedMs) / 60_000L).toInt()
        return activeSessionMins >= limitMins
    }

    /**
     * Traverses visible nodes, collects non-sensitive text (bounded to MAX_TEXT_LENGTH),
     * and schedules inspection with a 1.5-second debounce timer.
     */
    private fun scheduleDebouncedInspection(rootNode: AccessibilityNodeInfo, packageName: String) {
        val stringBuilder = StringBuilder()
        extractVisibleText(rootNode, stringBuilder)

        val combinedText = PolicyEvaluator.boundTextPayload(stringBuilder.toString())
        if (combinedText.length < 4) return

        // Immediate local blacklisted URL check
        val matchedDomain = PolicyEvaluator.findMatchingBlacklistedDomain(
            text = combinedText,
            blacklistedUrls = sessionManager.blacklistedUrls
        )
        if (matchedDomain != null) {
            val reason = "الرابط محظور بواسطة إعدادات الحماية: $matchedDomain"
            logLocalViolationToServer(
                category = "BLACKLISTED_URL",
                packageName = packageName,
                url = matchedDomain,
                snippet = reason
            )
            handleHarmfulContentDetected(
                category = "BLACKLISTED_URL",
                packageName = packageName,
                reason = reason
            )
            return
        }

        val textHash = combinedText.hashCode()
        val now = SystemClock.elapsedRealtime()

        // Skip if exact same screen content was inspected within the last 10 seconds
        if (textHash == lastInspectedTextHash && (now - lastInspectionTime) < 10000L) {
            return
        }

        debounceJob?.cancel()
        debounceJob = serviceScope.launch {
            try {
                delay(DEBOUNCE_DELAY_MS)

                // Privacy: never log raw child screen text to logcat (VULN-04 remediation)
                Log.d(TAG, "[$packageName] Inspecting text payload (${combinedText.length} chars)")
                val completedOnline = classifyAndEnforce(combinedText, packageName)
                if (completedOnline) {
                    lastInspectedTextHash = textHash
                    lastInspectionTime = SystemClock.elapsedRealtime()
                }
            } catch (_: CancellationException) {
                // Expected when new text arrives before debounce finishes
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error in debounced inspection: ${e.message}")
            }
        }
    }

    /**
     * Recursively extracts visible text while skipping password/PIN fields for child privacy.
     * Stops once PolicyEvaluator.MAX_TEXT_LENGTH is reached to avoid excessive traversal and HTTP 422.
     */
    private fun extractVisibleText(node: AccessibilityNodeInfo, out: StringBuilder) {
        if (out.length >= PolicyEvaluator.MAX_TEXT_LENGTH) return
        if (node.isPassword) return

        val nodeText = node.text?.toString()?.trim()
        if (!nodeText.isNullOrEmpty()) {
            out.append(nodeText).append(" ")
        }

        val contentDesc = node.contentDescription?.toString()?.trim()
        if (!contentDesc.isNullOrEmpty() && contentDesc != nodeText) {
            out.append(contentDesc).append(" ")
        }

        if (out.length >= PolicyEvaluator.MAX_TEXT_LENGTH) return

        for (i in 0 until node.childCount) {
            if (out.length >= PolicyEvaluator.MAX_TEXT_LENGTH) break
            val child = node.getChild(i) ?: continue
            extractVisibleText(child, out)
            child.recycle()
        }
    }

    /**
     * Asynchronously records a local policy intervention (blocked app, URL, bedtime, screen time)
     * to the backend POST /activity endpoint so parents can view it on the dashboard (FR9, FR13).
     * If the server is offline, queues the violation locally to be flushed automatically on reconnect.
     */
    private fun logLocalViolationToServer(
        category: String,
        packageName: String,
        url: String?,
        snippet: String
    ) {
        val childId = sessionManager.childId
        val token = sessionManager.accessToken
        if (childId.isBlank() || token.isBlank()) return

        val dedupKey = "$category:$packageName:${url ?: ""}"
        val now = SystemClock.elapsedRealtime()
        val lastLogged = localViolationTimestamps[dedupKey] ?: 0L
        if (now - lastLogged < LOCAL_LOG_COOLDOWN_MS) return
        localViolationTimestamps[dedupKey] = now

        val eventDto = ActivityEventDto(
            child_id = childId,
            app_name = packageName,
            url = url,
            content_snippet = snippet.take(200),
            category = category,
            confidence = 1.0,
            verdict = "BLOCKED"
        )

        serviceScope.launch {
            try {
                val apiService = ApiClient.getApiService(this@MonitoringAccessibilityService)
                val resp = apiService.logActivity(
                    token = "Bearer ${sessionManager.accessToken}",
                    event = eventDto
                )
                if (resp.isSuccessful) {
                    sessionManager.markSyncSuccess()
                } else {
                    sessionManager.enqueueOfflineActivity(eventDto)
                }
            } catch (e: Exception) {
                sessionManager.isServerReachable = false
                sessionManager.enqueueOfflineActivity(eventDto)
                Log.w(TAG, "Queued offline local violation ($category) for later sync: ${e.message}")
            }
        }
    }

    /**
     * Sends the text to FastAPI /classification/predict and enforces protective action if blocked.
     * Returns true if the server responded, or false if the server was unreachable.
     */
    private suspend fun classifyAndEnforce(text: String, packageName: String): Boolean {
        val childId = sessionManager.childId
        val token = sessionManager.accessToken
        if (childId.isBlank() || token.isBlank()) return false

        val apiService = ApiClient.getApiService(this)
        val request = ClassificationRequest(
            text = text,
            child_id = childId,
            context_app = packageName
        )

        return try {
            val authHeader = "Bearer $token"
            var response = apiService.classifyText(authHeader, request)

            if (response.code() == 401 && sessionManager.refreshToken.isNotBlank()) {
                val refreshed = ApiClient.refreshTokenSynchronously(sessionManager, sessionManager.baseUrl)
                if (refreshed) {
                    response = apiService.classifyText("Bearer ${sessionManager.accessToken}", request)
                }
            }

            if (response.isSuccessful) {
                val wasOffline = !sessionManager.isServerReachable
                consecutiveSyncFailures = 0
                sessionManager.markSyncSuccess()
                if (wasOffline) {
                    flushOfflineActivityQueue(apiService)
                }

                val result = response.body()
                if (result != null && result.is_blocked) {
                    handleHarmfulContentDetected(
                        category = result.category,
                        packageName = packageName,
                        reason = result.block_reason,
                        alertId = result.alert_id
                    )
                }
                true
            } else {
                Log.w(TAG, "Classification API returned code: ${response.code()}")
                if (response.code() == 401 || response.code() == 403) {
                    sessionManager.isAuthExpired = true
                }
                false
            }
        } catch (e: IOException) {
            sessionManager.isServerReachable = false
            Log.w(TAG, "Classification API offline: ${e.message}")
            false
        } catch (e: Exception) {
            Log.e(TAG, "Failed to classify text: ${e.message}")
            false
        }
    }

    /**
     * Protective intervention when harmful text or policy violation is detected:
     * Exits the current app and launches the Safe Kids Guard protective block screen.
     */
    private fun handleHarmfulContentDetected(
        category: String,
        packageName: String,
        reason: String? = null,
        alertId: String? = null
    ) {
        Log.w(TAG, "⚠️ BLOCKED ($category) in $packageName. Intervening now!")

        // 1. Immediately dismiss harmful content by performing HOME navigation
        performGlobalAction(GLOBAL_ACTION_HOME)

        // 2. Launch MainActivity with Block Overlay details & "Request Access" option (UC-C5)
        mainHandler.post {
            val warningMsg = when (category) {
                "CYBERBULLYING" -> "⚠️ تم إيقاف المحتوى لحمايتك من التنمر والإساءة"
                "SEXUAL" -> "⚠️ تم إيقاف المحتوى غير اللائق لحمايتك"
                "VIOLENCE" -> "⚠️ تم إيقاف المحتوى لحمايتك من مشاهد العنف والتهديد"
                "HATE_SPEECH" -> "⚠️ تم إيقاف المحتوى لاحتوائه على خطاب كراهية"
                "BLOCKED_APP" -> "⚠️ هذا التطبيق محظور بواسطة إعدادات العائلة"
                "BLACKLISTED_URL" -> "⚠️ هذا الموقع محظور لحمايتك"
                "BEDTIME" -> "🌙 حان وقت النوم المحدد من قِبل والديك"
                "SCREEN_TIME" -> "⏳ انتهى الوقت اليومي المسموح لاستخدام الجهاز"
                else -> "⚠️ تم إيقاف المحتوى المشبوه بواسطة حارس الأطفال الآمن"
            }
            Toast.makeText(applicationContext, warningMsg, Toast.LENGTH_LONG).show()

            val blockIntent = Intent(applicationContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("EXTRA_SHOW_BLOCK_SCREEN", true)
                putExtra("EXTRA_BLOCKED_CATEGORY", category)
                putExtra("EXTRA_BLOCKED_APP", packageName)
                putExtra("EXTRA_BLOCKED_REASON", reason ?: warningMsg)
                putExtra("EXTRA_ALERT_ID", alertId)
            }
            startActivity(blockIntent)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterConnectivityWatchers()
        debounceJob?.cancel()
        policySyncJob?.cancel()
        serviceScope.cancel()
        Log.i(TAG, "Safe Kids Guard Accessibility Service destroyed.")
    }
}
