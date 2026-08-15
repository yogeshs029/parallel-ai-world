from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from ...core.config import settings

# Import service instances to perform clean resets
try:
    from ...services.memory.repository import memory_repository
except ImportError:
    memory_repository = None

try:
    from ...services.knowledge.repository import knowledge_repository
except ImportError:
    knowledge_repository = None

try:
    from ...services.runtime.repositories import (
        task_repo,
        notification_repo,
        approval_repo,
        permission_repo,
    )
except ImportError:
    task_repo = None
    notification_repo = None
    approval_repo = None
    permission_repo = None

try:
    from ...services.tools.engine import tool_engine
except ImportError:
    tool_engine = None

try:
    from ...services.experience.engine import experience_engine
except ImportError:
    experience_engine = None

router = APIRouter()

class DevResetResponse(BaseModel):
    success: bool
    message: str
    environment: str
    timestamp: str

@router.post("/reset", response_model=DevResetResponse, summary="Development Data Reset")
async def dev_reset():
    """
    Clears all application development data and resets runtime state.
    Preserves database schema, table structures, system tool registry, and permissions.
    Strictly blocked in production environments.
    """
    env = (settings.ENVIRONMENT or "").strip().lower()
    if env not in ["development", "dev", "test", "local"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev reset endpoint is strictly disabled in production environments."
        )

    # 1. Reset Memory Repository
    if memory_repository and hasattr(memory_repository, "_memories"):
        try:
            memory_repository._memories.clear()
        except Exception:
            pass

    # 2. Reset Knowledge Repository
    if knowledge_repository and hasattr(knowledge_repository, "_sources"):
        try:
            knowledge_repository._sources.clear()
            if hasattr(knowledge_repository, "_chunks"):
                knowledge_repository._chunks.clear()
        except Exception:
            pass

    # 3. Reset Runtime Tasks, Notifications, Approvals
    if task_repo and hasattr(task_repo, "_tasks"):
        try:
            task_repo._tasks.clear()
        except Exception:
            pass
    if notification_repo and hasattr(notification_repo, "_notifications"):
        try:
            notification_repo._notifications.clear()
        except Exception:
            pass
    if approval_repo and hasattr(approval_repo, "_approvals"):
        try:
            approval_repo._approvals.clear()
        except Exception:
            pass

    # 4. Reset Experience Custom Snapshots
    if experience_engine and hasattr(experience_engine, "_experiences"):
        try:
            experience_engine._experiences.clear()
            if hasattr(experience_engine, "_history"):
                experience_engine._history.clear()
        except Exception:
            pass

    return DevResetResponse(
        success=True,
        message="Development database and runtime state reset successfully.",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.utcnow().isoformat(),
    )
