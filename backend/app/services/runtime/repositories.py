import uuid
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...schemas.runtime import (
    RuntimeTask,
    TaskCreate,
    TaskUpdate,
    RuntimeEvent,
    EventCreate,
    Notification,
    NotificationCreate,
    PersonPermissions,
    PersonPermissionsUpdate,
    ApprovalRequest,
    ApprovalCreate,
    RuntimeSchedule,
)

# ====================================================
# 1. TASK REPOSITORY
# ====================================================
class TaskRepository(ABC):
    @abstractmethod
    async def list_tasks(
        self,
        world_id: Optional[str] = None,
        person_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[RuntimeTask]:
        pass

    @abstractmethod
    async def get_task(self, task_id: str) -> Optional[RuntimeTask]:
        pass

    @abstractmethod
    async def create_task(self, task: TaskCreate) -> RuntimeTask:
        pass

    @abstractmethod
    async def update_task(self, task_id: str, updates: TaskUpdate) -> Optional[RuntimeTask]:
        pass

    @abstractmethod
    async def delete_task(self, task_id: str) -> bool:
        pass

    @abstractmethod
    async def get_next_pending_task(self) -> Optional[RuntimeTask]:
        pass

class InMemoryTaskRepository(TaskRepository):
    def __init__(self):
        self._tasks: Dict[str, RuntimeTask] = {}
        self._seed_tasks()

    def _seed_tasks(self):
        seed_items = [
            RuntimeTask(
                id="task-seed-1",
                worldId="world-company",
                assignedPersonId="person-maya",
                title="Prepare a website improvement plan",
                description="Review current application UX, responsive layouts, and outline high-impact enhancements.",
                status="completed",
                priority="high",
                result="Analyzed frontend component architecture. Recommend upgrading mobile drawer responsiveness and adding real-time task completion toasts.",
                completedAt=datetime.utcnow().isoformat(),
                startedAt=datetime.utcnow().isoformat(),
            ),
            RuntimeTask(
                id="task-seed-2",
                worldId="world-company",
                assignedPersonId="person-priya",
                title="Competitor pricing benchmark",
                description="Compare 2026 furniture catalog rates against contemporary boutique manufacturers.",
                status="completed",
                priority="medium",
                result="Benchmarked 3 direct competitors. Our solid teakwood pricing at ₹24,999 is 18% below market average while maintaining 10-year craftsmanship warranty.",
                completedAt=datetime.utcnow().isoformat(),
                startedAt=datetime.utcnow().isoformat(),
            ),
        ]
        for t in seed_items:
            self._tasks[t.id] = t

    async def list_tasks(
        self,
        world_id: Optional[str] = None,
        person_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[RuntimeTask]:
        results = list(self._tasks.values())
        if world_id:
            results = [t for t in results if t.worldId == world_id]
        if person_id:
            results = [t for t in results if t.assignedPersonId == person_id]
        if status:
            results = [t for t in results if t.status == status]
        return sorted(results, key=lambda t: t.createdAt, reverse=True)

    async def get_task(self, task_id: str) -> Optional[RuntimeTask]:
        return self._tasks.get(task_id)

    async def create_task(self, task: TaskCreate) -> RuntimeTask:
        new_task = RuntimeTask(
            id=f"task-{uuid.uuid4().hex[:8]}",
            worldId=task.worldId,
            assignedPersonId=task.assignedPersonId,
            title=task.title,
            description=task.description,
            priority=task.priority or "medium",
            notifyOnCompletion=task.notifyOnCompletion if task.notifyOnCompletion is not None else True,
            metadata=task.metadata or {},
        )
        self._tasks[new_task.id] = new_task
        return new_task

    async def update_task(self, task_id: str, updates: TaskUpdate) -> Optional[RuntimeTask]:
        t = self._tasks.get(task_id)
        if not t:
            return None
        data = t.model_dump()
        update_data = updates.model_dump(exclude_unset=True)
        data.update(update_data)
        updated = RuntimeTask(**data)
        self._tasks[task_id] = updated
        return updated

    async def delete_task(self, task_id: str) -> bool:
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False

    async def get_next_pending_task(self) -> Optional[RuntimeTask]:
        for t in self._tasks.values():
            if t.status == "pending":
                return t
        return None

# ====================================================
# 2. EVENT REPOSITORY
# ====================================================
class EventRepository(ABC):
    @abstractmethod
    async def list_events(
        self, world_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50
    ) -> List[RuntimeEvent]:
        pass

    @abstractmethod
    async def create_event(self, event: EventCreate) -> RuntimeEvent:
        pass

    @abstractmethod
    async def get_next_pending_event(self) -> Optional[RuntimeEvent]:
        pass

    @abstractmethod
    async def mark_processed(self, event_id: str, error: Optional[str] = None) -> Optional[RuntimeEvent]:
        pass

class InMemoryEventRepository(EventRepository):
    def __init__(self):
        self._events: Dict[str, RuntimeEvent] = {}

    async def list_events(
        self, world_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50
    ) -> List[RuntimeEvent]:
        results = list(self._events.values())
        if world_id:
            results = [e for e in results if e.worldId == world_id]
        if status:
            results = [e for e in results if e.status == status]
        results.sort(key=lambda e: e.createdAt, reverse=True)
        return results[:limit]

    async def create_event(self, event: EventCreate) -> RuntimeEvent:
        new_event = RuntimeEvent(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            worldId=event.worldId,
            personId=event.personId,
            type=event.type,
            payload=event.payload,
            status="pending",
        )
        self._events[new_event.id] = new_event
        return new_event

    async def get_next_pending_event(self) -> Optional[RuntimeEvent]:
        for e in self._events.values():
            if e.status == "pending":
                return e
        return None

    async def mark_processed(self, event_id: str, error: Optional[str] = None) -> Optional[RuntimeEvent]:
        e = self._events.get(event_id)
        if not e:
            return None
        e.status = "failed" if error else "processed"
        e.processedAt = datetime.utcnow().isoformat()
        e.error = error
        return e

# ====================================================
# 3. NOTIFICATION REPOSITORY
# ====================================================
class NotificationRepository(ABC):
    @abstractmethod
    async def list_notifications(
        self, user_id: str = "user-default", unread_only: bool = False, limit: int = 50
    ) -> List[Notification]:
        pass

    @abstractmethod
    async def get_unread_count(self, user_id: str = "user-default") -> int:
        pass

    @abstractmethod
    async def create_notification(self, notif: NotificationCreate) -> Notification:
        pass

    @abstractmethod
    async def mark_read(self, notification_id: str) -> Optional[Notification]:
        pass

    @abstractmethod
    async def mark_all_read(self, user_id: str = "user-default") -> int:
        pass

    @abstractmethod
    async def delete_notification(self, notification_id: str) -> bool:
        pass

class InMemoryNotificationRepository(NotificationRepository):
    def __init__(self):
        self._notifications: Dict[str, Notification] = {}
        self._seed_notifications()

    def _seed_notifications(self):
        seeds = [
            Notification(
                id="notif-seed-1",
                worldId="world-company",
                personId="person-maya",
                type="task_completed",
                title="Maya completed website research",
                message="Prepared UX enhancements and responsive architectural outline for the web application.",
                read=False,
                actionUrl="/world/world-company/people/person-maya/chat",
                createdAt=datetime.utcnow().isoformat(),
            ),
            Notification(
                id="notif-seed-2",
                worldId="world-company",
                personId="person-priya",
                type="task_completed",
                title="Priya finished pricing benchmark",
                message="Benchmarked 3 boutique furniture competitors against our 2026 catalog.",
                read=True,
                actionUrl="/world/world-company/people/person-priya/chat",
                createdAt=datetime.utcnow().isoformat(),
            ),
        ]
        for n in seeds:
            self._notifications[n.id] = n

    async def list_notifications(
        self, user_id: str = "user-default", unread_only: bool = False, limit: int = 50
    ) -> List[Notification]:
        res = list(self._notifications.values())
        if user_id:
            res = [n for n in res if n.userId == user_id]
        if unread_only:
            res = [n for n in res if not n.read]
        res.sort(key=lambda n: n.createdAt, reverse=True)
        return res[:limit]

    async def get_unread_count(self, user_id: str = "user-default") -> int:
        return sum(1 for n in self._notifications.values() if n.userId == user_id and not n.read)

    async def create_notification(self, notif: NotificationCreate) -> Notification:
        new_notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            userId=notif.userId or "user-default",
            worldId=notif.worldId,
            personId=notif.personId,
            type=notif.type,
            title=notif.title,
            message=notif.message,
            read=False,
            relatedEntityId=notif.relatedEntityId,
            actionUrl=notif.actionUrl,
            metadata=notif.metadata or {},
        )
        self._notifications[new_notif.id] = new_notif
        return new_notif

    async def mark_read(self, notification_id: str) -> Optional[Notification]:
        n = self._notifications.get(notification_id)
        if n:
            n.read = True
            return n
        return None

    async def mark_all_read(self, user_id: str = "user-default") -> int:
        count = 0
        for n in self._notifications.values():
            if n.userId == user_id and not n.read:
                n.read = True
                count += 1
        return count

    async def delete_notification(self, notification_id: str) -> bool:
        if notification_id in self._notifications:
            del self._notifications[notification_id]
            return True
        return False

# ====================================================
# 4. PERMISSION REPOSITORY
# ====================================================
class PermissionRepository(ABC):
    @abstractmethod
    async def get_permissions(self, world_id: str, person_id: str) -> PersonPermissions:
        pass

    @abstractmethod
    async def update_permissions(
        self, world_id: str, person_id: str, updates: PersonPermissionsUpdate
    ) -> PersonPermissions:
        pass

class InMemoryPermissionRepository(PermissionRepository):
    def __init__(self):
        self._permissions: Dict[str, PersonPermissions] = {}

    def _key(self, world_id: str, person_id: str) -> str:
        return f"{world_id}:{person_id}"

    async def get_permissions(self, world_id: str, person_id: str) -> PersonPermissions:
        key = self._key(world_id, person_id)
        if key not in self._permissions:
            # Conservative defaults
            self._permissions[key] = PersonPermissions(
                personId=person_id,
                worldId=world_id,
                worldView=True,
                worldEdit=False,
                peopleView=True,
                peopleCreate=False,
                peopleEdit=False,
                taskCreate=True,
                taskEdit=True,
                knowledgeView=True,
                knowledgeCreate=True,
                knowledgeEdit=False,
                projectCreate=True,
                projectEdit=False,
                messageUser=True,
            )
        return self._permissions[key]

    async def update_permissions(
        self, world_id: str, person_id: str, updates: PersonPermissionsUpdate
    ) -> PersonPermissions:
        current = await self.get_permissions(world_id, person_id)
        data = current.model_dump()
        update_data = updates.model_dump(exclude_unset=True)
        data.update(update_data)
        data["updatedAt"] = datetime.utcnow().isoformat()
        updated = PersonPermissions(**data)
        self._permissions[self._key(world_id, person_id)] = updated
        return updated

# ====================================================
# 5. APPROVAL REPOSITORY
# ====================================================
class ApprovalRepository(ABC):
    @abstractmethod
    async def list_approvals(self, world_id: Optional[str] = None, status: Optional[str] = None) -> List[ApprovalRequest]:
        pass

    @abstractmethod
    async def get_approval(self, approval_id: str) -> Optional[ApprovalRequest]:
        pass

    @abstractmethod
    async def create_approval(self, app_in: ApprovalCreate) -> ApprovalRequest:
        pass

    @abstractmethod
    async def resolve_approval(self, approval_id: str, status: str, comment: Optional[str] = None) -> Optional[ApprovalRequest]:
        pass

class InMemoryApprovalRepository(ApprovalRepository):
    def __init__(self):
        self._approvals: Dict[str, ApprovalRequest] = {}

    async def list_approvals(self, world_id: Optional[str] = None, status: Optional[str] = None) -> List[ApprovalRequest]:
        res = list(self._approvals.values())
        if world_id:
            res = [a for a in res if a.worldId == world_id]
        if status:
            res = [a for a in res if a.status == status]
        return sorted(res, key=lambda a: a.createdAt, reverse=True)

    async def get_approval(self, approval_id: str) -> Optional[ApprovalRequest]:
        return self._approvals.get(approval_id)

    async def create_approval(self, app_in: ApprovalCreate) -> ApprovalRequest:
        new_app = ApprovalRequest(
            id=f"appr-{uuid.uuid4().hex[:8]}",
            worldId=app_in.worldId,
            requesterPersonId=app_in.requesterPersonId,
            requesterName=app_in.requesterName,
            requesterEmoji=app_in.requesterEmoji,
            actionType=app_in.actionType,
            target=app_in.target,
            title=app_in.title,
            reason=app_in.reason,
            payload=app_in.payload,
            status="pending",
        )
        self._approvals[new_app.id] = new_app
        return new_app

    async def resolve_approval(self, approval_id: str, status: str, comment: Optional[str] = None) -> Optional[ApprovalRequest]:
        a = self._approvals.get(approval_id)
        if not a:
            return None
        a.status = status # "approved" or "denied"
        a.resolvedAt = datetime.utcnow().isoformat()
        a.resolutionComment = comment
        return a

# ====================================================
# 6. SCHEDULE REPOSITORY
# ====================================================
class ScheduleRepository(ABC):
    @abstractmethod
    async def list_schedules(self, world_id: Optional[str] = None) -> List[RuntimeSchedule]:
        pass

    @abstractmethod
    async def create_schedule(self, sched: RuntimeSchedule) -> RuntimeSchedule:
        pass

class InMemoryScheduleRepository(ScheduleRepository):
    def __init__(self):
        self._schedules: Dict[str, RuntimeSchedule] = {}

    async def list_schedules(self, world_id: Optional[str] = None) -> List[RuntimeSchedule]:
        res = list(self._schedules.values())
        if world_id:
            res = [s for s in res if s.worldId == world_id]
        return res

    async def create_schedule(self, sched: RuntimeSchedule) -> RuntimeSchedule:
        self._schedules[sched.id] = sched
        return sched

# ====================================================
# 7. CONVERSATION MESSAGE REPOSITORY (Persistent Backend Messages)
# ====================================================
class ConversationMessageRepository(ABC):
    @abstractmethod
    async def list_messages(self, world_id: str, person_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def append_message(self, world_id: str, person_id: str, role: str, content: str) -> Dict[str, Any]:
        pass

class InMemoryConversationMessageRepository(ConversationMessageRepository):
    def __init__(self):
        self._conversations: Dict[str, List[Dict[str, Any]]] = {}

    def _key(self, world_id: str, person_id: str) -> str:
        return f"{world_id}:{person_id}"

    async def list_messages(self, world_id: str, person_id: str) -> List[Dict[str, Any]]:
        return self._conversations.get(self._key(world_id, person_id), [])

    async def append_message(self, world_id: str, person_id: str, role: str, content: str) -> Dict[str, Any]:
        key = self._key(world_id, person_id)
        if key not in self._conversations:
            self._conversations[key] = []
        msg = {
            "id": f"msg-{uuid.uuid4().hex[:8]}",
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._conversations[key].append(msg)
        return msg

# Singletons
task_repository = InMemoryTaskRepository()
event_repository = InMemoryEventRepository()
notification_repository = InMemoryNotificationRepository()
permission_repository = InMemoryPermissionRepository()
approval_repository = InMemoryApprovalRepository()
schedule_repository = InMemoryScheduleRepository()
conversation_repository = InMemoryConversationMessageRepository()
