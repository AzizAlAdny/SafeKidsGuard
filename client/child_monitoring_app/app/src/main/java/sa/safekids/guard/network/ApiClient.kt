package sa.safekids.guard.network

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import okhttp3.Authenticator
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
 * and automatically rotates expired JWT access tokens via POST /auth/refresh.
 */
object ApiClient {

    private const val TAG = "SafeKidsGuard_Api"
    private const val RETRY_HEADER = "X-Retry-Auth"

    private var currentBaseUrl: String? = null
    private var cachedApiService: ApiService? = null
    private val gson = Gson()
    private val refreshLock = Any()

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
                val currentRefreshToken = sessionManager.refreshToken
                if (currentRefreshToken.isBlank()) return@Authenticator null

                // If another thread already refreshed the token, retry immediately with the updated token
                val requestAuthHeader = response.request.header("Authorization")
                val latestAuthHeader = "Bearer ${sessionManager.accessToken}"
                if (sessionManager.accessToken.isNotBlank() && requestAuthHeader != latestAuthHeader) {
                    return@Authenticator response.request.newBuilder()
                        .header("Authorization", latestAuthHeader)
                        .header(RETRY_HEADER, "true")
                        .build()
                }

                try {
                    val refreshUrl = "${if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"}auth/refresh"
                    val jsonPayload = gson.toJson(RefreshTokenRequestDto(refresh_token = currentRefreshToken))
                    val refreshRequest = Request.Builder()
                        .url(refreshUrl)
                        .post(jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType()))
                        .build()

                    val bareClient = OkHttpClient.Builder()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(10, TimeUnit.SECONDS)
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
                                    Log.i(TAG, "Successfully rotated JWT access token via /auth/refresh.")
                                    return@Authenticator response.request.newBuilder()
                                        .header("Authorization", "Bearer ${tokenDto.access_token}")
                                        .header(RETRY_HEADER, "true")
                                        .build()
                                }
                            }
                        } else {
                            Log.w(TAG, "Token refresh returned status ${refreshResp.code}")
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Token refresh failed: ${e.message}")
                }

                null
            }
        }
    }

    private fun buildOkHttpClient(sessionManager: SessionManager?, baseUrl: String): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            // Never log HTTP bodies containing child screen text or tokens (VULN-04 remediation)
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
            redactHeader("Authorization")
        }

        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .authenticator(buildTokenAuthenticator(sessionManager, baseUrl))
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
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
