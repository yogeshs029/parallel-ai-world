import asyncio
import logging
from datetime import datetime
from typing import Set

from .repositories import (
    task_repository,
    event_repository,
    notification_repository,
    approval_repository,
)
from .task_executor import task_executor
from ...schemas.runtime import RuntimeStatus

logger = logging.getLogger(__name__)

class WorldRuntimeWorker:
    def __init__(self):
        self._is_running = False
        self._task_handle: asyncio.Task = None
        self._last_heartbeat = datetime.utcnow()
        self._processed_events: Set[str] = set()
        self._processed_tasks: Set[str] = set()
        self._processed_tasks_count = 0
        self._processed_events_count = 0

    @property
    def is_running(self) -> bool:
        return self._is_running

    def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task_handle = asyncio.create_task(self._run_loop())
        logger.info("WorldRuntimeWorker background loop started.")

    def stop(self):
        self._is_running = False
        if self._task_handle and not self._task_handle.done():
            self._task_handle.cancel()
        logger.info("WorldRuntimeWorker background loop stopped.")

    async def _run_loop(self):
        while self._is_running:
            self._last_heartbeat = datetime.utcnow()
            try:
                # 1. Process next pending event (Idempotency check)
                event = await event_repository.get_next_pending_event()
                if event:
                    if event.id in self._processed_events:
                        logger.warning(f"Event [{event.id}] already processed, skipping.")
                        await event_repository.mark_processed(event.id)
                    else:
                        self._processed_events.add(event.id)
                        self._processed_events_count += 1
                        logger.info(f"Processing event [{event.id}]: {event.type}")
                        await event_repository.mark_processed(event.id)

                # 2. Process next pending task
                task = await task_repository.get_next_pending_task()
                if task:
                    if task.id in self._processed_tasks and task.status == "completed":
                        logger.warning(f"Task [{task.id}] already completed, skipping.")
                    else:
                        self._processed_tasks.add(task.id)
                        self._processed_tasks_count += 1
                        logger.info(f"Worker picked up task [{task.id}]: {task.title}")
                        try:
                            await task_executor.execute_task(task)
                        except Exception as e:
                            logger.error(f"Error executing task [{task.id}]: {e}")

            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                logger.error(f"Runtime worker loop error: {loop_err}")

            # Non-blocking polite sleep
            await asyncio.sleep(1.0)

    async def get_status(self) -> RuntimeStatus:
        pending_tasks = await task_repository.list_tasks(status="pending")
        pending_events = await event_repository.list_events(status="pending")
        pending_approvals = await approval_repository.list_approvals(status="pending")
        unread_notifs = await notification_repository.get_unread_count()

        return RuntimeStatus(
            isRunning=self._is_running,
            workerStatus="active" if self._is_running else "stopped",
            activeWorldsCount=1,
            pendingTasksCount=len(pending_tasks),
            pendingEventsCount=len(pending_events),
            pendingApprovalsCount=len(pending_approvals),
            unreadNotificationsCount=unread_notifs,
            lastHeartbeat=self._last_heartbeat.isoformat(),
            processedTasksCount=self._processed_tasks_count,
            processedEventsCount=self._processed_events_count,
        )

runtime_worker = WorldRuntimeWorker()
