package sa.safekids.guard.service

import android.accessibilityservice.AccessibilityService
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
import kotlinx.coroutines.launch
import sa.safekids.guard.data.SessionManager
import sa.safekids.guard.network.ApiClient
import sa.safekids.guard.network.ClassificationRequest
import java.io.IOException

/**
 * MonitoringAccessibilityService silently inspects on-screen Arabic text in real time.
 * Complies with the 2-second debouncing rule, filters sensitive inputs, and enforces
 * protective interventions when harmful content (Cyberbullying, Sexual, Violence, Hate Speech) is flagged.
 */
class MonitoringAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SafeKidsGuard_Monitor"
        private const val DEBOUNCE_DELAY_MS = 2000L // 2-second debouncing window

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
    private var lastInspectedTextHash: Int = 0
    private var lastInspectionTime: Long = 0L

    private lateinit var sessionManager: SessionManager
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager.getInstance(this)
        Log.i(TAG, "MonitoringAccessibilityService initialized. Server URL: ${sessionManager.baseUrl}")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: ""
        if (IGNORED_PACKAGES.contains(packageName)) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val rootNode = rootInActiveWindow ?: return
                scheduleDebouncedInspection(rootNode, packageName)
            }
        }
    }

    /**
     * Traverses visible nodes, collects non-sensitive text, and schedules
     * inspection with a 2-second debounce timer.
     */
    private fun scheduleDebouncedInspection(rootNode: AccessibilityNodeInfo, packageName: String) {
        val stringBuilder = StringBuilder()
        extractVisibleText(rootNode, stringBuilder)

        val combinedText = stringBuilder.toString().trim()
        if (combinedText.length < 4) return

        val textHash = combinedText.hashCode()
        val now = SystemClock.elapsedRealtime()

        // Skip if exact same screen content was inspected within the last 10 seconds
        if (textHash == lastInspectedTextHash && (now - lastInspectionTime) < 10000L) {
            return
        }

        // Cancel previous pending debounce job and queue a new 2000ms timer
        debounceJob?.cancel()
        debounceJob = serviceScope.launch {
            try {
                delay(DEBOUNCE_DELAY_MS)

                lastInspectedTextHash = textHash
                lastInspectionTime = SystemClock.elapsedRealtime()

                Log.d(TAG, "[$packageName] Inspecting text snippet (${combinedText.length} chars): ${combinedText.take(40)}...")
                classifyAndEnforce(combinedText, packageName)
            } catch (e: CancellationException) {
                // Expected when new text arrives before 2000ms delay finishes
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error in debounced inspection: ${e.message}", e)
            }
        }
    }

    /**
     * Recursively extracts visible text while skipping password/PIN fields for child privacy.
     */
    private fun extractVisibleText(node: AccessibilityNodeInfo, out: StringBuilder) {
        // Strict privacy rule: Skip all password and sensitive text fields
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
        val childId = sessionManager.childId.ifEmpty { "00000000-0000-0000-0000-000000000001" }
        val token = sessionManager.accessToken

        val apiService = ApiClient.getApiService(this)
        val request = ClassificationRequest(
            text = text,
            child_id = childId,
            context_app = packageName
        )

        try {
            val authHeader = if (token.isNotBlank()) "Bearer $token" else "Bearer default_token"
            val response = apiService.classifyText(authHeader, request)

            if (response.isSuccessful) {
                val result = response.body()
                if (result != null) {
                    Log.i(
                        TAG,
                        "Classification result: verdict=${result.verdict}, category=${result.category}, confidence=${result.confidence}, blocked=${result.is_blocked}"
                    )

                    if (result.is_blocked) {
                        handleHarmfulContentDetected(result.category, packageName)
                    }
                }
            } else {
                Log.w(TAG, "Classification API returned code: ${response.code()} ${response.message()}")
            }
        } catch (e: IOException) {
            // Server might be offline or device has no network — log and continue silently
            Log.w(TAG, "Classification API network error: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to classify text: ${e.message}", e)
        }
    }

    /**
     * Protective intervention when harmful text is detected:
     * Exits the current app and alerts the child interface.
     */
    private fun handleHarmfulContentDetected(category: String, packageName: String) {
        Log.w(TAG, "⚠️ BLOCKED harmful content ($category) in $packageName. Intervening now!")

        // 1. Immediately dismiss harmful content by performing HOME navigation
        performGlobalAction(GLOBAL_ACTION_HOME)

        // 2. Display localized warning toast
        mainHandler.post {
            val warningMsg = when (category) {
                "CYBERBULLYING" -> "⚠️ تم إيقاف المحتوى لحمايتك من التنمر والإساءة"
                "SEXUAL" -> "⚠️ تم إيقاف المحتوى غير اللائق لحمايتك"
                "VIOLENCE" -> "⚠️ تم إيقاف المحتوى لحمايتك من مشاهد العنف والتهديد"
                "HATE_SPEECH" -> "⚠️ تم إيقاف المحتوى لاحتوائه على خطاب كراهية"
                else -> "⚠️ تم إيقاف المحتوى المشبوه بواسطة حارس الأطفال الآمن"
            }
            Toast.makeText(applicationContext, warningMsg, Toast.LENGTH_LONG).show()
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Safe Kids Guard Accessibility Service connected and active.")
    }

    override fun onDestroy() {
        super.onDestroy()
        debounceJob?.cancel()
        serviceScope.cancel()
        Log.i(TAG, "Safe Kids Guard Accessibility Service destroyed.")
    }
}
