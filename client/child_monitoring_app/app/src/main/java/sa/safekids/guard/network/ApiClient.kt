package sa.safekids.guard.network

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import sa.safekids.guard.BuildConfig
import sa.safekids.guard.data.SessionManager
import java.util.concurrent.TimeUnit

/**
 * ApiClient provides a thread-safe singleton Retrofit instance.
 * Redacts Authorization headers and avoids logging sensitive request bodies (NFR4).
 */
object ApiClient {

    private var currentBaseUrl: String? = null
    private var cachedApiService: ApiService? = null

    private fun buildOkHttpClient(): OkHttpClient {
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
            val okHttpClient = buildOkHttpClient()

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
            val okHttpClient = buildOkHttpClient()

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
