from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional

from ...schemas.runtime import ApprovalRequest, ApprovalCreate, NotificationCreate, EventCreate
from ...services.runtime.repositories import (
    approval_repository,
    notification_repository,
    event_repository,
)
from ...services.runtime.broadcaster import broadcaster

router = APIRouter()

@router.get("/worlds/{world_id}/approvals", response_model=List[ApprovalRequest])
async def list_approvals(world_id: str, status: Optional[str] = Query(None)):
    return await approval_repository.list_approvals(world_id=world_id, status=status)

@router.post("/worlds/{world_id}/approvals", response_model=ApprovalRequest)
async def create_approval_request(world_id: str, app_in: ApprovalCreate):
    app_in.worldId = world_id
    new_app = await approval_repository.create_approval(app_in)

    # Notify user
    notif = await notification_repository.create_notification(
        NotificationCreate(
            worldId=world_id,
            personId=app_in.requesterPersonId,
            type="approval_required",
            title=f"{app_in.requesterName} needs your approval",
            message=f"{app_in.title}: {app_in.reason}",
            relatedEntityId=new_app.id,
            actionUrl=f"/world/{world_id}",
        )
    )

    await broadcaster.broadcast("approval_requested", new_app.model_dump())
    await broadcaster.broadcast("notification", notif.model_dump())
    return new_app

@router.post("/worlds/{world_id}/approvals/{approval_id}/approve", response_model=ApprovalRequest)
async def approve_request(world_id: str, approval_id: str, comment: Optional[str] = Body(None, embed=True)):
    appr = await approval_repository.resolve_approval(approval_id, status="approved", comment=comment)
    if not appr or appr.worldId != world_id:
        raise HTTPException(status_code=404, detail="Approval request not found")

    await event_repository.create_event(
        EventCreate(
            worldId=world_id,
            personId=appr.requesterPersonId,
            type="APPROVAL_RESOLVED",
            payload={"approvalId": appr.id, "status": "approved", "actionType": appr.actionType},
        )
    )

    await broadcaster.broadcast("approval_resolved", appr.model_dump())
    return appr

@router.post("/worlds/{world_id}/approvals/{approval_id}/deny", response_model=ApprovalRequest)
async def deny_request(world_id: str, approval_id: str, comment: Optional[str] = Body(None, embed=True)):
    appr = await approval_repository.resolve_approval(approval_id, status="denied", comment=comment)
    if not appr or appr.worldId != world_id:
        raise HTTPException(status_code=404, detail="Approval request not found")

    await event_repository.create_event(
        EventCreate(
            worldId=world_id,
            personId=appr.requesterPersonId,
            type="APPROVAL_RESOLVED",
            payload={"approvalId": appr.id, "status": "denied", "actionType": appr.actionType},
        )
    )

    await broadcaster.broadcast("approval_resolved", appr.model_dump())
    return appr
