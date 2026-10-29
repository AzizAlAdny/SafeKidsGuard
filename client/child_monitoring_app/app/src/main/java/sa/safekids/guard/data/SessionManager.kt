package sa.safekids.guard.data

import android.content.Context
import android.content.SharedPreferences

/**
 * SessionManager handles persistent local storage for child app pairing state,
 * authentication tokens, child identification, and configurable API server URL.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "safe_kids_guard_session"

        private const val KEY_BASE_URL = "key_base_url"
        private const val KEY_CHILD_ID = "key_child_id"
        private const val KEY_CHILD_NAME = "key_child_name"
        private const val KEY_ACCESS_TOKEN = "key_access_token"
        private const val KEY_IS_PAIRED = "key_is_paired"
        private const val KEY_SENSITIVITY = "key_sensitivity"

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

    var isPaired: Boolean
        get() = prefs.getBoolean(KEY_IS_PAIRED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    var sensitivityThreshold: Float
        get() = prefs.getFloat(KEY_SENSITIVITY, 0.75f)
        set(value) = prefs.edit().putFloat(KEY_SENSITIVITY, value).apply()

    fun saveSession(childId: String, childName: String, accessToken: String) {
        prefs.edit()
            .putString(KEY_CHILD_ID, childId)
            .putString(KEY_CHILD_NAME, childName)
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putBoolean(KEY_IS_PAIRED, true)
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_CHILD_ID)
            .remove(KEY_CHILD_NAME)
            .remove(KEY_ACCESS_TOKEN)
            .putBoolean(KEY_IS_PAIRED, false)
            .apply()
    }
}
