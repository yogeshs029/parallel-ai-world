from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

KnowledgeType = Literal["document", "text", "url", "note"]
KnowledgeStatus = Literal["processing", "ready", "failed"]
KnowledgeVisibility = Literal["world", "person"]

class KnowledgeChunk(BaseModel):
    id: str = Field(..., description="Unique chunk ID")
    knowledgeSourceId: str = Field(..., description="Parent KnowledgeSource ID")
    worldId: str = Field(..., description="Associated world ID")
    personId: Optional[str] = Field(None, description="Associated person ID if person-scoped")
    visibility: KnowledgeVisibility = Field("world", description="Visibility scope: world or person")
    sourceName: str = Field(..., description="Name/Title of parent knowledge source")
    sourceType: KnowledgeType = Field("document", description="Type of parent knowledge source")
    content: str = Field(..., description="Cleaned chunk text content")
    chunkIndex: int = Field(0, description="Sequential chunk order index")
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeSource(BaseModel):
    id: str = Field(..., description="Unique knowledge source ID")
    worldId: str = Field(..., description="Associated world ID")
    personId: Optional[str] = Field(None, description="Optional owner person ID")
    name: str = Field(..., description="Human-friendly title or document filename")
    description: Optional[str] = Field(None, description="Summary or description of the knowledge source")
    type: KnowledgeType = Field("document", description="Source format: document, note, url, text")
    source: str = Field(..., description="Original source identifier: filename, note, or URL")
    status: KnowledgeStatus = Field("ready", description="Processing state: processing, ready, failed")
    size: Optional[int] = Field(None, description="File size in bytes if applicable")
    mimeType: Optional[str] = Field(None, description="MIME type if document")
    visibility: KnowledgeVisibility = Field("world", description="Visibility: world or person")
    extractedText: Optional[str] = Field(None, description="Full extracted plain text")
    chunkCount: int = Field(0, description="Number of parsed chunks")
    createdBy: Optional[str] = Field(None, description="User or agent who added this knowledge")
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeSourceCreate(BaseModel):
    worldId: str
    personId: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: KnowledgeType = "document"
    source: str
    visibility: KnowledgeVisibility = "world"
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeNoteCreate(BaseModel):
    worldId: str
    personId: Optional[str] = None
    title: str
    content: str
    description: Optional[str] = None
    visibility: KnowledgeVisibility = "world"

class KnowledgeUrlCreate(BaseModel):
    worldId: str
    personId: Optional[str] = None
    url: str
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: KnowledgeVisibility = "world"

class KnowledgeSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[KnowledgeVisibility] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeSearchQuery(BaseModel):
    query: str
    type: Optional[KnowledgeType] = None
    limit: int = 5

class RetrievedKnowledgeChunk(BaseModel):
    chunkId: str
    sourceId: str
    sourceName: str
    sourceType: KnowledgeType
    visibility: KnowledgeVisibility
    content: str
    score: float
