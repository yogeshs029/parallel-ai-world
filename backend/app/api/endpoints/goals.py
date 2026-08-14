import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from ...schemas.goal import GoalCreate, GoalUpdate, GoalResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store (mirrors localStorage fallback pattern used by frontend services)
_goals_store: dict[str, List[dict]] = {}  # worldId -> list of goals

def _get_world_goals(world_id: str) -> List[dict]:
    return _goals_store.get(world_id, [])

def _save_world_goals(world_id: str, goals: List[dict]):
    _goals_store[world_id] = goals


@router.get("/worlds/{world_id}/goals", response_model=List[GoalResponse])
async def list_goals(
    world_id: str,
    status: Optional[str] = Query(None),
    owner_person_id: Optional[str] = Query(None, alias="ownerPersonId"),
):
    goals = _get_world_goals(world_id)
    if status:
        goals = [g for g in goals if g.get("status") == status]
    if owner_person_id:
        goals = [g for g in goals if g.get("ownerPersonId") == owner_person_id]
    return goals


@router.post("/worlds/{world_id}/goals", response_model=GoalResponse, status_code=201)
async def create_goal(world_id: str, payload: GoalCreate):
    goal_id = payload.dict().get("id") or f"goal-{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()

    goal = {
        **payload.dict(),
        "id": goal_id,
        "worldId": world_id,
        "progress": 0,
        "createdAt": now,
        "updatedAt": now,
    }

    goals = _get_world_goals(world_id)
    goals.insert(0, goal)
    _save_world_goals(world_id, goals)

    logger.info(f"Goal created [{goal_id}]: {payload.title}")
    return goal


@router.get("/worlds/{world_id}/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(world_id: str, goal_id: str):
    goals = _get_world_goals(world_id)
    goal = next((g for g in goals if g["id"] == goal_id), None)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.patch("/worlds/{world_id}/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(world_id: str, goal_id: str, updates: GoalUpdate):
    goals = _get_world_goals(world_id)
    for idx, goal in enumerate(goals):
        if goal["id"] == goal_id:
            updated = {
                **goal,
                **{k: v for k, v in updates.dict().items() if v is not None},
                "updatedAt": datetime.utcnow().isoformat(),
            }
            if updates.status == "completed" and not goal.get("completedAt"):
                updated["completedAt"] = datetime.utcnow().isoformat()
            goals[idx] = updated
            _save_world_goals(world_id, goals)
            return updated
    raise HTTPException(status_code=404, detail="Goal not found")


@router.post("/worlds/{world_id}/goals/{goal_id}/pause")
async def pause_goal(world_id: str, goal_id: str):
    return await _transition_goal_status(world_id, goal_id, "paused")


@router.post("/worlds/{world_id}/goals/{goal_id}/resume")
async def resume_goal(world_id: str, goal_id: str):
    return await _transition_goal_status(world_id, goal_id, "active")


@router.post("/worlds/{world_id}/goals/{goal_id}/cancel")
async def cancel_goal(world_id: str, goal_id: str):
    return await _transition_goal_status(world_id, goal_id, "cancelled")


async def _transition_goal_status(world_id: str, goal_id: str, new_status: str):
    goals = _get_world_goals(world_id)
    for idx, goal in enumerate(goals):
        if goal["id"] == goal_id:
            now = datetime.utcnow().isoformat()
            updated = {**goal, "status": new_status, "updatedAt": now}
            if new_status == "completed":
                updated["completedAt"] = now
            goals[idx] = updated
            _save_world_goals(world_id, goals)
            logger.info(f"Goal [{goal_id}] transitioned to status: {new_status}")
            return {"id": goal_id, "status": new_status}
    raise HTTPException(status_code=404, detail="Goal not found")
