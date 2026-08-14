from fastapi import APIRouter
from ...services.llm.service import intelligence_service
from ...core.config import settings

router = APIRouter()

@router.get("")
async def backend_health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "api_prefix": settings.API_PREFIX,
        "provider": settings.LLM_PROVIDER,
    }

@router.get("/llm")
async def llm_health():
    """
    Check if the active LLM provider (Ollama or Cloudflare Workers AI) is online.
    """
    result = await intelligence_service.health_check()
    return result
