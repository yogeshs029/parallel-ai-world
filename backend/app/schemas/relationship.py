from pydantic import BaseModel, Field
from typing import Optional

class RelationshipBase(BaseModel):
    worldId: str
    fromPersonId: str
    toPersonId: str
    type: str = "colleague"
    strength: str = "normal"
    status: str = "active"
    description: Optional[str] = None

class RelationshipCreate(RelationshipBase):
    pass

class RelationshipUpdate(BaseModel):
    type: Optional[str] = None
    strength: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

class RelationshipResponse(RelationshipBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True
