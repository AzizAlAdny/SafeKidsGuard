package sa.safekids.guard.service

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class MonitoringAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "SafeKidsGuard_Monitor"
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                val rootNode = rootInActiveWindow ?: return
                extractAndInspectText(rootNode, event.packageName?.toString() ?: "")
            }
        }
    }

    private fun extractAndInspectText(node: AccessibilityNodeInfo, packageName: String) {
        // Skip passwords and sensitive input fields for child privacy
        if (node.isPassword) return

        val text = node.text?.toString()?.trim()
        if (!text.isNullOrEmpty() && text.length > 3) {
            // Log inspection event (in production, passed to Local Buffer / AI Classification API)
            Log.d(TAG, "[$packageName] Inspecting text snippet: ${text.take(30)}...")
        }

        // Recursively inspect child nodes
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            extractAndInspectText(child, packageName)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Safe Kids Guard Accessibility Monitoring Service Connected successfully.")
    }
}
