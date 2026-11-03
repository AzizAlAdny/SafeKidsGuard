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
import sa.safekids.guard.network.ApiClient
import sa.safekids.guard.network.ClassificationRequest
import sa.safekids.guard.ui.MainActivity
import java.io.IOException
import java.util.Calendar

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

        // Packages to ignore to prevent loops and unnecessary processing
        private val IGNORED_PACKAGES = setOf(
            "sa.safekids.guard",
            "sa.safekids.guard.debug",
            "com.android.systemui",
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

    private lateinit var sessionManager: SessionManager
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager.getInstance(this)
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
                handleHarmfulContentDetected(
                    category = "BLOCKED_APP",
                    packageName = packageName,
                    reason = "هذا التطبيق محظور بواسطة إعدادات العائلة ($packageName)"
                )
                return
            }

            if (isCurrentlyInBedtimeWindow()) {
                handleHarmfulContentDetected(
                    category = "BEDTIME",
                    packageName = packageName,
                    reason = "وقت النوم نشط الآن (${sessionManager.bedtimeStart} - ${sessionManager.bedtimeEnd})"
                )
                return
            }

            if (isDailyScreenTimeExceeded()) {
                handleHarmfulContentDetected(
                    category = "SCREEN_TIME",
                    packageName = packageName,
                    reason = "انتهى الحد اليومي المسموح لاستخدام الشاشة (${sessionManager.screenTimeDailyLimitMins} دقيقة)"
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
        val start = sessionManager.bedtimeStart
        val end = sessionManager.bedtimeEnd
        if (start.isBlank() || end.isBlank()) return false

        return try {
            val startParts = start.split(":")
            val endParts = end.split(":")
            val startMins = startParts[0].toInt() * 60 + startParts[1].toInt()
            val endMins = endParts[0].toInt() * 60 + endParts[1].toInt()

            val cal = Calendar.getInstance()
            val nowMins = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

            if (startMins <= endMins) {
                nowMins in startMins..endMins
            } else {
                // Cross-midnight window (e.g., 21:00 to 06:00)
                nowMins >= startMins || nowMins <= endMins
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun isDailyScreenTimeExceeded(): Boolean {
        val limitMins = sessionManager.screenTimeDailyLimitMins
        if (limitMins <= 0) return false
        return try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return false
            val cal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                cal.timeInMillis,
                System.currentTimeMillis()
            )
            val totalForegroundMs = stats?.sumOf { it.totalTimeInForeground } ?: 0L
            val usedMins = (totalForegroundMs / 60_000L).toInt()
            usedMins >= limitMins
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Traverses visible nodes, collects non-sensitive text, and schedules
     * inspection with a 1.5-second debounce timer.
     */
    private fun scheduleDebouncedInspection(rootNode: AccessibilityNodeInfo, packageName: String) {
        val stringBuilder = StringBuilder()
        extractVisibleText(rootNode, stringBuilder)

        val combinedText = stringBuilder.toString().trim()
        if (combinedText.length < 4) return

        // Immediate local blacklisted URL check
        val lowerText = combinedText.lowercase()
        for (domain in sessionManager.blacklistedUrls) {
            val cleanDomain = domain.trim().lowercase()
            if (cleanDomain.isNotEmpty() && lowerText.contains(cleanDomain)) {
                handleHarmfulContentDetected(
                    category = "BLACKLISTED_URL",
                    packageName = packageName,
                    reason = "الرابط محظور بواسطة إعدادات الحماية: $domain"
                )
                return
            }
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
     */
    private fun extractVisibleText(node: AccessibilityNodeInfo, out: StringBuilder) {
        if (node.isPassword) return

        val nodeText = node.text?.toString()?.trim()
        if (!nodeText.isNullOrEmpty()) {
            out.append(nodeText).append(" ")
        }

        val contentDesc = node.contentDescription?.toString()?.trim()
        if (!contentDesc.isNullOrEmpty() && contentDesc != nodeText) {
            out.append(contentDesc).append(" ")
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            extractVisibleText(child, out)
            child.recycle()
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
