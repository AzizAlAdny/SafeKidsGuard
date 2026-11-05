package sa.safekids.guard.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import sa.safekids.guard.network.ActivityEventDto
import sa.safekids.guard.network.PolicyDto

/**
 * SessionManager handles encrypted persistent local storage for child app pairing state,
 * authentication tokens, cached parental policies, offline activity queue, and configurable API server URL.
 */
class SessionManager(context: Context) {

    private val appContext: Context = context.applicationContext
    private var prefs: SharedPreferences = createSecurePrefs(appContext)
    private val fallbackPrefs: SharedPreferences =
        appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()
    private val queueLock = Any()

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

    /**
     * Ensures that if EncryptedSharedPreferences failed during early boot (before screen unlock),
     * we recover or fall back to mirrored preferences so the child session is never lost.
     */
    private fun getActivePrefs(): SharedPreferences {
        if (prefs === fallbackPrefs) {
            try {
                prefs = createSecurePrefs(appContext)
            } catch (_: Exception) {
            }
        }
        return prefs
    }

    companion object {
        private const val PREF_NAME = "safe_kids_guard_session"
        private const val PREF_NAME_ENCRYPTED = "safe_kids_guard_encrypted_session"

        const val ACTION_FORCE_RECONNECT = "sa.safekids.guard.ACTION_FORCE_RECONNECT"
        private const val MAX_OFFLINE_QUEUE_SIZE = 50

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
        private const val KEY_PAIRED_AT_MS = "key_paired_at_ms"
        private const val KEY_LAST_SYNC_MS = "key_last_sync_ms"
        private const val KEY_SERVER_REACHABLE = "key_server_reachable"
        private const val KEY_AUTH_EXPIRED = "key_auth_expired"
        private const val KEY_OFFLINE_ACTIVITY_QUEUE = "key_offline_activity_queue"

        // Default Server URL (Physical device LAN IP or Emulator loopback)
        const val DEFAULT_BASE_URL = "http://192.168.1.102:8000/"
        const val EMULATOR_BASE_URL = "http://10.0.2.2:8000/"

        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    var baseUrl: String
        get() = getActivePrefs().getString(KEY_BASE_URL, null)
            ?: fallbackPrefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL)
            ?: DEFAULT_BASE_URL
        set(value) {
            val formatted = if (value.endsWith("/")) value else "$value/"
            getActivePrefs().edit().putString(KEY_BASE_URL, formatted).apply()
            fallbackPrefs.edit().putString(KEY_BASE_URL, formatted).apply()
        }

    var childId: String
        get() = getActivePrefs().getString(KEY_CHILD_ID, null)
            ?: fallbackPrefs.getString(KEY_CHILD_ID, "")
            ?: ""
        set(value) {
            getActivePrefs().edit().putString(KEY_CHILD_ID, value).apply()
            fallbackPrefs.edit().putString(KEY_CHILD_ID, value).apply()
        }

    var childName: String
        get() = getActivePrefs().getString(KEY_CHILD_NAME, null)
            ?: fallbackPrefs.getString(KEY_CHILD_NAME, "الطفل")
            ?: "الطفل"
        set(value) {
            getActivePrefs().edit().putString(KEY_CHILD_NAME, value).apply()
            fallbackPrefs.edit().putString(KEY_CHILD_NAME, value).apply()
        }

    var accessToken: String
        get() = getActivePrefs().getString(KEY_ACCESS_TOKEN, null)
            ?: fallbackPrefs.getString(KEY_ACCESS_TOKEN, "")
            ?: ""
        set(value) {
            getActivePrefs().edit().putString(KEY_ACCESS_TOKEN, value).apply()
            fallbackPrefs.edit().putString(KEY_ACCESS_TOKEN, value).apply()
        }

    var refreshToken: String
        get() = getActivePrefs().getString(KEY_REFRESH_TOKEN, null)
            ?: fallbackPrefs.getString(KEY_REFRESH_TOKEN, "")
            ?: ""
        set(value) {
            getActivePrefs().edit().putString(KEY_REFRESH_TOKEN, value).apply()
            fallbackPrefs.edit().putString(KEY_REFRESH_TOKEN, value).apply()
        }

