from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MessageBase(BaseModel):
    worldId: str
    conversationId: str
    senderPersonId: str
    recipientPersonId: str
    senderName: Optional[str] = None
    senderAvatarEmoji: Optional[str] = None
    content: str
    status: str = "sent"
    metadata: Optional[Dict[str, Any]] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    createdAt: str

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    worldId: str
    type: str = "DIRECT"
    participantIds: List[str]
    topic: Optional[str] = "Discussion"
    status: str = "active"
    summary: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: str
    lastActivityAt: str
    exchangeCount: int = 0
    createdAt: str
    lastMessage: Optional[MessageResponse] = None

    class Config:
        from_attributes = True
