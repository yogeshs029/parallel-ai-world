from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class GoalBase(BaseModel):
    worldId: str
    ownerPersonId: str
    ownerPersonName: Optional[str] = None
    ownerPersonEmoji: Optional[str] = None
    createdBy: str = "user"
    title: str
    description: str = ""
    type: str = "Project"
    status: str = "draft"
    priority: str = "normal"
    progress: float = 0
    targetDate: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[float] = None
    targetDate: Optional[str] = None
    ownerPersonId: Optional[str] = None
    activePlanId: Optional[str] = None
    summary: Optional[str] = None
    completedAt: Optional[str] = None

class GoalResponse(GoalBase):
    id: str
    activePlanId: Optional[str] = None
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None

    class Config:
        from_attributes = True
