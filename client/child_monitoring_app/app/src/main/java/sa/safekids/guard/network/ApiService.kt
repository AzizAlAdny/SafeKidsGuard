package sa.safekids.guard.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

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
    val verdict: String, // SAFE, CYBERBULLYING, SEXUAL, VIOLENCE, HATE_SPEECH
    val confidence: Double,
    val is_blocked: Boolean
)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginDto): Response<TokenDto>

    @POST("classification/predict")
    suspend fun classifyText(
        @Header("Authorization") token: String,
        @Body request: ClassificationRequest
    ): Response<ClassificationResponse>
}
