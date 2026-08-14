from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class PlanStepSchema(BaseModel):
    id: str
    planId: str
    goalId: str
    title: str
    description: str = ""
    ownerPersonId: str
    ownerPersonName: Optional[str] = None
    ownerPersonEmoji: Optional[str] = None
    status: str = "pending"
    priority: str = "normal"
    dependencies: List[str] = []
    order: int = 0
    taskId: Optional[str] = None
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None

class PlanStepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ownerPersonId: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dependencies: Optional[List[str]] = None
    order: Optional[int] = None
    completedAt: Optional[str] = None

class PlanCreate(BaseModel):
    goalId: str
    title: str
    description: str = ""
    steps: List[PlanStepSchema]

class PlanResponse(BaseModel):
    id: str
    goalId: str
    title: str
    description: str
    status: str
    version: int
    steps: List[PlanStepSchema]
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True

class PlanRevisionCreate(BaseModel):
    reason: str
    changes: Dict[str, Any]
    createdByPersonId: str

class PlanRevisionResponse(BaseModel):
    id: str
    planId: str
    reason: str
    changes: Dict[str, Any]
    createdByPersonId: str
    status: str
    createdAt: str

    class Config:
        from_attributes = True
