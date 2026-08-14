import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.config import settings
from backend.app.services.llm.service import intelligence_service
from backend.app.services.llm.ollama import OllamaProvider
from backend.app.services.llm.cloudflare import CloudflareWorkersAIProvider

sys.stdout.reconfigure(encoding='utf-8')

async def test_providers():
    print("\n--- 1. Testing Ollama Provider ---")
    ollama = OllamaProvider()
    health_ollama = await ollama.health_check()
    print(f"Ollama Health Check: {health_ollama}")
    models_ollama = await ollama.list_models()
    print(f"Ollama Available Models: {models_ollama}")

    print("\n--- 2. Testing Cloudflare Workers AI Provider ---")
    cf_provider = CloudflareWorkersAIProvider()
    health_cf = await cf_provider.health_check()
    print(f"Cloudflare Health Check: {health_cf}")
    models_cf = await cf_provider.list_models()
    print(f"Cloudflare Supported Models ({len(models_cf)}): {models_cf}")

    print("\n--- 3. Testing Intelligence Service Provider Switching ---")
    # Test Ollama mode
    settings.LLM_PROVIDER = "ollama"
    intelligence_service._provider = None
    provider = intelligence_service.get_provider()
    assert isinstance(provider, OllamaProvider), f"Expected OllamaProvider, got {type(provider)}"
    print(f"Active Provider (LLM_PROVIDER=ollama): {type(provider).__name__}")

    # Test Cloudflare mode
    settings.LLM_PROVIDER = "cloudflare"
    intelligence_service._provider = None
    provider_cf = intelligence_service.get_provider()
    assert isinstance(provider_cf, CloudflareWorkersAIProvider), f"Expected CloudflareWorkersAIProvider, got {type(provider_cf)}"
    print(f"Active Provider (LLM_PROVIDER=cloudflare): {type(provider_cf).__name__}")

    print("\n--- 4. Testing Cloudflare Fallback Streaming ---")
    # Test streaming without credentials in python backend returns helpful cloud explanation
    tokens = []
    async for token in provider_cf.stream_chat([{"role": "user", "content": "Hi Maya"}]):
        tokens.append(token)
    stream_output = "".join(tokens)
    print(f"Cloudflare Stream Output:\n{stream_output}")
    assert len(stream_output) > 0, "No tokens returned from Cloudflare stream!"

    # Restore default
    settings.LLM_PROVIDER = "ollama"
    intelligence_service._provider = None

    print("\n=== ALL LLM PROVIDER TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(test_providers())
