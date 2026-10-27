"""
Modern configuration management with proper security and validation
"""

import os
from typing import Optional, List
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import secrets

class Settings(BaseSettings):
    """Production-ready configuration with security best practices"""
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # === Application ===
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    VERSION: str = "2.0.0"

    # === Security - CRITICAL FIXES ===
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ENCRYPTION_KEY: Optional[str] = None

    @model_validator(mode="after")
    def validate_jwt_secret(self):
        """Ensure JWT secret is different from app secret"""
        if self.JWT_SECRET_KEY == self.SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY must be different from SECRET_KEY")
        return self

    # === Database - MODERN POOLING ===
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 60
    DB_POOL_RECYCLE: int = 3600

    # === Performance ===
    MAX_WORKERS: int = 4
    CHUNK_SIZE: int = 10000
    BATCH_SIZE: int = 1000

    # === Monitoring ===
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    METRICS_ENABLED: bool = True

    # === External Services ===
    REDIS_URL: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None

    # === Data Processing ===
    MEDICAID_DATASET_PATH: str = "/data/medicaid_claims.zip"
    SAMPLE_SIZE: Optional[int] = None

    # === Security Headers ===
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    RATE_LIMIT_PER_MINUTE: int = 100

    @property
    def cors_origins_list(self) -> List[str]:
        return self.CORS_ORIGINS

# Global settings instance
settings = Settings()

# Runtime security validation
def validate_security():
    """Validate critical security settings"""
    issues = []

    if len(settings.SECRET_KEY) < 32:
        issues.append("SECRET_KEY too short (min 32 chars)")

    if settings.JWT_SECRET_KEY == settings.SECRET_KEY:
        issues.append("JWT_SECRET_KEY must differ from SECRET_KEY")
    if settings.ENVIRONMENT == "production":
        for name in ("SECRET_KEY", "JWT_SECRET_KEY", "ENCRYPTION_KEY", "AUTH_USERS_JSON"):
            if not os.getenv(name):
                issues.append(f"{name} is required in production")

    if settings.ENVIRONMENT == "production" and settings.DEBUG:
        issues.append("DEBUG cannot be true in production")

    if issues:
        raise ValueError(f"Security validation failed: {issues}")

    return True

# Initialize security validation
validate_security()
