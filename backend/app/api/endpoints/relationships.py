from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from ...schemas.relationship import RelationshipCreate, RelationshipUpdate, RelationshipResponse

router = APIRouter()

# In-memory relationship store (synced via API & local state)
_RELATIONSHIPS_DB = {}

@router.get("/worlds/{worldId}/relationships", response_model=List[RelationshipResponse])
async def get_world_relationships(worldId: str):
    return [r for r in _RELATIONSHIPS_DB.values() if r.get("worldId") == worldId]

@router.post("/worlds/{worldId}/relationships", response_model=RelationshipResponse)
async def create_relationship(worldId: str, payload: RelationshipCreate):
    rel_id = f"rel-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    record = {
        "id": rel_id,
        "worldId": worldId,
        "fromPersonId": payload.fromPersonId,
        "toPersonId": payload.toPersonId,
        "type": payload.type,
        "strength": payload.strength,
        "status": payload.status,
        "description": payload.description,
        "createdAt": now,
        "updatedAt": now,
    }
    _RELATIONSHIPS_DB[rel_id] = record
    return record

@router.patch("/worlds/{worldId}/relationships/{relationshipId}", response_model=RelationshipResponse)
async def update_relationship(worldId: str, relationshipId: str, payload: RelationshipUpdate):
    if relationshipId not in _RELATIONSHIPS_DB:
        raise HTTPException(status_code=404, detail="Relationship not found")
    record = _RELATIONSHIPS_DB[relationshipId]
    updates = payload.dict(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            record[k] = v
    record["updatedAt"] = datetime.utcnow().isoformat()
    _RELATIONSHIPS_DB[relationshipId] = record
    return record

@router.delete("/worlds/{worldId}/relationships/{relationshipId}")
async def delete_relationship(worldId: str, relationshipId: str):
    if relationshipId in _RELATIONSHIPS_DB:
        _RELATIONSHIPS_DB[relationshipId]["status"] = "ended"
        _RELATIONSHIPS_DB[relationshipId]["updatedAt"] = datetime.utcnow().isoformat()
    return {"status": "success"}
