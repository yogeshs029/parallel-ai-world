from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

MemoryScope = Literal["person", "world", "conversation"]
MemoryType = Literal[
    "fact",
    "preference",
    "goal",
    "responsibility",
    "relationship",
    "event",
    "decision",
    "knowledge",
]
MemoryImportance = Literal["low", "medium", "high", "critical"]
MemorySource = Literal["manual", "conversation", "event"]

class Memory(BaseModel):
    id: str = Field(..., description="Unique memory ID")
    worldId: str = Field(..., description="Target world ID")
    personId: Optional[str] = Field(None, description="Optional target person ID (for personal memories)")
    scope: MemoryScope = Field("world", description="Memory ownership scope: person, world, or conversation")
    type: MemoryType = Field("fact", description="Category of the memory")
    title: Optional[str] = Field(None, description="Short human-friendly title")
    content: str = Field(..., description="The remembered fact or statement")
    importance: MemoryImportance = Field("medium", description="Importance rating: low, medium, high, critical")
    confidence: float = Field(1.0, description="Confidence score from 0.0 to 1.0")
    source: MemorySource = Field("manual", description="Source of memory: manual, conversation, or event")
    isActive: bool = Field(True, description="Whether memory is active or superseded")
    supersededById: Optional[str] = Field(None, description="ID of newer memory that superseded this one")
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    lastAccessedAt: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MemoryCreate(BaseModel):
    worldId: str
    personId: Optional[str] = None
    scope: MemoryScope = "world"
    type: MemoryType = "fact"
    title: Optional[str] = None
    content: str
    importance: MemoryImportance = "medium"
    confidence: float = 1.0
    source: MemorySource = "manual"
    metadata: Optional[Dict[str, Any]] = None

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    scope: Optional[MemoryScope] = None
    type: Optional[MemoryType] = None
    importance: Optional[MemoryImportance] = None
    isActive: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class MemorySearchQuery(BaseModel):
    query: str
    scope: Optional[MemoryScope] = None
    type: Optional[MemoryType] = None
    limit: int = 6

class ExtractedMemoryCandidate(BaseModel):
    scope: MemoryScope = "world"
    type: MemoryType = "fact"
    title: Optional[str] = None
    content: str
    importance: MemoryImportance = "medium"
    confidence: float = 0.9

    @field_validator("scope", mode="before")
    @classmethod
    def normalize_scope(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "world"
        v_clean = v.lower().strip()
        if v_clean in ("person", "user", "individual", "self", "character"):
            return "person"
        return "world"

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "fact"
        v_clean = v.lower().strip()
        mapping = {
            "fact": "fact",
            "preference": "preference",
            "style": "preference",
            "goal": "goal",
            "target": "goal",
            "objective": "goal",
            "responsibility": "responsibility",
            "role": "responsibility",
            "task": "responsibility",
            "event": "event",
            "milestone": "event",
            "timeline": "event",
            "schedule": "event",
            "date": "event",
            "launch": "event",
            "decision": "decision",
            "choice": "decision",
            "rule": "decision",
            "knowledge": "knowledge",
            "product": "knowledge",
            "feature": "knowledge",
            "info": "knowledge",
            "information": "knowledge",
            "relationship": "relationship",
        }
        return mapping.get(v_clean, "fact")

    @field_validator("importance", mode="before")
    @classmethod
    def normalize_importance(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "medium"
        v_clean = v.lower().strip()
        if v_clean in ("critical", "urgent", "essential"):
            return "critical"
        if v_clean in ("high", "important"):
            return "high"
        if v_clean in ("low", "minor", "trivial"):
            return "low"
        return "medium"

class MemoryExtractionRequest(BaseModel):
    worldId: str
    personId: Optional[str] = None
    messages: List[Dict[str, str]]