    var isPaired: Boolean
        get() = getActivePrefs().getBoolean(
            KEY_IS_PAIRED,
            fallbackPrefs.getBoolean(KEY_IS_PAIRED, false)
        )
        set(value) {
            getActivePrefs().edit().putBoolean(KEY_IS_PAIRED, value).apply()
            fallbackPrefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()
        }

    var sensitivityThreshold: Float
        get() = getActivePrefs().getFloat(KEY_SENSITIVITY, 0.75f)
        set(value) = getActivePrefs().edit().putFloat(KEY_SENSITIVITY, value).apply()

    var blockViolence: Boolean
        get() = getActivePrefs().getBoolean(KEY_BLOCK_VIOLENCE, true)
        set(value) = getActivePrefs().edit().putBoolean(KEY_BLOCK_VIOLENCE, value).apply()

    var blockSexual: Boolean
        get() = getActivePrefs().getBoolean(KEY_BLOCK_SEXUAL, true)
        set(value) = getActivePrefs().edit().putBoolean(KEY_BLOCK_SEXUAL, value).apply()

    var blockCyberbullying: Boolean
        get() = getActivePrefs().getBoolean(KEY_BLOCK_CYBERBULLYING, true)
        set(value) = getActivePrefs().edit().putBoolean(KEY_BLOCK_CYBERBULLYING, value).apply()

    var blockHateSpeech: Boolean
        get() = getActivePrefs().getBoolean(KEY_BLOCK_HATE_SPEECH, true)
        set(value) = getActivePrefs().edit().putBoolean(KEY_BLOCK_HATE_SPEECH, value).apply()

    var blockedApps: Set<String>
        get() = getActivePrefs().getStringSet(KEY_BLOCKED_APPS, null)
            ?: fallbackPrefs.getStringSet(KEY_BLOCKED_APPS, emptySet())
            ?: emptySet()
        set(value) {
            getActivePrefs().edit().putStringSet(KEY_BLOCKED_APPS, value).apply()
            fallbackPrefs.edit().putStringSet(KEY_BLOCKED_APPS, value).apply()
        }

    var blacklistedUrls: Set<String>
        get() = getActivePrefs().getStringSet(KEY_BLACKLISTED_URLS, null)
            ?: fallbackPrefs.getStringSet(KEY_BLACKLISTED_URLS, emptySet())
            ?: emptySet()
        set(value) {
            getActivePrefs().edit().putStringSet(KEY_BLACKLISTED_URLS, value).apply()
            fallbackPrefs.edit().putStringSet(KEY_BLACKLISTED_URLS, value).apply()
        }

    var screenTimeDailyLimitMins: Int
        get() = getActivePrefs().getInt(KEY_SCREEN_TIME_MINS, 120)
        set(value) = getActivePrefs().edit().putInt(KEY_SCREEN_TIME_MINS, value).apply()

    var bedtimeStart: String
        get() = getActivePrefs().getString(KEY_BEDTIME_START, "21:00") ?: "21:00"
        set(value) = getActivePrefs().edit().putString(KEY_BEDTIME_START, value).apply()

    var bedtimeEnd: String
        get() = getActivePrefs().getString(KEY_BEDTIME_END, "06:00") ?: "06:00"
        set(value) = getActivePrefs().edit().putString(KEY_BEDTIME_END, value).apply()

    var pairedAtTimestamp: Long
        get() = getActivePrefs().getLong(KEY_PAIRED_AT_MS, System.currentTimeMillis())
        set(value) = getActivePrefs().edit().putLong(KEY_PAIRED_AT_MS, value).apply()

    var lastSyncTimestampMs: Long
        get() = getActivePrefs().getLong(
            KEY_LAST_SYNC_MS,
            fallbackPrefs.getLong(KEY_LAST_SYNC_MS, 0L)
        )
        set(value) {
            getActivePrefs().edit().putLong(KEY_LAST_SYNC_MS, value).apply()
            fallbackPrefs.edit().putLong(KEY_LAST_SYNC_MS, value).apply()
        }

