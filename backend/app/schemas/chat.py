from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class ChatMessage(BaseModel):
    role: str = Field(..., description="Message author role: user, assistant, or system")
    content: str = Field(..., description="Message text content")

class WorldContext(BaseModel):
    id: Optional[str] = None
    name: str = "World"
    type: Optional[str] = "custom"
    description: Optional[str] = None
    purpose: Optional[str] = None

class PersonPersonalityContext(BaseModel):
    traits: Optional[List[str]] = None
    description: Optional[str] = None
    communicationStyle: Optional[List[str]] = None

class PersonIntelligenceContext(BaseModel):
    enabled: bool = True
    thinkingStyle: Optional[str] = "Balanced"
    communicationStyle: Optional[List[str]] = None
    initiativeLevel: Optional[str] = "Suggest things"
    customInstructions: Optional[str] = None

class PersonContext(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    description: Optional[str] = None
    personality: Optional[PersonPersonalityContext] = None
    responsibilities: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    intelligence: Optional[PersonIntelligenceContext] = None

class ChatStreamRequest(BaseModel):
    world: WorldContext
    person: PersonContext
    messages: List[ChatMessage]
