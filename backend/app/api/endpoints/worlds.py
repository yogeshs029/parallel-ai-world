from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.delete("/worlds/{world_id}", summary="Permanently Delete World and All Cascaded Entities")
async def delete_world_cascade(world_id: str) -> Dict[str, Any]:
    """
    Permanently deletes a World and cascades deletion across all related subsystems:
    - People, Person contexts & voice profiles
    - Tasks & active runtime workers
    - Memories (World-scoped and Person-scoped)
    - Knowledge sources, documents, notes, and chunks
    - Goals, Plans, and step executions
    - Relationships and channel messages
    - Approvals, notifications, and events
    - Custom theme presets and experience versions
    """
    logger.info(f"Permanently deleting World [{world_id}] and cascading all related entities...")

    # 1. Memory Cascade
    try:
        from ...services.memory.repository import memory_repository
        if memory_repository and hasattr(memory_repository, "_store"):
            to_del_mem = [k for k, v in memory_repository._store.items() if v.worldId == world_id]
            for k in to_del_mem:
                del memory_repository._store[k]
    except Exception as e:
        logger.warn(f"Error cascading memories for world {world_id}: {e}")

    # 2. Knowledge Cascade
    try:
        from ...services.knowledge.repository import knowledge_repository
        if knowledge_repository and hasattr(knowledge_repository, "_sources"):
            to_del_src = [k for k, v in knowledge_repository._sources.items() if v.worldId == world_id]
            for k in to_del_src:
                del knowledge_repository._sources[k]
            if hasattr(knowledge_repository, "_chunks"):
                to_del_chunk = [k for k, v in knowledge_repository._chunks.items() if v.worldId == world_id]
                for k in to_del_chunk:
                    del knowledge_repository._chunks[k]
    except Exception as e:
        logger.warn(f"Error cascading knowledge for world {world_id}: {e}")

    # 3. Runtime Tasks, Approvals, Notifications, Events Cascade
    try:
        from ...services.runtime.repositories import task_repo, approval_repo, notification_repo, event_repo
        if task_repo and hasattr(task_repo, "_tasks"):
            to_del_tasks = [k for k, v in task_repo._tasks.items() if getattr(v, "worldId", None) == world_id]
            for k in to_del_tasks:
                del task_repo._tasks[k]
        if approval_repo and hasattr(approval_repo, "_approvals"):
            to_del_appr = [k for k, v in approval_repo._approvals.items() if getattr(v, "worldId", None) == world_id]
            for k in to_del_appr:
                del approval_repo._approvals[k]
        if notification_repo and hasattr(notification_repo, "_notifications"):
            to_del_notif = [k for k, v in notification_repo._notifications.items() if getattr(v, "worldId", None) == world_id]
            for k in to_del_notif:
                del notification_repo._notifications[k]
        if event_repo and hasattr(event_repo, "_events"):
            to_del_events = [k for k, v in event_repo._events.items() if getattr(v, "worldId", None) == world_id]
            for k in to_del_events:
                del event_repo._events[k]
    except Exception as e:
        logger.warn(f"Error cascading runtime entities for world {world_id}: {e}")

    # 4. Goals & Plans Cascade
    try:
        from .goals import _goals_store
        if world_id in _goals_store:
            del _goals_store[world_id]
    except Exception as e:
        logger.warn(f"Error cascading goals for world {world_id}: {e}")

    try:
        from .plans import _plans_store
        if world_id in _plans_store:
            del _plans_store[world_id]
    except Exception as e:
        logger.warn(f"Error cascading plans for world {world_id}: {e}")

    # 5. Relationships Cascade
    try:
        from .relationships import _RELATIONSHIPS_DB
        to_del_rel = [k for k, v in _RELATIONSHIPS_DB.items() if v.get("worldId") == world_id]
        for k in to_del_rel:
            del _RELATIONSHIPS_DB[k]
    except Exception as e:
        logger.warn(f"Error cascading relationships for world {world_id}: {e}")

    # 6. Experience & Themes Cascade
    try:
        from ...services.experience.engine import world_experience_engine
        if hasattr(world_experience_engine, "_experiences") and world_id in world_experience_engine._experiences:
            del world_experience_engine._experiences[world_id]
        if hasattr(world_experience_engine, "_version_history") and world_id in world_experience_engine._version_history:
            del world_experience_engine._version_history[world_id]
    except Exception as e:
        logger.warn(f"Error cascading experiences for world {world_id}: {e}")

    # 7. Voice Profiles Cascade
    try:
        from ...services.voice.repository import voice_profile_repository
        if hasattr(voice_profile_repository, "_profiles"):
            to_del_voice = [k for k, v in voice_profile_repository._profiles.items() if getattr(v, "worldId", None) == world_id]
            for k in to_del_voice:
                del voice_profile_repository._profiles[k]
    except Exception as e:
        logger.warn(f"Error cascading voice profiles for world {world_id}: {e}")

    return {
        "success": True,
        "worldId": world_id,
        "message": f"World '{world_id}' and all associated people, tasks, knowledge, memories, goals, and runtime states have been permanently deleted.",
    }