    var isServerReachable: Boolean
        get() = getActivePrefs().getBoolean(
            KEY_SERVER_REACHABLE,
            fallbackPrefs.getBoolean(KEY_SERVER_REACHABLE, true)
        )
        set(value) {
            getActivePrefs().edit().putBoolean(KEY_SERVER_REACHABLE, value).apply()
            fallbackPrefs.edit().putBoolean(KEY_SERVER_REACHABLE, value).apply()
        }

    var isAuthExpired: Boolean
        get() = getActivePrefs().getBoolean(
            KEY_AUTH_EXPIRED,
            fallbackPrefs.getBoolean(KEY_AUTH_EXPIRED, false)
        )
        set(value) {
            getActivePrefs().edit().putBoolean(KEY_AUTH_EXPIRED, value).apply()
            fallbackPrefs.edit().putBoolean(KEY_AUTH_EXPIRED, value).apply()
        }

    fun markSyncSuccess() {
        val now = System.currentTimeMillis()
        lastSyncTimestampMs = now
        isServerReachable = true
        isAuthExpired = false
    }

    fun enqueueOfflineActivity(event: ActivityEventDto) {
        synchronized(queueLock) {
            val current = getOfflineActivitiesInternal().toMutableList()
            if (current.size >= MAX_OFFLINE_QUEUE_SIZE) {
                current.removeAt(0)
            }
            current.add(event)
            val json = gson.toJson(current)
            getActivePrefs().edit().putString(KEY_OFFLINE_ACTIVITY_QUEUE, json).apply()
            fallbackPrefs.edit().putString(KEY_OFFLINE_ACTIVITY_QUEUE, json).apply()
        }
    }

    fun drainOfflineActivities(): List<ActivityEventDto> {
        synchronized(queueLock) {
            val list = getOfflineActivitiesInternal()
            if (list.isNotEmpty()) {
                getActivePrefs().edit().remove(KEY_OFFLINE_ACTIVITY_QUEUE).apply()
                fallbackPrefs.edit().remove(KEY_OFFLINE_ACTIVITY_QUEUE).apply()
            }
            return list
        }
    }

    fun getOfflineActivityCount(): Int {
        synchronized(queueLock) {
            return getOfflineActivitiesInternal().size
        }
    }

    private fun getOfflineActivitiesInternal(): List<ActivityEventDto> {
        return try {
            val raw = getActivePrefs().getString(KEY_OFFLINE_ACTIVITY_QUEUE, null)
                ?: fallbackPrefs.getString(KEY_OFFLINE_ACTIVITY_QUEUE, null)
            if (raw.isNullOrBlank()) {
                emptyList()
            } else {
                val type = object : TypeToken<List<ActivityEventDto>>() {}.type
                gson.fromJson<List<ActivityEventDto>>(raw, type) ?: emptyList()
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveSession(
        childId: String,
        childName: String,
        accessToken: String,
        refreshToken: String = ""
    ) {
        val now = System.currentTimeMillis()
        for (target in listOf(getActivePrefs(), fallbackPrefs)) {
            target.edit()
                .putString(KEY_CHILD_ID, childId)
                .putString(KEY_CHILD_NAME, childName)
                .putString(KEY_ACCESS_TOKEN, accessToken)
                .putString(KEY_REFRESH_TOKEN, refreshToken)
                .putBoolean(KEY_IS_PAIRED, true)
                .putBoolean(KEY_SERVER_REACHABLE, true)
                .putBoolean(KEY_AUTH_EXPIRED, false)
                .putLong(KEY_PAIRED_AT_MS, now)
                .putLong(KEY_LAST_SYNC_MS, now)
                .apply()
        }
    }

    fun cachePolicy(policy: PolicyDto) {
        for (target in listOf(getActivePrefs(), fallbackPrefs)) {
            target.edit()
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
        markSyncSuccess()
    }

    fun clearSession() {
        for (target in listOf(getActivePrefs(), fallbackPrefs)) {
            target.edit()
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
                .remove(KEY_OFFLINE_ACTIVITY_QUEUE)
                .putBoolean(KEY_IS_PAIRED, false)
                .putBoolean(KEY_AUTH_EXPIRED, false)
                .apply()
        }
    }
}
