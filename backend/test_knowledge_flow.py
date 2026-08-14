import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def test_knowledge_flow():
    base_url = "http://127.0.0.1:8000/api"
    world_id = "world-company"
    person_id = "person-maya"

    print("\n--- 1. Testing Knowledge Listing ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(f"{base_url}/worlds/{world_id}/knowledge?person_id={person_id}")
        print(f"Status: {res.status_code}, Found sources: {len(res.json())}")
        for s in res.json():
            print(f" - [{s['type'].upper()} / {s['visibility']}] {s['name']} ({s['chunkCount']} chunks)")

        print("\n--- 2. Testing Knowledge Search & Relevance Retrieval ---")
        search_res = await client.post(
            f"{base_url}/worlds/{world_id}/knowledge/search?person_id={person_id}",
            json={"query": "handmade dining table price and seating", "limit": 2}
        )
        print(f"Search results for 'handmade dining table price and seating':")
        for chunk in search_res.json():
            print(f" -> [{chunk['sourceName']}] {chunk['content'][:120]}...")

        print("\n--- 3. Testing Chat RAG: Product Catalog Pricing & Source Attribution ---")
        chat_res_1 = await client.post(
            f"{base_url}/chat",
            json={
                "world": {"id": world_id, "name": "My Company"},
                "person": {"id": person_id, "name": "Maya", "role": "Lead Developer"},
                "messages": [
                    {"role": "user", "content": "How much does the premium handmade dining table cost?"}
                ]
            }
        )
        print(f"Maya's response (grounded on Product Catalog):")
        print(f" \"{chat_res_1.json().get('content')}\"")

        print("\n--- 4. Testing Chat RAG: Company Mission Knowledge ---")
        chat_res_2 = await client.post(
            f"{base_url}/chat",
            json={
                "world": {"id": world_id, "name": "My Company"},
                "person": {"id": person_id, "name": "Maya", "role": "Lead Developer"},
                "messages": [
                    {"role": "user", "content": "What is our company's mission and environmental promise?"}
                ]
            }
        )
        print(f"Maya's response (grounded on Company Mission):")
        print(f" \"{chat_res_2.json().get('content')}\"")

        print("\n--- 5. Testing Chat RAG: Maya's Private Developer Guide ---")
        chat_res_3 = await client.post(
            f"{base_url}/chat",
            json={
                "world": {"id": world_id, "name": "My Company"},
                "person": {"id": person_id, "name": "Maya", "role": "Lead Developer"},
                "messages": [
                    {"role": "user", "content": "Maya, what frontend stack and tools do you use for our application?"}
                ]
            }
        )
        print(f"Maya's response (grounded on Developer Guide):")
        print(f" \"{chat_res_3.json().get('content')}\"")

        print("\n--- 6. Testing Privacy Boundary: Person Knowledge Separation ---")
        # Ask as 'Priya' (person-priya), who does NOT own Maya's private Developer Guide
        search_priya = await client.post(
            f"{base_url}/worlds/{world_id}/knowledge/search?person_id=person-priya",
            json={"query": "Maya Developer Guide React TypeScript", "limit": 3}
        )
        priya_chunks = search_priya.json()
        has_maya_guide = any("Maya" in c["sourceName"] or "Developer Guide" in c["sourceName"] for c in priya_chunks)
        print(f"Priya search for Maya's guide: Found {len(priya_chunks)} chunks, has Maya private guide: {has_maya_guide}")
        assert not has_maya_guide, "Security violation: Maya's private knowledge was leaked to Priya!"
        print(" -> Privacy boundary verified: Priya cannot see Maya's private knowledge.")

if __name__ == "__main__":
    asyncio.run(test_knowledge_flow())
