from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    ENV: str = "development"
    API_PREFIX: str = "/api/v1"

    LOG_LEVEL: str = "INFO"

    # Database (PostgreSQL with asyncpg)
    DATABASE_URL: str | None = None
    DB_HOST: str | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None
    DB_PORT: int | None = None

    # Redis
    REDIS_URL: str | None = None
    REDIS_HOST: str | None = None
    REDIS_PORT: int | None = None
    REDIS_PASSWORD: str | None = None
    REDIS_MAXMEMORY: str | None = None
    REDIS_TIMEOUT: int | None = None
    REDIS_HZ: int | None = None

    JWT_SECRET: str = "change_me"
    JWT_EXPIRES_IN: str = "7d"

    # Chat/LLM provider - YEScale API
    CHAT_API_BASE: str = "https://im06lq19wz.apifox.cn/api-262294474"  # YEScale API base URL
    CHAT_API_KEY: str | None = None
    CHAT_MODEL: str = "gpt-4o-mini-2024-07-18"
    CHAT_MAX_TOKENS: int = 1000
    CHAT_TEMPERATURE: float = 0.2

    # Testing/Startup controls
    SKIP_STARTUP_CHECKS: bool = False

    # OCR Expense Configuration
    OCR_UPLOAD_DIR: str = "/tmp/uploads/ocr"
    OCR_MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB as per spec
    OCR_ALLOWED_TYPES: list = ["image/jpeg", "image/png", "image/heic", "application/pdf"]
    OCR_MAX_DIMENSION: int = 1280  # Max dimension for image processing
    OCR_DPI: int = 300
    OCR_DEFAULT_TIMEZONE: str = "Asia/Ho_Chi_Minh"

    # Gemini OCR Configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_API_BASE_URL: str | None = None
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"
    GEMINI_MAX_TOKENS: int = 256
    GEMINI_TEMPERATURE: float = 0.0
    # Prompt mode: "json" (default) or "financial" (text/plain like gemini_adv)
    GEMINI_OCR_PROMPT_MODE: str = "json"
    # In financial mode, optionally bypass preprocessing (send original image)
    OCR_BYPASS_PREPROCESS_FINANCIAL: bool = True
    
    # OCR Batch Processing
    OCR_BATCH_SIZE: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # Debug: Kiểm tra .env file
    print("🔍 DEBUG: Current working directory:", os.getcwd())
    print("🔍 DEBUG: .env file exists:", os.path.exists(".env"))
    print("🔍 DEBUG: Files in current dir:", os.listdir("."))
    
    # Debug: Kiểm tra environment variables
    print("🔍 DEBUG: Environment variables:")
    for key in ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]:
        value = os.getenv(key, "NOT_SET")
        print(f"  {key}={value}")
    
    settings = Settings()
    
    # Debug: Kiểm tra Settings values
    print("🔍 DEBUG: Settings values after loading:")
    print(f"  DB_HOST={settings.DB_HOST}")
    print(f"  DB_PORT={settings.DB_PORT}")
    print(f"  DB_USER={settings.DB_USER}")
    print(f"  DB_PASSWORD={settings.DB_PASSWORD}")
    print(f"  DB_NAME={settings.DB_NAME}")
    
    return settings


settings = get_settings()


