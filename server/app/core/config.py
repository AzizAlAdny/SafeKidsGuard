"""
Application settings — loaded from environment variables via Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "server/.env", "../server/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/safekidsguard"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production-safekidsguard-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # WhatsApp Business API
    WA_PHONE_NUMBER_ID: str = ""
    WA_ACCESS_TOKEN: str = ""
    WA_VERIFY_TOKEN: str = ""
    WA_API_VERSION: str = "v21.0"

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    # App
    APP_ENV: str = "development"
    APP_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    AI_CONFIDENCE_THRESHOLD: float = 0.75

    # AI Engine (Phase 2 Transformers)
    AI_ENABLE_TRANSFORMERS: bool = False
    ARABERT_MODEL_NAME: str = "aubmindlab/bert-base-arabertv2"
    CAMELBERT_MODEL_NAME: str = "CAMeL-Lab/bert-base-arabic-camelbert-mix"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    def validate_production_settings(self) -> None:
        """Reject insecure default secrets when running in production."""
        if (
            self.APP_ENV.lower() == "production"
            and self.JWT_SECRET_KEY == "dev-secret-key-change-in-production-safekidsguard-2026"
        ):
            raise ValueError(
                "CRITICAL SECURITY ERROR: Default JWT_SECRET_KEY cannot be used when APP_ENV='production'."
            )


settings = Settings()
settings.validate_production_settings()
