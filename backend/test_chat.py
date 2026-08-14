import asyncio
import httpx
import json

async def test_live_chat():
    url = "http://127.0.0.1:8000/api/chat/stream"
    payload = {
        "world": {
            "id": "world-company",
            "name": "My Company",
            "type": "company",
            "description": "Building handcrafted wooden furniture startup and online storefront.",
            "purpose": "Build and grow our furniture business."
        },
        "person": {
            "id": "person-maya",
            "name": "Maya",
            "role": "Lead Developer",
            "description": "Builds and maintains customer-facing web applications.",
            "personality": {
                "traits": ["Curious", "Analytical", "Proactive"],
                "description": "Maya loves clean software design and problem solving.",
                "communicationStyle": ["Analytical", "Friendly"]
            },
            "responsibilities": ["Design & build the primary ecommerce web app", "Code quality"],
            "skills": ["React", "TypeScript", "Tailwind CSS"],
            "intelligence": {
                "enabled": True,
                "thinkingStyle": "Analytical",
                "communicationStyle": ["Friendly", "Analytical"],
                "initiativeLevel": "Suggest things",
                "customInstructions": "Keep responses helpful, natural, and concise."
            }
        },
        "messages": [
            {
                "role": "user",
                "content": "Hey Maya, how is the website homepage coming along?"
            }
        ]
    }

    print("Connecting to FastAPI -> Ollama (Streaming)...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, json=payload) as response:
            print(f"Status Code: {response.status_code}")
            accumulated = []
            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data:"):
                    raw = line.replace("data:", "").strip()
                    if raw:
                        try:
                            parsed = json.loads(raw)
                            token = parsed.get("token", "")
                            if token:
                                print(token, end="", flush=True)
                                accumulated.append(token)
                            if parsed.get("done"):
                                print("\n[STREAM COMPLETE]")
                                break
                        except Exception as e:
                            print(f"\nParse err: {e}")
            
            print(f"\nTotal characters received: {len(''.join(accumulated))}")

if __name__ == "__main__":
    asyncio.run(test_live_chat())
