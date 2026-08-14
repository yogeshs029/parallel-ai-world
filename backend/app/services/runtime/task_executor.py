import logging
from datetime import datetime
from typing import Optional

from ...schemas.runtime import RuntimeTask, TaskUpdate, NotificationCreate, EventCreate
from .repositories import (
    task_repository,
    event_repository,
    notification_repository,
    conversation_repository,
)
from .broadcaster import broadcaster
from ..llm.service import intelligence_service
from ..knowledge.retriever import knowledge_retriever
from ..memory.retriever import memory_retriever

logger = logging.getLogger(__name__)

class TaskExecutorService:
    def __init__(self):
        pass

    async def execute_task(self, task: RuntimeTask) -> RuntimeTask:
        """
        Executes a background task using LLM grounded with person memory & knowledge.
        Produces task result, person-initiated chat message, and user notification.
        """
        logger.info(f"Executing background task [{task.id}]: {task.title}")

        # Mark running
        await task_repository.update_task(
            task.id,
            TaskUpdate(status="running")
        )

        person_name = "Maya" if task.assignedPersonId == "person-maya" else "Priya" if task.assignedPersonId == "person-priya" else "Your Assistant"
        person_role = "Lead Developer" if task.assignedPersonId == "person-maya" else "Product Manager"

        # 1. Retrieve relevant knowledge context for the task
        knowledge_context = ""
        try:
            chunks = await knowledge_retriever.retrieve(
                world_id=task.worldId,
                person_id=task.assignedPersonId,
                query=f"{task.title} {task.description or ''}",
                limit=3,
            )
            if chunks:
                knowledge_context = "\nRelevant Reference Knowledge:\n" + "\n".join([f"- {c.content}" for c in chunks])
        except Exception as e:
            logger.warning(f"Error retrieving knowledge for task {task.id}: {e}")

        # 2. Build task execution prompt
        prompt = (
            f"You are {person_name}, the {person_role} in this world.\n"
            f"You have been assigned to complete the following task:\n"
            f"Task: {task.title}\n"
            f"Details: {task.description or 'No additional details provided.'}\n"
            f"{knowledge_context}\n\n"
            f"INSTRUCTIONS:\n"
            f"Perform the task thoroughly and return a concise, high-quality result summary in 2 to 3 sentences (under 60 words).\n"
            f"Be specific, actionable, and grounded."
        )

        try:
            llm_messages = [{"role": "user", "content": prompt}]
            result_text = await intelligence_service.generate(llm_messages)
            if not result_text or not result_text.strip():
                result_text = f"Completed work on '{task.title}' according to project requirements."
            result_text = result_text.strip()

            # Update task to completed
            updated_task = await task_repository.update_task(
                task.id,
                TaskUpdate(
                    status="completed",
                    result=result_text,
                    completedAt=datetime.utcnow().isoformat(),
                )
            )

            # 3. Create Person-Initiated Completion Message in Chat History
            if task.assignedPersonId:
                chat_msg = f"I've finished working on '{task.title}'. {result_text}"
                await conversation_repository.append_message(
                    world_id=task.worldId,
                    person_id=task.assignedPersonId,
                    role="assistant",
                    content=chat_msg,
                )

            # 4. Create In-App Notification
            notif = await notification_repository.create_notification(
                NotificationCreate(
                    worldId=task.worldId,
                    personId=task.assignedPersonId,
                    type="task_completed",
                    title=f"{person_name} completed '{task.title}'",
                    message=result_text[:160],
                    relatedEntityId=task.id,
                    actionUrl=f"/world/{task.worldId}/people/{task.assignedPersonId}/chat" if task.assignedPersonId else f"/world/{task.worldId}",
                )
            )

            # 5. Record Event
            await event_repository.create_event(
                EventCreate(
                    worldId=task.worldId,
                    personId=task.assignedPersonId,
                    type="TASK_COMPLETED",
                    payload={"taskId": task.id, "title": task.title, "result": result_text},
                )
            )

            # 6. Broadcast real-time SSE updates
            await broadcaster.broadcast("task_completed", {
                "taskId": task.id,
                "worldId": task.worldId,
                "personId": task.assignedPersonId,
                "title": task.title,
                "result": result_text,
            })
            await broadcaster.broadcast("notification", notif.model_dump())

            logger.info(f"Task [{task.id}] completed successfully.")
            return updated_task or task

        except Exception as err:
            logger.error(f"Task [{task.id}] failed: {err}")
            retry_count = task.retryCount + 1
            if retry_count <= task.maxRetries:
                logger.info(f"Retrying task [{task.id}] (Attempt {retry_count}/{task.maxRetries})")
                await task_repository.update_task(
                    task.id,
                    TaskUpdate(status="pending")
                )
            else:
                await task_repository.update_task(
                    task.id,
                    TaskUpdate(status="failed", result=f"Task execution failed: {str(err)}")
                )
                await notification_repository.create_notification(
                    NotificationCreate(
                        worldId=task.worldId,
                        personId=task.assignedPersonId,
                        type="system",
                        title=f"Task Failed: '{task.title}'",
                        message=f"Could not complete task: {str(err)}",
                        relatedEntityId=task.id,
                    )
                )
            raise err

task_executor = TaskExecutorService()
