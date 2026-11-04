package sa.safekids.guard.service

import android.accessibilityservice.AccessibilityService
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
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
import sa.safekids.guard.network.ActivityEventDto
import sa.safekids.guard.network.ApiClient
import sa.safekids.guard.network.ClassificationRequest
import sa.safekids.guard.ui.MainActivity
import java.io.IOException
import java.util.Calendar
import java.util.concurrent.ConcurrentHashMap

/**
 * MonitoringAccessibilityService silently inspects on-screen Arabic text in real time,
 * periodically syncs parental policies, and enforces blocked apps, blacklisted URLs,
 * daily screen-time limits, and bedtime windows even when offline.
 */
class MonitoringAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SafeKidsGuard_Monitor"
        private const val DEBOUNCE_DELAY_MS = 1500L // 1.5-second debouncing window
        private const val POLICY_SYNC_INTERVAL_MS = 300_000L // 5 minutes
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
    private var serviceStartElapsedMs: Long = SystemClock.elapsedRealtime()
    private val localViolationTimestamps = ConcurrentHashMap<String, Long>()

    private lateinit var sessionManager: SessionManager
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager.getInstance(this)
        serviceStartElapsedMs = SystemClock.elapsedRealtime()
        Log.i(TAG, "MonitoringAccessibilityService initialized.")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Safe Kids Guard Accessibility Service connected and active.")
        startPeriodicPolicySync()
    }

    private fun startPeriodicPolicySync() {
        policySyncJob?.cancel()
        policySyncJob = serviceScope.launch {
            while (isActive) {
                syncPolicyFromServer()
                delay(POLICY_SYNC_INTERVAL_MS)
            }
        }
    }

    private suspend fun syncPolicyFromServer() {
        if (!sessionManager.isPaired || sessionManager.childId.isBlank() || sessionManager.accessToken.isBlank()) {
            return
        }
        try {
            val apiService = ApiClient.getApiService(this)
            val resp = apiService.getPolicy("Bearer ${sessionManager.accessToken}", sessionManager.childId)
            if (resp.isSuccessful) {
                resp.body()?.let { policy ->
                    sessionManager.cachePolicy(policy)
                    Log.i(TAG, "Synchronized child policy from server.")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Policy sync skipped (offline): ${e.message}")
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (!sessionManager.isPaired || sessionManager.childId.isBlank()) return

        val packageName = event.packageName?.toString() ?: ""
        if (IGNORED_PACKAGES.contains(packageName)) return

        // Immediate local policy checks on window/app changes (<50ms response)
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (sessionManager.blockedApps.contains(packageName)) {
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

                lastInspectedTextHash = textHash
                lastInspectionTime = SystemClock.elapsedRealtime()

                // Privacy: never log raw child screen text to logcat (VULN-04 remediation)
                Log.d(TAG, "[$packageName] Inspecting text payload (${combinedText.length} chars)")
                classifyAndEnforce(combinedText, packageName)
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

        serviceScope.launch {
            try {
                val apiService = ApiClient.getApiService(this@MonitoringAccessibilityService)
                apiService.logActivity(
                    token = "Bearer ${sessionManager.accessToken}",
                    event = ActivityEventDto(
                        child_id = childId,
                        app_name = packageName,
                        url = url,
                        content_snippet = snippet.take(200),
                        category = category,
                        confidence = 1.0,
                        verdict = "BLOCKED"
                    )
                )
            } catch (e: Exception) {
                Log.w(TAG, "Deferred local violation log ($category): ${e.message}")
            }
        }
    }

    /**
     * Sends the text to FastAPI /classification/predict and enforces protective action if blocked.
     */
    private suspend fun classifyAndEnforce(text: String, packageName: String) {
        val childId = sessionManager.childId
        val token = sessionManager.accessToken
        if (childId.isBlank() || token.isBlank()) return

        val apiService = ApiClient.getApiService(this)
        val request = ClassificationRequest(
            text = text,
            child_id = childId,
            context_app = packageName
        )

        try {
            val authHeader = "Bearer $token"
            val response = apiService.classifyText(authHeader, request)

            if (response.isSuccessful) {
                val result = response.body()
                if (result != null && result.is_blocked) {
                    handleHarmfulContentDetected(
                        category = result.category,
                        packageName = packageName,
                        reason = result.block_reason,
                        alertId = result.alert_id
                    )
                }
            } else {
                Log.w(TAG, "Classification API returned code: ${response.code()}")
            }
        } catch (e: IOException) {
            Log.w(TAG, "Classification API offline: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to classify text: ${e.message}")
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
        debounceJob?.cancel()
        policySyncJob?.cancel()
        serviceScope.cancel()
        Log.i(TAG, "Safe Kids Guard Accessibility Service destroyed.")
    }
}
