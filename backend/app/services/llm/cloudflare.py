import json
import logging
from typing import AsyncGenerator, Dict, List, Any, Optional
import httpx

from .base import LLMProvider
from ...core.config import settings

logger = logging.getLogger(__name__)

# Cloudflare Workers AI supported free/standard models
SUPPORTED_CF_MODELS = [
    "@cf/meta/llama-3.1-8b-instruct",
    "@cf/meta/llama-3-8b-instruct",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "@cf/qwen/qwen1.5-7b-chat-awq",
]

class CloudflareWorkersAIProvider(LLMProvider):
    """
    Cloudflare Workers AI LLM Provider.
    Calls Cloudflare Workers AI via REST API (when executed in Python backend)
    or interacts with the configured Cloudflare Workers AI environment.
    """
    def __init__(
        self,
        account_id: Optional[str] = None,
        api_token: Optional[str] = None,
        default_model: Optional[str] = None,
    ):
        self.account_id = account_id or settings.CLOUDFLARE_ACCOUNT_ID
        self.api_token = api_token or settings.CLOUDFLARE_API_TOKEN
        self.default_model = default_model or settings.CLOUDFLARE_AI_MODEL

    async def health_check(self) -> Dict[str, Any]:
        """
        Check if Cloudflare Workers AI provider is configured.
        """
        # If running inside a Cloudflare Worker, the binding is present directly.
        # When running in Python backend:
        is_configured = bool(self.account_id and self.api_token) or bool(self.default_model)
        return {
            "available": is_configured,
            "provider": "cloudflare",
            "configured_model": self.default_model,
            "model_ready": True,
            "available_models": SUPPORTED_CF_MODELS,
            "note": "Cloudflare Workers AI handles production cloud inference.",
        }

    async def list_models(self) -> List[str]:
        return list(SUPPORTED_CF_MODELS)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        target_model = model or self.default_model

        # If Cloudflare REST credentials are not provided in Python backend, return a clean message
        if not self.account_id or not self.api_token:
            logger.info("Cloudflare credentials not in Python backend; Cloudflare Workers handles production inference.")
            yield f"Hello! In production, Cloudflare Workers AI ({target_model}) handles this inference seamlessly. In local development, please set LLM_PROVIDER=ollama or configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your .env file."
            return

        endpoint = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{target_model}"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messages": messages,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", endpoint, json=payload, headers=headers) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        logger.error(f"Cloudflare Workers AI returned error {response.status_code}: {err_text.decode('utf-8', errors='ignore')}")
                        yield "Maya's intelligence is temporarily unavailable. Please try again."
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        # Cloudflare Workers AI streams lines starting with 'data: '
                        if line.startswith("data:"):
                            json_str = line[5:].strip()
                            if json_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(json_str)
                                response_text = chunk.get("response", "")
                                if response_text:
                                    yield response_text
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError:
            logger.warning("Could not connect to Cloudflare Workers AI endpoint.")
            yield "Maya's intelligence is temporarily unavailable. Please try again."
        except httpx.TimeoutException:
            logger.warning("Cloudflare Workers AI request timed out.")
            yield "The response took too long. Please try asking again."
        except Exception as e:
            logger.error(f"CloudflareWorkersAIProvider error: {e}")
            yield "Maya's intelligence is temporarily unavailable. Please try again."

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs: Any
    ) -> str:
        collected = []
        async for chunk in self.stream_chat(messages, model=model, **kwargs):
            collected.append(chunk)
        return "".join(collected)
