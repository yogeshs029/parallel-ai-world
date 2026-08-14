from fastapi import APIRouter
from ...services.llm.ollama import OllamaProvider
from ...core.config import settings

router = APIRouter()
ollama_provider = OllamaProvider()

@router.get("")
async def backend_health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "api_prefix": settings.API_PREFIX,
    }

@router.get("/llm")
async def llm_health():
    """
    Check if the local Ollama provider is online.
    """
    result = await ollama_provider.health_check()
    return result
