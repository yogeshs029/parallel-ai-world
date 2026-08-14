from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Any

class LLMProvider(ABC):
    """
    Abstract LLM Provider interface.
    Decouples application logic from specific model providers (Ollama, OpenAI, Anthropic, etc.)
    """

    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat tokens from the LLM provider.
        Yields incremental text chunks.
        """
        pass

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        **kwargs: Any
    ) -> str:
        """
        Generate a complete response from the LLM provider.
        """
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the LLM provider is reachable and healthy.
        Returns a dict with 'available' (bool), 'model' (str), and optional details.
        """
        pass

    @abstractmethod
    async def list_models(self) -> List[str]:
        """
        List available models on the provider.
        """
        pass
