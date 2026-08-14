from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from ...schemas.runtime import RuntimeTask, TaskCreate, TaskUpdate, EventCreate
from ...services.runtime.repositories import task_repository, event_repository
from ...services.runtime.broadcaster import broadcaster

router = APIRouter()

@router.get("/worlds/{world_id}/tasks", response_model=List[RuntimeTask])
async def list_world_tasks(
    world_id: str,
    person_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    return await task_repository.list_tasks(world_id=world_id, person_id=person_id, status=status)

@router.post("/worlds/{world_id}/tasks", response_model=RuntimeTask)
async def create_world_task(world_id: str, task_in: TaskCreate):
    task_in.worldId = world_id
    new_task = await task_repository.create_task(task_in)
    
    # Record event
    await event_repository.create_event(
        EventCreate(
            worldId=world_id,
            personId=task_in.assignedPersonId,
            type="TASK_CREATED",
            payload={"taskId": new_task.id, "title": new_task.title},
        )
    )

    # Broadcast task creation
    await broadcaster.broadcast("task_created", new_task.model_dump())
    return new_task

@router.get("/worlds/{world_id}/tasks/{task_id}", response_model=RuntimeTask)
async def get_task(world_id: str, task_id: str):
    task = await task_repository.get_task(task_id)
    if not task or task.worldId != world_id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/worlds/{world_id}/tasks/{task_id}", response_model=RuntimeTask)
async def update_task(world_id: str, task_id: str, updates: TaskUpdate):
    updated = await task_repository.update_task(task_id, updates)
    if not updated or updated.worldId != world_id:
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcaster.broadcast("task_updated", updated.model_dump())
    return updated

@router.delete("/worlds/{world_id}/tasks/{task_id}")
async def delete_task(world_id: str, task_id: str):
    success = await task_repository.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}
