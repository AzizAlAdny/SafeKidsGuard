package sa.safekids.guard.network

import androidx.annotation.Keep
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

@Keep
data class LoginDto(
    val email: String,
    val password: String
)

@Keep
data class RefreshTokenRequestDto(
    val refresh_token: String
)

@Keep
data class TokenDto(
    val access_token: String,
    val refresh_token: String
)

@Keep
data class PairDeviceRequestDto(
    val pairing_pin: String
)

@Keep
data class PairDeviceResponseDto(
    val access_token: String,
    val refresh_token: String,
    val token_type: String = "bearer",
    val child_id: String,
    val child_name: String,
    val family_id: String
)

@Keep
data class UnpairDeviceRequestDto(
    val parent_password: String
)

@Keep
data class AccessAppealRequestDto(
    val child_id: String,
    val alert_id: String? = null,
    val reason: String = "أعتقد أن هذا المحتوى آمن وأطلب السماح بالوصول",
    val context_app: String? = null
)

@Keep
data class ClassificationRequest(
    val text: String,
    val child_id: String,
    val context_app: String? = null
)

@Keep
data class ClassificationResponse(
    val verdict: String, // ALLOWED or BLOCKED
    val category: String, // SAFE, CYBERBULLYING, SEXUAL, VIOLENCE, HATE_SPEECH
    val confidence: Double,
    val is_blocked: Boolean,
    val block_reason: String? = null,
    val alert_id: String? = null,
    val cached: Boolean = false
)

@Keep
data class PolicyDto(
    val id: String,
    val child_id: String,
    val parent_id: String,
    val age_level: Int,
    val block_violence: Boolean,
    val block_sexual: Boolean,
    val block_cyberbullying: Boolean,
    val block_hate_speech: Boolean,
    val sensitivity_threshold: Double,
    val custom_blacklist_urls: List<String>,
    val blocked_apps: List<String>,
    val screen_time_daily_limit_mins: Int,
    val bedtime_start: String?,
    val bedtime_end: String?
)

@Keep
data class ActivityEventDto(
    val child_id: String,
    val app_name: String?,
    val url: String?,
    val content_snippet: String,
    val category: String,
    val confidence: Double,
    val verdict: String
)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginDto): Response<TokenDto>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body body: RefreshTokenRequestDto): Response<TokenDto>

    @POST("auth/pair-device")
    suspend fun pairDevice(@Body body: PairDeviceRequestDto): Response<PairDeviceResponseDto>

    @POST("auth/unpair-device")
    suspend fun unpairDevice(
        @Header("Authorization") token: String,
        @Body body: UnpairDeviceRequestDto
    ): Response<Unit>

    @POST("classification/predict")
    suspend fun classifyText(
        @Header("Authorization") token: String,
        @Body request: ClassificationRequest
    ): Response<ClassificationResponse>

    @POST("alerts/request-access")
    suspend fun requestAccessAppeal(
        @Header("Authorization") token: String,
        @Body body: AccessAppealRequestDto
    ): Response<Unit>

    @GET("policies/{child_id}")
    suspend fun getPolicy(
        @Header("Authorization") token: String,
        @Path("child_id") childId: String
    ): Response<PolicyDto>

    @POST("activity")
    suspend fun logActivity(
        @Header("Authorization") token: String,
        @Body event: ActivityEventDto
    ): Response<Unit>
}
