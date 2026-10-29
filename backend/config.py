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

    # === Engine V3: Real Data Pipeline ===
    # Synthetic demonstration data is forbidden in production. The seed script
    # and any synthetic-serving path must refuse to run unless this is true AND
    # ENVIRONMENT is not 'production'.
    SYNTHETIC_DATA_ALLOWED: bool = False
    # When true, lead-serving routes refuse to surface aggregates whose
    # source_dataset is synthetic (UNVERIFIED_LEGACY / SYNTHETIC_*).
    REAL_DATA_STRICT: bool = True

    # NPPES full monthly dissemination file (auto-discovered when unset)
    NPPES_FULL_URL: Optional[str] = None
    NPPES_DISSEMINATION_PAGE: str = "https://download.nppesdata.com/"

    # Exclusion screening sources (nightly)
    LEIE_CSV_URL: str = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv"
    OMIG_EXCLUSION_PAGE: str = "https://omig.ny.gov/excluded-and-terminated-providers"

    # NYC Open Data (311) - Socrata SODA endpoint
    NYC_311_SODA_ENDPOINT: str = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"

    # Geospatial cross-signal tuning
    CROSS_SIGNAL_RADIUS_M: float = 150.0        # idling within 150m of a SADC site
    CROSS_SIGNAL_MORNING_START_HOUR: int = 5    # ambulette drop-off window
    CROSS_SIGNAL_MORNING_END_HOUR: int = 11
    CROSS_SIGNAL_MIN_COMPLAINTS: int = 3        # minimum in-window complaints to score
    CROSS_SIGNAL_P_VALUE: float = 0.05          # Poisson tail threshold

    # SOL / ENPV decay
    SOL_FEDERAL_YEARS: int = 6                  # 31 U.S.C. 3731(b)(1)
    SOL_KNOWLEDGE_YEARS: int = 3                # 31 U.S.C. 3731(b)(2)
    SOL_CAP_YEARS: int = 10                     # 10-year backstop
    ENPV_STALE_HALF_LIFE_DAYS: int = 180        # unengaged leads halve in value ~6 months

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
