package sa.safekids.guard.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

data class LoginDto(
    val email: String,
    val password: String
)

data class TokenDto(
    val access_token: String,
    val refresh_token: String
)

data class ClassificationRequest(
    val text: String,
    val child_id: String,
    val context_app: String? = null
)

data class ClassificationResponse(
    val verdict: String, // ALLOWED or BLOCKED
    val category: String, // SAFE, CYBERBULLYING, SEXUAL, VIOLENCE, HATE_SPEECH
    val confidence: Double,
    val is_blocked: Boolean,
    val cached: Boolean = false
)

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

    @POST("classification/predict")
    suspend fun classifyText(
        @Header("Authorization") token: String,
        @Body request: ClassificationRequest
    ): Response<ClassificationResponse>

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
