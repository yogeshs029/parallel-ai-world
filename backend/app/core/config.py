import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Parallel AI World Backend"
    
    # Environment Mode ('development' | 'production' | 'test')
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # LLM Provider Configuration ("ollama" for local dev, "cloudflare" for production)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")

    # Ollama Configuration (Local Development)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral:latest")
    
    # Cloudflare Workers AI Configuration (Cloud Production)
    CLOUDFLARE_AI_MODEL: str = os.getenv("CLOUDFLARE_AI_MODEL", "@cf/meta/llama-3.1-8b-instruct")
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = os.getenv("CLOUDFLARE_ACCOUNT_ID", None)
    CLOUDFLARE_API_TOKEN: Optional[str] = os.getenv("CLOUDFLARE_API_TOKEN", None)

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
