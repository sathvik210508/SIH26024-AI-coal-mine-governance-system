import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH26024 - AI-Based Smart Governance & Compliance Monitoring"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sih26024.db")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "sih26024_super_secret_enterprise_mining_key_2026_jwt_token")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Storage
    FILE_STORAGE_PATH: str = os.getenv("FILE_STORAGE_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
    
    # AI & Providers
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "deterministic")
    OCR_PROVIDER: str = os.getenv("OCR_PROVIDER", "deterministic")
    MAP_PROVIDER: str = os.getenv("MAP_PROVIDER", "osm")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.FILE_STORAGE_PATH, exist_ok=True)
