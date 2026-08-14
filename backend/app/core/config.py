import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Parallel AI World Backend"
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral:latest")
    
    # Server Configuration
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
