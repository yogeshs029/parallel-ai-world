import asyncio
import json
import logging
from typing import List, AsyncGenerator, Dict, Any

logger = logging.getLogger(__name__)

class RealtimeBroadcaster:
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        async with self._lock:
            self._subscribers.append(queue)
        logger.info(f"New SSE client connected. Total subscribers: {len(self._subscribers)}")

        try:
            # Send initial keepalive
            yield f"event: ping\ndata: {json.dumps({'status': 'connected'})}\n\n"

            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            async with self._lock:
                if queue in self._subscribers:
                    self._subscribers.remove(queue)
            logger.info(f"SSE client disconnected. Remaining: {len(self._subscribers)}")

    async def broadcast(self, event_name: str, payload: Dict[str, Any]):
        """Broadcast an event to all connected SSE clients"""
        if not self._subscribers:
            return

        message = f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"
        async with self._lock:
            for queue in list(self._subscribers):
                try:
                    queue.put_nowait(message)
                except Exception as e:
                    logger.warning(f"Error queueing SSE message: {e}")

broadcaster = RealtimeBroadcaster()
