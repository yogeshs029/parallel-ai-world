from fastapi import APIRouter
from typing import List, Dict, Any
from ...services.runtime.repositories import conversation_repository

router = APIRouter()

@router.get("/worlds/{world_id}/people/{person_id}/messages")
async def get_person_messages(world_id: str, person_id: str):
    """Retrieve messages in conversation history including person-initiated ones"""
    return await conversation_repository.list_messages(world_id=world_id, person_id=person_id)

@router.post("/worlds/{world_id}/people/{person_id}/messages")
async def post_person_message(world_id: str, person_id: str, payload: Dict[str, str]):
    role = payload.get("role", "user")
    content = payload.get("content", "")
    return await conversation_repository.append_message(
        world_id=world_id, person_id=person_id, role=role, content=content
    )
