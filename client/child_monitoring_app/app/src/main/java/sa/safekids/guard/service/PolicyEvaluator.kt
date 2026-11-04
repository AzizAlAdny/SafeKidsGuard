package sa.safekids.guard.service

/**
 * Pure policy evaluation utilities for local edge enforcement on the child device.
 * Kept free of Android framework dependencies for deterministic JVM unit testing.
 */
object PolicyEvaluator {

    /**
     * Maximum text payload length sent to FastAPI POST /classification/predict
     * (Backend schema enforces max_length = 5000).
     */
    const val MAX_TEXT_LENGTH = 4500

    /**
     * Trims and bounds extracted screen text so it never exceeds the backend's 5000-char limit.
     */
    fun boundTextPayload(rawText: String, maxLength: Int = MAX_TEXT_LENGTH): String {
        val trimmed = rawText.trim()
        return if (trimmed.length <= maxLength) trimmed else trimmed.substring(0, maxLength)
    }

    /**
     * Evaluates whether the given (currentHour, currentMinute) falls inside [start, end].
     * Supports both same-day ranges (e.g. "14:00" to "16:00") and cross-midnight ranges
     * (e.g. "21:00" to "06:00").
     */
    fun isInBedtimeWindow(
        start: String,
        end: String,
        currentHour: Int,
        currentMinute: Int
    ): Boolean {
        if (start.isBlank() || end.isBlank()) return false
        return try {
            val startParts = start.trim().split(":")
            val endParts = end.trim().split(":")
            if (startParts.size != 2 || endParts.size != 2) return false

            val startHour = startParts[0].toInt()
            val startMin = startParts[1].toInt()
            val endHour = endParts[0].toInt()
            val endMin = endParts[1].toInt()
            if (startHour !in 0..23 || endHour !in 0..23 || startMin !in 0..59 || endMin !in 0..59) {
                return false
            }

            val startMins = startHour * 60 + startMin
            val endMins = endHour * 60 + endMin
            val nowMins = currentHour * 60 + currentMinute

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

    /**
     * Checks whether the given screen text contains any blacklisted domain/URL.
     * Returns the matched domain entry if found, or null otherwise.
     */
    fun findMatchingBlacklistedDomain(text: String, blacklistedUrls: Set<String>): String? {
        if (text.isBlank() || blacklistedUrls.isEmpty()) return null
        val lowerText = text.lowercase()
        for (domain in blacklistedUrls) {
            val cleanDomain = domain.trim().lowercase()
            if (cleanDomain.isNotEmpty() && lowerText.contains(cleanDomain)) {
                return domain
            }
        }
        return null
    }

    /**
     * Normalizes a user-entered pairing PIN by removing hyphens and whitespace.
     */
    fun sanitizePairingPin(rawPin: String): String {
        return rawPin.replace("-", "").replace(" ", "").trim()
    }

    /**
     * Returns true if the normalized pairing PIN is exactly 6 numeric digits.
     */
    fun isValidPairingPin(rawPin: String): Boolean {
        val cleaned = sanitizePairingPin(rawPin)
        return cleaned.length == 6 && cleaned.all { it.isDigit() }
    }
}
