import logging
from typing import Dict, Any, List, AsyncGenerator, Optional
from .base import LLMProvider
from .ollama import OllamaProvider
from .cloudflare import CloudflareWorkersAIProvider
from ...core.config import settings

logger = logging.getLogger(__name__)

class IntelligenceService:
    """
    IntelligenceService coordinates LLM operations, providing a single entry point
    for prompt construction, streaming chat, completion generation, and health checks
    across supported providers (Ollama and Cloudflare Workers AI).
    """
    def __init__(self):
        self._provider: Optional[LLMProvider] = None

    def get_provider(self) -> LLMProvider:
        provider_name = (settings.LLM_PROVIDER or "ollama").lower().strip()
        if provider_name == "cloudflare":
            if not isinstance(self._provider, CloudflareWorkersAIProvider):
                logger.info(f"Initializing CloudflareWorkersAIProvider (model: {settings.CLOUDFLARE_AI_MODEL})")
                self._provider = CloudflareWorkersAIProvider()
        else:
            if not isinstance(self._provider, OllamaProvider):
                logger.info(f"Initializing OllamaProvider (url: {settings.OLLAMA_BASE_URL}, model: {settings.OLLAMA_MODEL})")
                self._provider = OllamaProvider()
        return self._provider

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        provider = self.get_provider()
        async for chunk in provider.stream_chat(messages, **kwargs):
            yield chunk

    async def generate(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any
    ) -> str:
        provider = self.get_provider()
        return await provider.generate(messages, **kwargs)

    async def health_check(self) -> Dict[str, Any]:
        provider = self.get_provider()
        return await provider.health_check()

    async def list_models(self) -> List[str]:
        provider = self.get_provider()
        return await provider.list_models()

# Global singleton instance
intelligence_service = IntelligenceService()

def get_llm_provider() -> LLMProvider:
    """Helper function to get active LLMProvider."""
    return intelligence_service.get_provider()
