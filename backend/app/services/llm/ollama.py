import json
import logging
from typing import AsyncGenerator, Dict, List, Any
import httpx

from .base import LLMProvider
from ...core.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = None, default_model: str = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or settings.OLLAMA_MODEL

    async def health_check(self) -> Dict[str, Any]:
        """
        Check if Ollama service is reachable at base_url.
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    # Check if our configured model is in the list
                    has_model = any(
                        self.default_model in m or m.startswith(self.default_model.split(":")[0])
                        for m in models
                    )
                    return {
                        "available": True,
                        "provider": "ollama",
                        "configured_model": self.default_model,
                        "model_ready": has_model or len(models) > 0,
                        "available_models": models,
                    }
                return {
                    "available": False,
                    "provider": "ollama",
                    "error": f"HTTP {resp.status_code}",
                }
        except httpx.ConnectError:
            return {
                "available": False,
                "provider": "ollama",
                "error": "Cannot connect to Ollama. Ensure Ollama service is running.",
            }
        except Exception as e:
            return {
                "available": False,
                "provider": "ollama",
                "error": str(e),
            }

    async def list_models(self) -> List[str]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    return [m.get("name") for m in data.get("models", [])]
        except Exception as e:
            logger.warning(f"Could not list Ollama models: {e}")
        return []

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": 0.75,
                "top_p": 0.9,
                "repeat_penalty": 1.15,
                "num_predict": 120,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                ) as response:
                    if response.status_code != 200:
                        err_body = await response.aread()
                        logger.error(f"Ollama returned error: {response.status_code} - {err_body.decode('utf-8')}")
                        yield f"I'm having trouble thinking right now (Error {response.status_code})."
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk_data = json.loads(line)
                            msg = chunk_data.get("message", {})
                            content = msg.get("content", "")
                            if content:
                                yield content
                            if chunk_data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except httpx.ConnectError:
            logger.warning(f"Connection to Ollama at {self.base_url} failed.")
            yield "My intelligence is currently unavailable. Please make sure the local Ollama service is running."
        except httpx.TimeoutException:
            logger.warning("Ollama request timed out.")
            yield "I took too long to think about that. Please try asking again."
        except Exception as e:
            logger.error(f"Unexpected error in OllamaProvider: {e}")
            yield "I ran into an unexpected issue while thinking. Please try again."

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        **kwargs: Any
    ) -> str:
        collected = []
        async for chunk in self.stream_chat(messages, model=model, **kwargs):
            collected.append(chunk)
        return "".join(collected)
