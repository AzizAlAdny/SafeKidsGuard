package sa.safekids.guard.service

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PolicyEvaluatorTest {

    @Test
    fun `boundTextPayload trims and truncates long screen text safely under 5000 chars`() {
        val shortText = "  مرحبا بكم في تطبيق حارس الأطفال الآمن  "
        assertEquals("مرحبا بكم في تطبيق حارس الأطفال الآمن", PolicyEvaluator.boundTextPayload(shortText))

        val longText = "أ".repeat(6000)
        val bounded = PolicyEvaluator.boundTextPayload(longText)
        assertEquals(PolicyEvaluator.MAX_TEXT_LENGTH, bounded.length)
        assertTrue(bounded.length < 5000)
    }

    @Test
    fun `isInBedtimeWindow handles cross-midnight window correctly`() {
        // 21:00 to 06:00 (cross-midnight)
        assertTrue(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 22, 30))
        assertTrue(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 2, 15))
        assertTrue(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 21, 0))
        assertTrue(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 6, 0))
        assertFalse(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 14, 0))
        assertFalse(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 20, 59))
        assertFalse(PolicyEvaluator.isInBedtimeWindow("21:00", "06:00", 6, 1))
    }

    @Test
    fun `isInBedtimeWindow handles same-day window and invalid inputs gracefully`() {
        // 13:00 to 15:30 (same-day)
        assertTrue(PolicyEvaluator.isInBedtimeWindow("13:00", "15:30", 14, 0))
        assertFalse(PolicyEvaluator.isInBedtimeWindow("13:00", "15:30", 16, 0))

        // Invalid or empty strings
        assertFalse(PolicyEvaluator.isInBedtimeWindow("", "06:00", 23, 0))
        assertFalse(PolicyEvaluator.isInBedtimeWindow("invalid", "06:00", 23, 0))
    }

    @Test
    fun `findMatchingBlacklistedDomain matches case-insensitively and ignores blank entries`() {
        val blacklist = setOf("  BadSite.com ", "unsafe-game.net", "")
        val matched = PolicyEvaluator.findMatchingBlacklistedDomain(
            text = "تصفح الموقع https://www.badsite.com/play الآن",
            blacklistedUrls = blacklist
        )
        assertEquals("  BadSite.com ", matched)

        val safeMatch = PolicyEvaluator.findMatchingBlacklistedDomain(
            text = "موقع تعليمي آمن للأطفال https://uj.edu.sa",
            blacklistedUrls = blacklist
        )
        assertNull(safeMatch)
    }

    @Test
    fun `sanitizePairingPin and isValidPairingPin validate 6-digit PINs`() {
        assertTrue(PolicyEvaluator.isValidPairingPin("123-456"))
        assertTrue(PolicyEvaluator.isValidPairingPin(" 987654 "))
        assertEquals("123456", PolicyEvaluator.sanitizePairingPin("123-456"))

        assertFalse(PolicyEvaluator.isValidPairingPin("12345"))
        assertFalse(PolicyEvaluator.isValidPairingPin("123-45a"))
        assertFalse(PolicyEvaluator.isValidPairingPin(""))
    }
}
