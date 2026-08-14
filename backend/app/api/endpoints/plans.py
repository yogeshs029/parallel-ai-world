import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException

from ...schemas.plan import PlanCreate, PlanResponse, PlanRevisionCreate, PlanRevisionResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory stores
_plans_store: dict[str, dict] = {}        # goalId -> plan
_revisions_store: dict[str, List[dict]] = {}  # planId -> list of revisions


@router.get("/worlds/{world_id}/goals/{goal_id}/plan", response_model=Optional[PlanResponse])
async def get_plan(world_id: str, goal_id: str):
    plan = _plans_store.get(goal_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found for this goal")
    return plan


@router.post("/worlds/{world_id}/goals/{goal_id}/plan", response_model=PlanResponse, status_code=201)
async def create_plan(world_id: str, goal_id: str, payload: PlanCreate):
    now = datetime.utcnow().isoformat()
    plan_id = f"plan-{uuid.uuid4().hex[:10]}"

    plan = {
        **payload.dict(),
        "id": plan_id,
        "goalId": goal_id,
        "status": "draft",
        "version": 1,
        "createdAt": now,
        "updatedAt": now,
    }

    _plans_store[goal_id] = plan
    logger.info(f"Plan created [{plan_id}] for goal [{goal_id}]")
    return plan


@router.post("/worlds/{world_id}/goals/{goal_id}/approve", response_model=PlanResponse)
async def approve_plan(world_id: str, goal_id: str):
    plan = _plans_store.get(goal_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found for this goal")
    plan["status"] = "active"
    plan["updatedAt"] = datetime.utcnow().isoformat()
    _plans_store[goal_id] = plan
    logger.info(f"Plan [{plan['id']}] approved and activated for goal [{goal_id}]")
    return plan


@router.patch("/worlds/{world_id}/goals/{goal_id}/plan/steps/{step_id}")
async def update_step(world_id: str, goal_id: str, step_id: str, updates: dict):
    plan = _plans_store.get(goal_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    steps = plan.get("steps", [])
    for idx, step in enumerate(steps):
        if step["id"] == step_id:
            updated_step = {
                **step,
                **{k: v for k, v in updates.items() if v is not None},
                "updatedAt": datetime.utcnow().isoformat(),
            }
            if updates.get("status") == "completed" and not step.get("completedAt"):
                updated_step["completedAt"] = datetime.utcnow().isoformat()
            steps[idx] = updated_step
            plan["steps"] = steps
            plan["updatedAt"] = datetime.utcnow().isoformat()
            _plans_store[goal_id] = plan
            return updated_step

    raise HTTPException(status_code=404, detail="Step not found")


@router.post("/worlds/{world_id}/goals/{goal_id}/revision", response_model=PlanRevisionResponse, status_code=201)
async def create_plan_revision(world_id: str, goal_id: str, payload: PlanRevisionCreate):
    plan = _plans_store.get(goal_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found for this goal")

    revision_id = f"rev-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    revision = {
        "id": revision_id,
        "planId": plan["id"],
        "reason": payload.reason,
        "changes": payload.changes,
        "createdByPersonId": payload.createdByPersonId,
        "status": "proposed",
        "createdAt": now,
    }

    plan_revisions = _revisions_store.setdefault(plan["id"], [])
    plan_revisions.insert(0, revision)

    logger.info(f"Plan revision proposed [{revision_id}] for plan [{plan['id']}]")
    return revision


@router.get("/worlds/{world_id}/goals/{goal_id}/revisions", response_model=List[PlanRevisionResponse])
async def list_revisions(world_id: str, goal_id: str):
    plan = _plans_store.get(goal_id)
    if not plan:
        return []
    return _revisions_store.get(plan["id"], [])
