import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "CodeSentinel AI Worker Engine"
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
    
    # Secret Scrubber & Heuristics
    SECRET_ENTROPY_THRESHOLD: float = float(os.getenv("SECRET_ENTROPY_THRESHOLD", "3.8"))
    MAX_DIFF_LINE_LENGTH: int = int(os.getenv("MAX_DIFF_LINE_LENGTH", "1000"))
    ENABLE_FALLBACK_HEURISTICS: bool = os.getenv("ENABLE_FALLBACK_HEURISTICS", "true").lower() in ("true", "1", "yes")
    
    # Circuit & Timeout Settings
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "8.0"))

    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
