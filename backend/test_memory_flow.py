import asyncio
import httpx
import json

async def test_memory_flow():
    base_url = "http://127.0.0.1:8000/api"
    world_id = "world-company"
    person_id = "person-maya"

    print("\n--- 1. Testing Memory Listing ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(f"{base_url}/worlds/{world_id}/memories")
        print(f"Status: {res.status_code}, Found memories: {len(res.json())}")
        for m in res.json():
            print(f" - [{m['scope'].upper()} / {m['type']}] {m['title']}: {m['content']}")

        print("\n--- 2. Testing Memory Search & Retrieval ---")
        search_res = await client.post(
            f"{base_url}/worlds/{world_id}/memories/search?person_id={person_id}",
            json={"query": "furniture products and warranty", "limit": 2}
        )
        print(f"Search results for 'furniture products and warranty':")
        for m in search_res.json():
            print(f" -> {m['content']}")

        print("\n--- 3. Testing Chat with Memory Recall ---")
        chat_res = await client.post(
            f"{base_url}/chat",
            json={
                "world": {"id": world_id, "name": "My Company"},
                "person": {"id": person_id, "name": "Maya", "role": "Lead Developer"},
                "messages": [
                    {"role": "user", "content": "Maya, what products does our company sell?"}
                ]
            }
        )
        print(f"Maya's response (using World Memory):")
        print(f" \"{chat_res.json().get('content')}\"")

        print("\n--- 4. Testing Automated Memory Extraction ---")
        extract_res = await client.post(
            f"{base_url}/worlds/{world_id}/memories/extract",
            json={
                "worldId": world_id,
                "personId": person_id,
                "messages": [
                    {"role": "user", "content": "Our official website launch is scheduled for September 15."},
                    {"role": "assistant", "content": "Got it! I will make sure all payment integrations are tested before September 15."}
                ]
            }
        )
        print(f"Extracted memories: {len(extract_res.json())}")
        for m in extract_res.json():
            print(f" + Stored: [{m['type']}] {m['content']}")

        print("\n--- 5. Testing Memory Conflict & Superseding ---")
        conflict_res = await client.post(
            f"{base_url}/worlds/{world_id}/memories/extract",
            json={
                "worldId": world_id,
                "personId": person_id,
                "messages": [
                    {"role": "user", "content": "Update: the website launch is moved to October 1."},
                    {"role": "assistant", "content": "Understood, I've noted that the launch is now on October 1."}
                ]
            }
        )
        print(f"Conflict resolution extracted: {len(conflict_res.json())}")
        for m in conflict_res.json():
            print(f" + Updated/Active: [{m['type']}] {m['content']}")

        print("\n--- 6. Testing Fresh Conversation Recall from Memory ---")
        # Notice we send only ONE message without any previous chat history!
        fresh_chat = await client.post(
            f"{base_url}/chat",
            json={
                "world": {"id": world_id, "name": "My Company"},
                "person": {"id": person_id, "name": "Maya", "role": "Lead Developer"},
                "messages": [
                    {"role": "user", "content": "When is our website launch?"}
                ]
            }
        )
        print(f"Maya's recall in a fresh conversation (no chat history):")
        print(f" \"{fresh_chat.json().get('content')}\"")

if __name__ == "__main__":
    asyncio.run(test_memory_flow())
