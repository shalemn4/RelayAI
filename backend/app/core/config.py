import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RelayAI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "relayai-super-secret-production-jwt-key-change-in-prod-12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # SQLite WAL mode by default, or Postgres if DATABASE_URL provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./relayai.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    class Config:
        case_sensitive = True

settings = Settings()
