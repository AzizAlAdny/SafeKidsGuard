package sa.safekids.guard.network

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import sa.safekids.guard.BuildConfig
import sa.safekids.guard.data.SessionManager
import java.util.concurrent.TimeUnit

/**
 * ApiClient provides a thread-safe singleton Retrofit instance.
 * Redacts Authorization headers, avoids logging sensitive request bodies (NFR4),
 * always injects the freshest Bearer token, and automatically rotates expired JWT
 * access tokens via POST /auth/refresh.
 */
object ApiClient {

    private const val TAG = "SafeKidsGuard_Api"
    private const val RETRY_HEADER = "X-Retry-Auth"

    private var currentBaseUrl: String? = null
    private var cachedApiService: ApiService? = null
    private val gson = Gson()
    private val refreshLock = Any()

    /**
     * Thread-safe synchronous token rotation helper that can be invoked both by OkHttp's
     * Authenticator (on HTTP 401) and proactively by MonitoringAccessibilityService / MainActivity.
     */
    fun refreshTokenSynchronously(sessionManager: SessionManager, baseUrl: String): Boolean {
        synchronized(refreshLock) {
            val currentRefreshToken = sessionManager.refreshToken
            if (currentRefreshToken.isBlank()) {
                sessionManager.isAuthExpired = true
                return false
            }

            try {
                val refreshUrl = "${if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"}auth/refresh"
                val jsonPayload = gson.toJson(RefreshTokenRequestDto(refresh_token = currentRefreshToken))
                val refreshRequest = Request.Builder()
                    .url(refreshUrl)
                    .post(jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType()))
                    .build()

                val bareClient = OkHttpClient.Builder()
                    .connectTimeout(5, TimeUnit.SECONDS)
                    .readTimeout(8, TimeUnit.SECONDS)
                    .build()

                bareClient.newCall(refreshRequest).execute().use { refreshResp ->
                    if (refreshResp.isSuccessful) {
                        val bodyStr = refreshResp.body?.string()
                        if (!bodyStr.isNullOrBlank()) {
                            val tokenDto = gson.fromJson(bodyStr, TokenDto::class.java)
                            if (tokenDto != null && tokenDto.access_token.isNotBlank()) {
                                sessionManager.accessToken = tokenDto.access_token
                                if (tokenDto.refresh_token.isNotBlank()) {
                                    sessionManager.refreshToken = tokenDto.refresh_token
                                }
                                sessionManager.isAuthExpired = false
                                sessionManager.isServerReachable = true
                                Log.i(TAG, "Successfully rotated JWT access token via /auth/refresh.")
                                return true
                            }
                        }
                    } else if (refreshResp.code == 401 || refreshResp.code == 403) {
                        Log.w(TAG, "Refresh token rejected by server (status ${refreshResp.code}).")
                        sessionManager.isAuthExpired = true
                        sessionManager.isServerReachable = true
                    } else {
                        Log.w(TAG, "Token refresh returned status ${refreshResp.code}")
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Token refresh failed (offline): ${e.message}")
            }

            return false
        }
    }

    private fun buildAuthHeaderInterceptor(sessionManager: SessionManager?): Interceptor {
        return Interceptor { chain ->
            val original = chain.request()
            if (sessionManager == null || original.header(RETRY_HEADER) != null) {
                return@Interceptor chain.proceed(original)
            }
            val hasAuthHeader = original.header("Authorization") != null
            val latestToken = sessionManager.accessToken
            val request = if (hasAuthHeader && latestToken.isNotBlank()) {
                original.newBuilder()
                    .header("Authorization", "Bearer $latestToken")
                    .build()
            } else {
                original
            }
            chain.proceed(request)
        }
    }

    private fun buildTokenAuthenticator(sessionManager: SessionManager?, baseUrl: String): Authenticator {
        return Authenticator { _: Route?, response: Response ->
            if (sessionManager == null) return@Authenticator null

            val path = response.request.url.encodedPath
            // Do not attempt token refresh on auth endpoints that don't use Bearer access tokens
            if (path.endsWith("/auth/login") ||
                path.endsWith("/auth/pair-device") ||
                path.endsWith("/auth/refresh") ||
                response.request.header(RETRY_HEADER) != null
            ) {
                return@Authenticator null
            }

            synchronized(refreshLock) {
                if (sessionManager.refreshToken.isBlank()) {
                    sessionManager.isAuthExpired = true
                    return@Authenticator null
                }

                // If another thread already refreshed the token, retry immediately with the updated token
                val requestAuthHeader = response.request.header("Authorization")
                val latestAuthHeader = "Bearer ${sessionManager.accessToken}"
                if (sessionManager.accessToken.isNotBlank() && requestAuthHeader != latestAuthHeader) {
                    return@Authenticator response.request.newBuilder()
                        .header("Authorization", latestAuthHeader)
                        .header(RETRY_HEADER, "true")
                        .build()
                }

                if (refreshTokenSynchronously(sessionManager, baseUrl)) {
                    return@Authenticator response.request.newBuilder()
                        .header("Authorization", "Bearer ${sessionManager.accessToken}")
                        .header(RETRY_HEADER, "true")
                        .build()
                }

                null
            }
        }
    }

    private fun buildOkHttpClient(sessionManager: SessionManager?, baseUrl: String): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            // Never log HTTP bodies containing child screen text or tokens (NFR4)
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
            redactHeader("Authorization")
        }

        return OkHttpClient.Builder()
            .addInterceptor(buildAuthHeaderInterceptor(sessionManager))
            .addInterceptor(loggingInterceptor)
            .authenticator(buildTokenAuthenticator(sessionManager, baseUrl))
            .connectTimeout(4, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .writeTimeout(8, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    @Synchronized
    fun getApiService(context: Context): ApiService {
        val sessionManager = SessionManager.getInstance(context)
        val baseUrl = sessionManager.baseUrl

        if (cachedApiService == null || currentBaseUrl != baseUrl) {
            currentBaseUrl = baseUrl
            val okHttpClient = buildOkHttpClient(sessionManager, baseUrl)

            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            cachedApiService = retrofit.create(ApiService::class.java)
        }

        return cachedApiService!!
    }

    @Synchronized
    fun getApiService(baseUrl: String): ApiService {
        val formattedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (cachedApiService == null || currentBaseUrl != formattedUrl) {
            currentBaseUrl = formattedUrl
            val okHttpClient = buildOkHttpClient(null, formattedUrl)

            val retrofit = Retrofit.Builder()
                .baseUrl(formattedUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            cachedApiService = retrofit.create(ApiService::class.java)
        }
        return cachedApiService!!
    }
}
