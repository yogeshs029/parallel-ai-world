from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from ...schemas.runtime import Notification, NotificationCreate
from ...services.runtime.repositories import notification_repository
from ...services.runtime.broadcaster import broadcaster

router = APIRouter()

@router.get("/notifications", response_model=List[Notification])
async def list_notifications(
    user_id: str = "user-default",
    unread_only: bool = Query(False),
    limit: int = Query(50),
):
    return await notification_repository.list_notifications(
        user_id=user_id, unread_only=unread_only, limit=limit
    )

@router.get("/notifications/unread-count")
async def get_unread_count(user_id: str = "user-default"):
    count = await notification_repository.get_unread_count(user_id=user_id)
    return {"count": count}

@router.patch("/notifications/{notification_id}/read", response_model=Notification)
async def mark_notification_read(notification_id: str):
    notif = await notification_repository.mark_read(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await broadcaster.broadcast("notification_read", {"id": notification_id})
    return notif

@router.post("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = "user-default"):
    count = await notification_repository.mark_all_read(user_id=user_id)
    await broadcaster.broadcast("notifications_cleared", {"count": count})
    return {"count": count}

@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    success = await notification_repository.delete_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "deleted"}
