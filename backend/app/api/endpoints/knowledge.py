from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional

from ...schemas.knowledge import (
    KnowledgeSource,
    KnowledgeNoteCreate,
    KnowledgeUrlCreate,
    KnowledgeSourceUpdate,
    KnowledgeSearchQuery,
    RetrievedKnowledgeChunk,
)
from ...services.knowledge.repository import knowledge_repository
from ...services.knowledge.processor import process_file_content, extract_text_from_url
from ...services.knowledge.retriever import knowledge_retriever

router = APIRouter()

@router.get("/worlds/{world_id}/knowledge", response_model=List[KnowledgeSource])
async def list_knowledge(
    world_id: str,
    person_id: Optional[str] = None,
    visibility: Optional[str] = None,
    type: Optional[str] = None,
):
    """
    List knowledge sources in a world, optionally filtered by person or visibility.
    """
    return await knowledge_repository.list_sources(
        world_id=world_id,
        person_id=person_id,
        visibility=visibility, # type: ignore
        type=type, # type: ignore
    )

@router.get("/worlds/{world_id}/knowledge/{knowledge_id}", response_model=KnowledgeSource)
async def get_knowledge(world_id: str, knowledge_id: str):
    """
    Get detailed information about a single knowledge source.
    """
    src = await knowledge_repository.get_source(knowledge_id)
    if not src or src.worldId != world_id:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    return src

@router.post("/worlds/{world_id}/knowledge/upload", response_model=KnowledgeSource)
async def upload_document(
    world_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    visibility: str = Form("world"),
    person_id: Optional[str] = Form(None),
):
    """
    Upload and parse a document (PDF, DOCX, TXT, MD).
    """
    try:
        content_bytes = await file.read()
        filename = file.filename or "Uploaded Document"
        source_name = name.strip() if name and name.strip() else filename

        extracted_text, mime_type = process_file_content(filename, content_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="The uploaded document contains no readable text.")

        created = await knowledge_repository.create_source(
            world_id=world_id,
            name=source_name,
            type="document",
            source=filename,
            extracted_text=extracted_text,
            visibility=visibility, # type: ignore
            person_id=person_id if visibility == "person" else None,
            description=description,
            size=len(content_bytes),
            mime_type=mime_type,
        )
        return created
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.post("/worlds/{world_id}/knowledge/note", response_model=KnowledgeSource)
async def create_note(world_id: str, payload: KnowledgeNoteCreate):
    """
    Create a text note knowledge source.
    """
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")

    return await knowledge_repository.create_source(
        world_id=world_id,
        name=payload.title.strip(),
        type="note",
        source=f"{payload.title} Note",
        extracted_text=payload.content.strip(),
        visibility=payload.visibility,
        person_id=payload.personId if payload.visibility == "person" else None,
        description=payload.description,
    )

@router.post("/worlds/{world_id}/knowledge/url", response_model=KnowledgeSource)
async def create_url_knowledge(world_id: str, payload: KnowledgeUrlCreate):
    """
    Fetch a public web page and add it as a knowledge source.
    """
    try:
        clean_text, page_title = await extract_text_from_url(payload.url)
        source_name = payload.name.strip() if payload.name and payload.name.strip() else page_title

        return await knowledge_repository.create_source(
            world_id=world_id,
            name=source_name,
            type="url",
            source=payload.url.strip(),
            extracted_text=clean_text,
            visibility=payload.visibility,
            person_id=payload.personId if payload.visibility == "person" else None,
            description=payload.description or f"Web page content from {payload.url}",
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not read this web page. Please check the URL.")

@router.patch("/worlds/{world_id}/knowledge/{knowledge_id}", response_model=KnowledgeSource)
async def update_knowledge(
    world_id: str,
    knowledge_id: str,
    payload: KnowledgeSourceUpdate,
):
    """
    Update knowledge source name, description, visibility, or note content.
    """
    updated = await knowledge_repository.update_source(
        source_id=knowledge_id,
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        new_text=payload.content,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    return updated

@router.post("/worlds/{world_id}/knowledge/{knowledge_id}/refresh", response_model=KnowledgeSource)
async def refresh_url_knowledge(world_id: str, knowledge_id: str):
    """
    Re-fetch and update a URL web page knowledge source.
    """
    src = await knowledge_repository.get_source(knowledge_id)
    if not src or src.worldId != world_id:
        raise HTTPException(status_code=404, detail="Knowledge source not found")

    if src.type != "url":
        raise HTTPException(status_code=400, detail="Only URL knowledge sources can be refreshed.")

    try:
        clean_text, page_title = await extract_text_from_url(src.source)
        updated = await knowledge_repository.update_source(
            source_id=knowledge_id,
            name=src.name or page_title,
            new_text=clean_text,
        )
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Refresh failed: {str(e)}")

@router.delete("/worlds/{world_id}/knowledge/{knowledge_id}")
async def delete_knowledge(world_id: str, knowledge_id: str):
    """
    Delete a knowledge source and all its parsed chunks.
    """
    success = await knowledge_repository.delete_source(knowledge_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    return {"status": "success", "message": "Knowledge source removed"}

@router.post("/worlds/{world_id}/knowledge/search", response_model=List[RetrievedKnowledgeChunk])
async def search_knowledge(
    world_id: str,
    payload: KnowledgeSearchQuery,
    person_id: Optional[str] = None,
):
    """
    Search relevant knowledge chunks matching a query.
    """
    return await knowledge_retriever.retrieve(
        world_id=world_id,
        person_id=person_id,
        query=payload.query,
        limit=payload.limit,
    )
