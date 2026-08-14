from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

# ----------------------------------------------------
# 1. Event Models
# ----------------------------------------------------
EventType = Literal[
    "WORLD_CREATED",
    "PERSON_CREATED",
    "TASK_CREATED",
    "TASK_ASSIGNED",
    "TASK_STARTED",
    "TASK_COMPLETED",
    "TASK_FAILED",
    "MESSAGE_RECEIVED",
    "MESSAGE_SENT",
    "SCHEDULE_TRIGGERED",
    "WORLD_CHANGED",
    "PERSON_WOKE",
    "NOTIFICATION_CREATED",
    "APPROVAL_REQUESTED",
    "APPROVAL_RESOLVED",
]

EventStatus = Literal["pending", "processing", "processed", "failed"]

class RuntimeEvent(BaseModel):
    id: str
    worldId: str
    personId: Optional[str] = None
    type: EventType
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: EventStatus = "pending"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    processedAt: Optional[str] = None
    error: Optional[str] = None

class EventCreate(BaseModel):
    worldId: str
    personId: Optional[str] = None
    type: EventType
    payload: Dict[str, Any] = Field(default_factory=dict)

# ----------------------------------------------------
# 2. Task Models
# ----------------------------------------------------
TaskStatus = Literal["pending", "running", "waiting", "completed", "failed", "cancelled"]
TaskPriority = Literal["low", "medium", "high", "urgent"]

class RuntimeTask(BaseModel):
    id: str
    worldId: str
    assignedPersonId: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: TaskStatus = "pending"
    priority: TaskPriority = "medium"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    result: Optional[str] = None
    createdBy: Optional[str] = "user"
    permissionsRequired: List[str] = Field(default_factory=list)
    retryCount: int = 0
    maxRetries: int = 2
    lastError: Optional[str] = None
    notifyOnCompletion: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TaskCreate(BaseModel):
    worldId: str
    assignedPersonId: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Optional[TaskPriority] = "medium"
    notifyOnCompletion: Optional[bool] = True
    metadata: Optional[Dict[str, Any]] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignedPersonId: Optional[str] = None
    result: Optional[str] = None
    completedAt: Optional[str] = None
    notifyOnCompletion: Optional[bool] = None

# ----------------------------------------------------
# 3. Notification Models
# ----------------------------------------------------
NotificationType = Literal[
    "task_completed",
    "person_message",
    "approval_required",
    "world_update",
    "system",
]

class Notification(BaseModel):
    id: str
    userId: str = "user-default"
    worldId: str
    personId: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    read: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    relatedEntityId: Optional[str] = None
    actionUrl: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class NotificationCreate(BaseModel):
    userId: Optional[str] = "user-default"
    worldId: str
    personId: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    relatedEntityId: Optional[str] = None
    actionUrl: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ----------------------------------------------------
# 4. Permission Models
# ----------------------------------------------------
class PersonPermissions(BaseModel):
    personId: str
    worldId: str
    worldView: bool = True
    worldEdit: bool = False
    peopleView: bool = True
    peopleCreate: bool = False
    peopleEdit: bool = False
    taskCreate: bool = True
    taskEdit: bool = True
    knowledgeView: bool = True
    knowledgeCreate: bool = True
    knowledgeEdit: bool = False
    projectCreate: bool = True
    projectEdit: bool = False
    messageUser: bool = True
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class PersonPermissionsUpdate(BaseModel):
    worldView: Optional[bool] = None
    worldEdit: Optional[bool] = None
    peopleView: Optional[bool] = None
    peopleCreate: Optional[bool] = None
    peopleEdit: Optional[bool] = None
    taskCreate: Optional[bool] = None
    taskEdit: Optional[bool] = None
    knowledgeView: Optional[bool] = None
    knowledgeCreate: Optional[bool] = None
    knowledgeEdit: Optional[bool] = None
    projectCreate: Optional[bool] = None
    projectEdit: Optional[bool] = None
    messageUser: Optional[bool] = None

# ----------------------------------------------------
# 5. World Action & Approval Models
# ----------------------------------------------------
WorldActionType = Literal[
    "CREATE_TASK",
    "UPDATE_TASK",
    "CREATE_PROJECT",
    "UPDATE_PROJECT",
    "ADD_KNOWLEDGE",
    "UPDATE_KNOWLEDGE",
    "CREATE_PERSON",
    "UPDATE_PERSON",
    "UPDATE_WORLD",
    "MESSAGE_USER",
]

ApprovalStatus = Literal["pending", "approved", "denied"]

class WorldAction(BaseModel):
    id: str
    actorPersonId: str
    worldId: str
    actionType: WorldActionType
    target: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: Literal["proposed", "approved", "denied", "executed", "failed"] = "proposed"
    requiresApproval: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ApprovalRequest(BaseModel):
    id: str
    worldId: str
    requesterPersonId: str
    requesterName: str
    requesterEmoji: Optional[str] = "👤"
    actionType: WorldActionType
    target: str
    title: str
    reason: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: ApprovalStatus = "pending"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    resolvedAt: Optional[str] = None
    resolutionComment: Optional[str] = None

class ApprovalCreate(BaseModel):
    worldId: str
    requesterPersonId: str
    requesterName: str
    requesterEmoji: Optional[str] = "👤"
    actionType: WorldActionType
    target: str
    title: str
    reason: str
    payload: Dict[str, Any] = Field(default_factory=dict)

# ----------------------------------------------------
# 6. Schedule Models
# ----------------------------------------------------
ScheduleFrequency = Literal["once", "daily", "weekly", "interval"]

class RuntimeSchedule(BaseModel):
    id: str
    worldId: str
    personId: Optional[str] = None
    title: str
    frequency: ScheduleFrequency = "daily"
    targetTime: Optional[str] = "09:00" # HH:MM for daily/weekly
    dayOfWeek: Optional[int] = None # 0=Monday for weekly
    intervalMinutes: Optional[int] = None # For interval
    actionType: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    nextRunAt: str
    lastRunAt: Optional[str] = None
    enabled: bool = True
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ----------------------------------------------------
# 7. Runtime Diagnostic Status
# ----------------------------------------------------
class RuntimeStatus(BaseModel):
    isRunning: bool
    workerStatus: str
    activeWorldsCount: int
    pendingTasksCount: int
    pendingEventsCount: int
    pendingApprovalsCount: int
    unreadNotificationsCount: int
    lastHeartbeat: str
    processedTasksCount: int
    processedEventsCount: int
