from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "KnowFun Clone"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    SECRET_KEY: str

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    # Supabase PostgreSQL (推荐)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    DATABASE_URL: str = ""

    # MongoDB Atlas (Alternative)
    MONGODB_URL: str = ""
    MONGODB_DB_NAME: str = "knowfun"

    # SQLite (Local)
    SQLITE_URL: str = "sqlite:///./knowfun.db"

    # Redis (Local)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Upstash Redis (Production - FREE)
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    # Supabase Storage (推荐)
    SUPABASE_ACCESS_KEY_ID: str = ""
    SUPABASE_SECRET_ACCESS_KEY: str = ""
    SUPABASE_ENDPOINT: str = ""
    SUPABASE_REGION: str = "us-west-2"
    SUPABASE_BUCKET_NAME: str = "knowfun-files"
    SUPABASE_PUBLIC_URL: str = ""

    # Cloudflare R2 (Alternative)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "knowfun-files"
    R2_PUBLIC_URL: str = ""

    # AWS S3 (Alternative)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"

    # OpenAI / Gemini
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""  # Leave empty for OpenAI, or use custom endpoint
    OPENAI_MODEL: str = "gpt-4o"  # or "gemini-2.0-flash-exp" for Gemini

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"

    # Authentication
    # Supabase Auth (推荐)
    SUPABASE_JWT_SECRET: str = ""

    # Clerk (Alternative)
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # Task Queue (Upstash QStash - FREE)
    QSTASH_URL: str = "https://qstash.upstash.io"
    QSTASH_TOKEN: str = ""
    QSTASH_CURRENT_SIGNING_KEY: str = ""
    QSTASH_NEXT_SIGNING_KEY: str = ""

    # Celery (Alternative for local)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    @property
    def use_supabase(self) -> bool:
        """Check if Supabase is configured"""
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

    @property
    def use_supabase_storage(self) -> bool:
        """Check if Supabase Storage is configured"""
        return bool(self.SUPABASE_ACCESS_KEY_ID)

    @property
    def use_supabase_auth(self) -> bool:
        """Check if Supabase Auth is configured"""
        return bool(self.SUPABASE_JWT_SECRET)

    @property
    def use_qstash(self) -> bool:
        """Check if QStash is configured"""
        return bool(self.QSTASH_TOKEN)

    @property
    def use_r2(self) -> bool:
        """Check if R2 is configured"""
        return bool(self.R2_ACCESS_KEY_ID)

    @property
    def use_upstash_redis(self) -> bool:
        """Check if Upstash Redis is configured"""
        return bool(self.UPSTASH_REDIS_REST_URL)

    @property
    def use_mongodb(self) -> bool:
        """Check if MongoDB is configured"""
        return bool(self.MONGODB_URL)

    @property
    def storage_backend(self) -> str:
        """Get configured storage backend"""
        if self.use_supabase_storage:
            return "supabase"
        elif self.use_r2:
            return "r2"
        elif self.AWS_ACCESS_KEY_ID:
            return "s3"
        return "local"

    @property
    def database_backend(self) -> str:
        """Get configured database backend"""
        if self.use_supabase:
            return "postgresql"
        elif self.use_mongodb:
            return "mongodb"
        return "sqlite"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Subscription Plans
    FREE_TIER_POINTS: int = 500
    FREE_TIER_STORAGE_GB: int = 5
    BASIC_TIER_POINTS: int = 1500
    BASIC_TIER_STORAGE_GB: int = 10
    PLUS_TIER_POINTS: int = 5000
    PLUS_TIER_STORAGE_GB: int = 30
    PRO_TIER_POINTS: int = 100000
    PRO_TIER_STORAGE_GB: int = 100

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
