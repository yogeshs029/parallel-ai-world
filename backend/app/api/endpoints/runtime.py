from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ...services.runtime.worker import runtime_worker
from ...services.runtime.broadcaster import broadcaster
from ...schemas.runtime import RuntimeStatus

router = APIRouter()

@router.get("/status", response_model=RuntimeStatus)
async def get_runtime_status():
    """Development runtime diagnostic status endpoint"""
    return await runtime_worker.get_status()

@router.get("/stream")
async def stream_runtime_events():
    """Real-time SSE event stream for live notifications and task updates"""
    return StreamingResponse(
        broadcaster.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
