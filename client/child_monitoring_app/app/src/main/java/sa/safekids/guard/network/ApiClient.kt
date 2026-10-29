package sa.safekids.guard.network

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import sa.safekids.guard.data.SessionManager
import java.util.concurrent.TimeUnit

/**
 * ApiClient provides a thread-safe singleton Retrofit instance.
 * Automatically synchronizes with SessionManager's active baseUrl.
 */
object ApiClient {

    private var currentBaseUrl: String? = null
    private var cachedApiService: ApiService? = null

    private fun buildOkHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
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
