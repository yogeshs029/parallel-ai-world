from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from ...schemas.communication import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter()

_CONVERSATIONS_DB = {}
_MESSAGES_DB = {}

@router.get("/worlds/{worldId}/conversations", response_model=List[ConversationResponse])
async def get_conversations(worldId: str):
    return [c for c in _CONVERSATIONS_DB.values() if c.get("worldId") == worldId]

@router.get("/worlds/{worldId}/conversations/{conversationId}", response_model=ConversationResponse)
async def get_conversation(worldId: str, conversationId: str):
    if conversationId not in _CONVERSATIONS_DB:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _CONVERSATIONS_DB[conversationId]

@router.post("/worlds/{worldId}/conversations", response_model=ConversationResponse)
async def create_conversation(worldId: str, payload: ConversationCreate):
    conv_id = f"conv-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    record = {
        "id": conv_id,
        "worldId": worldId,
        "type": payload.type,
        "participantIds": payload.participantIds,
        "topic": payload.topic or "Discussion",
        "status": payload.status or "active",
        "summary": payload.summary,
        "lastActivityAt": now,
        "exchangeCount": 0,
        "createdAt": now,
        "lastMessage": None,
    }
    _CONVERSATIONS_DB[conv_id] = record
    return record

@router.get("/conversations/{conversationId}/messages", response_model=List[MessageResponse])
async def get_messages(conversationId: str):
    return [m for m in _MESSAGES_DB.values() if m.get("conversationId") == conversationId]

@router.post("/conversations/{conversationId}/messages", response_model=MessageResponse)
async def send_message(conversationId: str, payload: MessageCreate):
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    msg_record = {
        "id": msg_id,
        "worldId": payload.worldId,
        "conversationId": conversationId,
        "senderPersonId": payload.senderPersonId,
        "recipientPersonId": payload.recipientPersonId,
        "senderName": payload.senderName,
        "senderAvatarEmoji": payload.senderAvatarEmoji,
        "content": payload.content,
        "status": payload.status or "sent",
        "metadata": payload.metadata or {},
        "createdAt": now,
    }
    _MESSAGES_DB[msg_id] = msg_record

    # Update parent conversation
    if conversationId in _CONVERSATIONS_DB:
        conv = _CONVERSATIONS_DB[conversationId]
        conv["lastActivityAt"] = now
        conv["lastMessage"] = msg_record
        conv["exchangeCount"] = conv.get("exchangeCount", 0) + 1
        _CONVERSATIONS_DB[conversationId] = conv

    return msg_record
