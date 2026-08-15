from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ToolCategory(str, Enum):
    WEB = "WEB"
    FILES = "FILES"
    CODE = "CODE"
    HTTP = "HTTP"
    GIT = "GIT"
    KNOWLEDGE = "KNOWLEDGE"
    WORLD = "WORLD"
    COMMUNICATION = "COMMUNICATION"
    UTILITY = "UTILITY"
    # Future categories (Architecture ready)
    EMAIL = "EMAIL"
    CALENDAR = "CALENDAR"
    GITHUB = "GITHUB"
    DATABASE = "DATABASE"
    BROWSER_AUTOMATION = "BROWSER_AUTOMATION"
    MEDIA = "MEDIA"
    FINANCE = "FINANCE"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ToolRequestStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"

class ApprovalScope(str, Enum):
    ONCE = "once"
    TASK = "task"
    PERSON = "person"
    WORLD = "world"

class ToolDefinition(BaseModel):
    id: str = Field(..., description="Unique tool identifier (e.g. web_search, file_read)")
    name: str = Field(..., description="Human-friendly tool name")
    description: str = Field(..., description="Description of what the tool does")
    category: ToolCategory
    version: str = Field(default="1.0.0")
    inputSchema: Dict[str, Any] = Field(default_factory=dict, description="JSON Schema of tool arguments")
    outputSchema: Dict[str, Any] = Field(default_factory=dict, description="JSON Schema of tool response")
    riskLevel: RiskLevel = Field(default=RiskLevel.LOW)
    capabilities: List[str] = Field(default_factory=list, description="Capabilities required to invoke this tool")
    enabled: bool = Field(default=True)
    timeoutSeconds: int = Field(default=30)

class ToolResult(BaseModel):
    success: bool
    output: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    durationMs: int = Field(default=0)
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ToolRequestCreate(BaseModel):
    worldId: str
    personId: str
    taskId: Optional[str] = None
    toolId: str
    input: Dict[str, Any] = Field(default_factory=dict)

class ToolRequest(BaseModel):
    id: str
    worldId: str
    personId: str
    taskId: Optional[str] = None
    toolId: str
    input: Dict[str, Any] = Field(default_factory=dict)
    status: ToolRequestStatus = Field(default=ToolRequestStatus.REQUESTED)
    riskLevel: RiskLevel = Field(default=RiskLevel.LOW)
    requestedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    result: Optional[ToolResult] = None
    error: Optional[str] = None
    approvalRequestId: Optional[str] = None
    approvalScope: Optional[ApprovalScope] = None

class PersonCapabilities(BaseModel):
    personId: str
    worldId: str
    webSearch: bool = True
    webFetch: bool = True
    fileRead: bool = True
    fileWrite: bool = True
    fileCreateDirectory: bool = True
    fileSearch: bool = True
    codeExecute: bool = False
    codeTest: bool = False
    httpRequest: bool = True
    worldRead: bool = True
    worldUpdate: bool = False
    gitRead: bool = True
    # Approval triggers ("Ask before using")
    askBeforeFileWrite: bool = True
    askBeforeCodeExecute: bool = True
    askBeforeHttpRequest: bool = False
    askBeforeWorldUpdate: bool = True
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class WorldToolPolicy(BaseModel):
    worldId: str
    webToolsEnabled: bool = True
    fileToolsEnabled: bool = True
    codeExecutionEnabled: bool = True
    httpToolsEnabled: bool = True
    gitToolsEnabled: bool = True
    requireApprovalForHighRisk: bool = True
    requireApprovalForCode: bool = True
    requireApprovalForFileWrite: bool = False
    maxToolCallsPerTask: int = 50
    maxCodeExecutionsPerTask: int = 10
    maxExecutionTimeSeconds: int = 30
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ToolAuditLog(BaseModel):
    id: str
    worldId: str
    personId: str
    taskId: Optional[str] = None
    toolId: str
    inputSummary: str
    status: ToolRequestStatus
    riskLevel: RiskLevel
    approvalStatus: Optional[str] = None
    durationMs: int = 0
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
