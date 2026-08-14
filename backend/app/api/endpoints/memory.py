from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from ...schemas.memory import (
    Memory,
    MemoryCreate,
    MemoryUpdate,
    MemorySearchQuery,
    MemoryExtractionRequest,
)
from ...services.memory.repository import memory_repository
from ...services.memory.retriever import memory_retriever
from ...services.memory.extraction import memory_extraction_service

router = APIRouter()

@router.get("/worlds/{world_id}/memories", response_model=List[Memory])
async def list_world_memories(
    world_id: str,
    person_id: Optional[str] = None,
    scope: Optional[str] = None,
):
    """
    List active memories for a given world, optionally filtered by person or scope.
    """
    return await memory_repository.list(
        world_id=world_id,
        person_id=person_id,
        scope=scope, # type: ignore
        is_active=True,
    )

@router.get("/worlds/{world_id}/people/{person_id}/memories", response_model=List[Memory])
async def list_person_memories(world_id: str, person_id: str):
    """
    List memories specifically owned by this person.
    """
    return await memory_repository.list(
        world_id=world_id,
        person_id=person_id,
        scope="person",
        is_active=True,
    )

@router.post("/worlds/{world_id}/memories", response_model=Memory)
async def create_memory(world_id: str, payload: MemoryCreate):
    """
    Manually create a new memory for a world or person.
    """
    payload.worldId = world_id
    return await memory_repository.create(payload)

@router.patch("/worlds/{world_id}/memories/{memory_id}", response_model=Memory)
async def update_memory(world_id: str, memory_id: str, payload: MemoryUpdate):
    """
    Update an existing memory.
    """
    updated = await memory_repository.update(memory_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Memory not found")
    return updated

@router.delete("/worlds/{world_id}/memories/{memory_id}")
async def delete_memory(world_id: str, memory_id: str):
    """
    Permanently delete or forget a memory.
    """
    success = await memory_repository.delete(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "success", "message": "Memory deleted"}

@router.post("/worlds/{world_id}/memories/search", response_model=List[Memory])
async def search_memories(
    world_id: str,
    payload: MemorySearchQuery,
    person_id: Optional[str] = None,
):
    """
    Retrieve memories matching a search query using relevance weighting.
    """
    return await memory_retriever.retrieve(
        world_id=world_id,
        person_id=person_id,
        query=payload.query,
        limit=payload.limit,
    )

@router.post("/worlds/{world_id}/memories/extract", response_model=List[Memory])
async def extract_memories(world_id: str, payload: MemoryExtractionRequest):
    """
    Analyze recent conversation turns and extract high-signal memories.
    """
    return await memory_extraction_service.extract_and_store(
        world_id=world_id,
        person_id=payload.personId,
        messages=payload.messages,
    )

@router.delete("/worlds/{world_id}/people/{person_id}/memories/clear")
async def clear_person_memories(world_id: str, person_id: str):
    """
    Clear all personal memories for a person (without touching world memories or conversation history).
    """
    count = await memory_repository.clear_person(world_id, person_id)
    return {"status": "success", "clearedCount": count}

@router.delete("/worlds/{world_id}/memories/clear")
async def clear_world_memories(world_id: str):
    """
    Clear all shared world memories.
    """
    count = await memory_repository.clear_world(world_id)
    return {"status": "success", "clearedCount": count}
