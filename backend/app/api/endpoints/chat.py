import json
import logging
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

from ...schemas.chat import ChatStreamRequest
from ...services.llm.ollama import OllamaProvider
from ...services.intelligence.prompt_builder import build_system_prompt
from ...services.memory.retriever import memory_retriever
from ...services.memory.extraction import memory_extraction_service
from ...services.knowledge.retriever import knowledge_retriever

logger = logging.getLogger(__name__)
router = APIRouter()
ollama_provider = OllamaProvider()

async def _extract_memories_task(world_id: str, person_id: str, messages: list):
    """Background task to extract memories from conversation"""
    try:
        await memory_extraction_service.extract_and_store(
            world_id=world_id,
            person_id=person_id,
            messages=messages,
        )
    except Exception as e:
        logger.error(f"Background memory extraction error: {e}")

@router.post("/stream")
async def chat_stream(request: ChatStreamRequest, backgroundTasks: BackgroundTasks):
    """
    Stream conversational responses using SSE with Memory + Knowledge RAG retrieval.
    """
    # 1. Extract latest user query
    latest_user_query = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            latest_user_query = msg.content
            break

    # 2. Retrieve relevant Memories (Module 4)
    relevant_memories = []
    if latest_user_query and request.world.id:
        try:
            relevant_memories = await memory_retriever.retrieve(
                world_id=request.world.id,
                person_id=request.person.id,
                query=latest_user_query,
                limit=3,
            )
        except Exception as err:
            logger.warning(f"Memory retrieval error: {err}")

    # 3. Retrieve relevant Knowledge Chunks (Module 5)
    relevant_knowledge = []
    if latest_user_query and request.world.id:
        try:
            relevant_knowledge = await knowledge_retriever.retrieve(
                world_id=request.world.id,
                person_id=request.person.id,
                query=latest_user_query,
                limit=3,
            )
        except Exception as err:
            logger.warning(f"Knowledge retrieval error: {err}")

    # 4. Build combined system instruction
    system_prompt = build_system_prompt(
        world=request.world,
        person=request.person,
        memories=relevant_memories,
        knowledge_chunks=relevant_knowledge,
    )

    # 5. Format conversation history for LLM
    llm_messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        llm_messages.append({"role": msg.role, "content": msg.content})

    accumulated_response = []

    async def sse_event_generator() -> AsyncGenerator[str, None]:
        try:
            async for token in ollama_provider.stream_chat(llm_messages):
                accumulated_response.append(token)
                event_data = json.dumps({"token": token, "done": False})
                yield f"data: {event_data}\n\n"
            
            # Send completion signal
            done_data = json.dumps({"token": "", "done": True})
            yield f"data: {done_data}\n\n"

            # Trigger background memory extraction
            full_assistant_reply = "".join(accumulated_response)
            if full_assistant_reply and request.world.id:
                history_for_extraction = [
                    {"role": m.role, "content": m.content} for m in request.messages[-3:]
                ]
                history_for_extraction.append({"role": "assistant", "content": full_assistant_reply})
                
                asyncio.create_task(
                    _extract_memories_task(
                        request.world.id,
                        request.person.id,
                        history_for_extraction,
                    )
                )

        except Exception as e:
            logger.error(f"Error streaming response: {e}")
            err_data = json.dumps({"token": f"\n[Error: {str(e)}]", "done": True})
            yield f"data: {err_data}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@router.post("")
async def chat_unary(request: ChatStreamRequest, background_tasks: BackgroundTasks):
    """
    Non-streaming fallback chat endpoint with Memory + Knowledge integration.
    """
    latest_user_query = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            latest_user_query = msg.content
            break

    relevant_memories = []
    if latest_user_query and request.world.id:
        try:
            relevant_memories = await memory_retriever.retrieve(
                world_id=request.world.id,
                person_id=request.person.id,
                query=latest_user_query,
                limit=3,
            )
        except Exception as err:
            logger.warning(f"Memory retrieval error: {err}")

    relevant_knowledge = []
    if latest_user_query and request.world.id:
        try:
            relevant_knowledge = await knowledge_retriever.retrieve(
                world_id=request.world.id,
                person_id=request.person.id,
                query=latest_user_query,
                limit=3,
            )
        except Exception as err:
            logger.warning(f"Knowledge retrieval error: {err}")

    system_prompt = build_system_prompt(
        world=request.world,
        person=request.person,
        memories=relevant_memories,
        knowledge_chunks=relevant_knowledge,
    )

    llm_messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        llm_messages.append({"role": msg.role, "content": msg.content})

    response_text = await ollama_provider.generate(llm_messages)

    if response_text and request.world.id:
        history_for_extraction = [
            {"role": m.role, "content": m.content} for m in request.messages[-3:]
        ]
        history_for_extraction.append({"role": "assistant", "content": response_text})
        background_tasks.add_task(
            _extract_memories_task,
            request.world.id,
            request.person.id,
            history_for_extraction,
        )

    return {"content": response_text}
