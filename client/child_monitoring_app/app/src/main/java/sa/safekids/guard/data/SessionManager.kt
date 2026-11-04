package sa.safekids.guard.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import sa.safekids.guard.network.PolicyDto

/**
 * SessionManager handles encrypted persistent local storage for child app pairing state,
 * authentication tokens, cached parental policies, and configurable API server URL.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences = createSecurePrefs(context)

    private fun createSecurePrefs(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                PREF_NAME_ENCRYPTED,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (_: Exception) {
            // Fallback for headless unit tests / emulators without hardware keystore
            context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        }
    }

    companion object {
        private const val PREF_NAME = "safe_kids_guard_session"
        private const val PREF_NAME_ENCRYPTED = "safe_kids_guard_encrypted_session"

        private const val KEY_BASE_URL = "key_base_url"
        private const val KEY_CHILD_ID = "key_child_id"
        private const val KEY_CHILD_NAME = "key_child_name"
        private const val KEY_ACCESS_TOKEN = "key_access_token"
        private const val KEY_REFRESH_TOKEN = "key_refresh_token"
        private const val KEY_IS_PAIRED = "key_is_paired"
        private const val KEY_SENSITIVITY = "key_sensitivity"
        private const val KEY_BLOCK_VIOLENCE = "key_block_violence"
        private const val KEY_BLOCK_SEXUAL = "key_block_sexual"
        private const val KEY_BLOCK_CYBERBULLYING = "key_block_cyberbullying"
        private const val KEY_BLOCK_HATE_SPEECH = "key_block_hate_speech"
        private const val KEY_BLOCKED_APPS = "key_blocked_apps"
        private const val KEY_BLACKLISTED_URLS = "key_blacklisted_urls"
        private const val KEY_SCREEN_TIME_MINS = "key_screen_time_mins"
        private const val KEY_BEDTIME_START = "key_bedtime_start"
        private const val KEY_BEDTIME_END = "key_bedtime_end"

        // Default Android Emulator IP connecting to host PC
        const val DEFAULT_BASE_URL = "http://10.0.2.2:8000/"

        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    var baseUrl: String
        get() = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        set(value) {
            val formatted = if (value.endsWith("/")) value else "$value/"
            prefs.edit().putString(KEY_BASE_URL, formatted).apply()
        }

    var childId: String
        get() = prefs.getString(KEY_CHILD_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_CHILD_ID, value).apply()

    var childName: String
        get() = prefs.getString(KEY_CHILD_NAME, "الطفل") ?: "الطفل"
        set(value) = prefs.edit().putString(KEY_CHILD_NAME, value).apply()

    var accessToken: String
        get() = prefs.getString(KEY_ACCESS_TOKEN, "") ?: ""
        set(value) = prefs.edit().putString(KEY_ACCESS_TOKEN, value).apply()

    var refreshToken: String
        get() = prefs.getString(KEY_REFRESH_TOKEN, "") ?: ""
        set(value) = prefs.edit().putString(KEY_REFRESH_TOKEN, value).apply()

    var isPaired: Boolean
        get() = prefs.getBoolean(KEY_IS_PAIRED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    var sensitivityThreshold: Float
        get() = prefs.getFloat(KEY_SENSITIVITY, 0.75f)
        set(value) = prefs.edit().putFloat(KEY_SENSITIVITY, value).apply()

    var blockViolence: Boolean
        get() = prefs.getBoolean(KEY_BLOCK_VIOLENCE, true)
        set(value) = prefs.edit().putBoolean(KEY_BLOCK_VIOLENCE, value).apply()

    var blockSexual: Boolean
        get() = prefs.getBoolean(KEY_BLOCK_SEXUAL, true)
        set(value) = prefs.edit().putBoolean(KEY_BLOCK_SEXUAL, value).apply()

    var blockCyberbullying: Boolean
        get() = prefs.getBoolean(KEY_BLOCK_CYBERBULLYING, true)
        set(value) = prefs.edit().putBoolean(KEY_BLOCK_CYBERBULLYING, value).apply()

    var blockHateSpeech: Boolean
        get() = prefs.getBoolean(KEY_BLOCK_HATE_SPEECH, true)
        set(value) = prefs.edit().putBoolean(KEY_BLOCK_HATE_SPEECH, value).apply()

    var blockedApps: Set<String>
        get() = prefs.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
        set(value) = prefs.edit().putStringSet(KEY_BLOCKED_APPS, value).apply()

    var blacklistedUrls: Set<String>
        get() = prefs.getStringSet(KEY_BLACKLISTED_URLS, emptySet()) ?: emptySet()
        set(value) = prefs.edit().putStringSet(KEY_BLACKLISTED_URLS, value).apply()

    var screenTimeDailyLimitMins: Int
        get() = prefs.getInt(KEY_SCREEN_TIME_MINS, 120)
        set(value) = prefs.edit().putInt(KEY_SCREEN_TIME_MINS, value).apply()

    var bedtimeStart: String
        get() = prefs.getString(KEY_BEDTIME_START, "21:00") ?: "21:00"
        set(value) = prefs.edit().putString(KEY_BEDTIME_START, value).apply()

    var bedtimeEnd: String
        get() = prefs.getString(KEY_BEDTIME_END, "06:00") ?: "06:00"
        set(value) = prefs.edit().putString(KEY_BEDTIME_END, value).apply()

    fun saveSession(
        childId: String,
        childName: String,
        accessToken: String,
        refreshToken: String = ""
    ) {
        prefs.edit()
            .putString(KEY_CHILD_ID, childId)
            .putString(KEY_CHILD_NAME, childName)
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putBoolean(KEY_IS_PAIRED, true)
            .apply()
    }

    fun cachePolicy(policy: PolicyDto) {
        prefs.edit()
            .putFloat(KEY_SENSITIVITY, policy.sensitivity_threshold.toFloat())
            .putBoolean(KEY_BLOCK_VIOLENCE, policy.block_violence)
            .putBoolean(KEY_BLOCK_SEXUAL, policy.block_sexual)
            .putBoolean(KEY_BLOCK_CYBERBULLYING, policy.block_cyberbullying)
            .putBoolean(KEY_BLOCK_HATE_SPEECH, policy.block_hate_speech)
            .putStringSet(KEY_BLOCKED_APPS, policy.blocked_apps.toSet())
            .putStringSet(KEY_BLACKLISTED_URLS, policy.custom_blacklist_urls.toSet())
            .putInt(KEY_SCREEN_TIME_MINS, policy.screen_time_daily_limit_mins)
            .putString(KEY_BEDTIME_START, policy.bedtime_start ?: "21:00")
            .putString(KEY_BEDTIME_END, policy.bedtime_end ?: "06:00")
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_CHILD_ID)
            .remove(KEY_CHILD_NAME)
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_BLOCK_VIOLENCE)
            .remove(KEY_BLOCK_SEXUAL)
            .remove(KEY_BLOCK_CYBERBULLYING)
            .remove(KEY_BLOCK_HATE_SPEECH)
            .remove(KEY_BLOCKED_APPS)
            .remove(KEY_BLACKLISTED_URLS)
            .putBoolean(KEY_IS_PAIRED, false)
            .apply()
    }
}
