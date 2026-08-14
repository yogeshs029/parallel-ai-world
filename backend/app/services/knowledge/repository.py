from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ...schemas.knowledge import (
    KnowledgeSource,
    KnowledgeChunk,
    KnowledgeType,
    KnowledgeVisibility,
    KnowledgeStatus,
)
from .chunker import chunking_service

SEED_SOURCES = [
    {
        "id": "know-world-1",
        "worldId": "world-company",
        "personId": None,
        "name": "Company Handbook",
        "description": "General company policies, benefits, and workplace culture.",
        "type": "document",
        "source": "Company Handbook.pdf",
        "status": "ready",
        "visibility": "world",
        "extractedText": (
            "Welcome to Parallel Furniture Co.\n\n"
            "We design, manufacture, and deliver sustainable, solid hardwood furniture direct to homeowners.\n\n"
            "Workplace Culture & Benefits:\n"
            "- Flexible working hours with remote-friendly collaboration.\n"
            "- 25 days of annual paid time off (PTO) plus regional holidays.\n"
            "- Comprehensive medical and dental health coverage for employees and dependents.\n"
            "- Annual ₹50,000 learning and professional development stipend.\n"
            "- All products include a lifetime structural warranty and 30-day in-home return policy."
        ),
    },
    {
        "id": "know-world-2",
        "worldId": "world-company",
        "personId": None,
        "name": "Product Catalog",
        "description": "Complete 2026 furniture product pricing and specifications.",
        "type": "document",
        "source": "Product Catalog.pdf",
        "status": "ready",
        "visibility": "world",
        "extractedText": (
            "Parallel Furniture Co. - Official 2026 Product Catalog & Pricing Guide\n\n"
            "1. Premium Handmade Dining Table\n"
            "- Material: Grade-A Sustainable Solid Teakwood\n"
            "- Seating: 6 to 8 people\n"
            "- Dimensions: 78\" L x 38\" W x 30\" H\n"
            "- Price: ₹24,999 (Includes free white-glove home delivery and assembly)\n"
            "- Warranty: 10-Year Master Craftsmanship Guarantee\n\n"
            "2. Ergonomic Hardwood Study Desk\n"
            "- Material: Solid Oak with Walnut stain and matte protective finish\n"
            "- Features: Integrated dual cable management tray and soft-close drawer\n"
            "- Price: ₹18,499\n\n"
            "3. Artisan Handcrafted Coffee Table\n"
            "- Material: Reclaimed Rosewood with solid brushed brass joinery\n"
            "- Price: ₹11,999"
        ),
    },
    {
        "id": "know-world-3",
        "worldId": "world-company",
        "personId": None,
        "name": "Company Mission",
        "description": "Core purpose, values, and environmental commitment.",
        "type": "note",
        "source": "Company Mission Note",
        "status": "ready",
        "visibility": "world",
        "extractedText": (
            "Company Mission & Sustainability Promise:\n\n"
            "Our mission is to build affordable, heirloom-quality solid wood furniture that transforms everyday homes into inspiring spaces.\n\n"
            "Environmental Commitment:\n"
            "We plant two native trees for every single tree harvested in our furniture crafting process."
        ),
    },
    {
        "id": "know-maya-1",
        "worldId": "world-company",
        "personId": "person-maya",
        "name": "Developer Guide",
        "description": "Technical architecture, frontend conventions, and deployment workflows.",
        "type": "document",
        "source": "Developer Guide.md",
        "status": "ready",
        "visibility": "person",
        "extractedText": (
            "Maya's Engineering Guide - Frontend Architecture:\n\n"
            "The web application uses React 18 with TypeScript, Vite, and Tailwind CSS.\n"
            "All business logic resides in modular service layers rather than embedded in components.\n"
            "State persistence uses strongly typed repository abstractions compatible with backend sync."
        ),
    },
    {
        "id": "know-maya-2",
        "worldId": "world-company",
        "personId": "person-maya",
        "name": "Coding Standards",
        "description": "Quality guidelines and engineering rules followed by Maya.",
        "type": "note",
        "source": "Coding Standards Note",
        "status": "ready",
        "visibility": "person",
        "extractedText": (
            "Frontend Coding Standards:\n"
            "1. Strict TypeScript with zero 'any' types allowed.\n"
            "2. Accessible HTML5 semantics with descriptive ARIA labels.\n"
            "3. Comprehensive unit and visual integration verification before merging.\n"
            "4. Sub-second initial render targets with clean bundle splitting."
        ),
    },
]

class KnowledgeRepository(ABC):
    @abstractmethod
    async def get_source(self, source_id: str) -> Optional[KnowledgeSource]:
        pass

    @abstractmethod
    async def list_sources(
        self,
        world_id: str,
        person_id: Optional[str] = None,
        visibility: Optional[KnowledgeVisibility] = None,
        type: Optional[KnowledgeType] = None,
    ) -> List[KnowledgeSource]:
        pass

    @abstractmethod
    async def create_source(
        self,
        world_id: str,
        name: str,
        type: KnowledgeType,
        source: str,
        extracted_text: str,
        visibility: KnowledgeVisibility = "world",
        person_id: Optional[str] = None,
        description: Optional[str] = None,
        size: Optional[int] = None,
        mime_type: Optional[str] = None,
    ) -> KnowledgeSource:
        pass

    @abstractmethod
    async def update_source(
        self,
        source_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        visibility: Optional[KnowledgeVisibility] = None,
        new_text: Optional[str] = None,
    ) -> Optional[KnowledgeSource]:
        pass

    @abstractmethod
    async def delete_source(self, source_id: str) -> bool:
        pass

    @abstractmethod
    async def get_chunks_for_world_and_person(
        self,
        world_id: str,
        person_id: Optional[str] = None,
    ) -> List[KnowledgeChunk]:
        pass

class InMemoryKnowledgeRepository(KnowledgeRepository):
    def __init__(self):
        self._sources: Dict[str, KnowledgeSource] = {}
        self._chunks: Dict[str, KnowledgeChunk] = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        for raw in SEED_SOURCES:
            source_id = raw["id"]
            text = raw.get("extractedText", "")
            raw_chunks = chunking_service.split_text(text)
            
            source = KnowledgeSource(
                id=source_id,
                worldId=raw["worldId"],
                personId=raw.get("personId"),
                name=raw["name"],
                description=raw.get("description"),
                type=raw["type"], # type: ignore
                source=raw["source"],
                status=raw.get("status", "ready"), # type: ignore
                visibility=raw.get("visibility", "world"), # type: ignore
                extractedText=text,
                chunkCount=len(raw_chunks),
                size=len(text.encode("utf-8")),
                mimeType="text/plain",
                createdAt=datetime.utcnow().isoformat(),
                updatedAt=datetime.utcnow().isoformat(),
            )
            self._sources[source_id] = source

            for idx, c_text in enumerate(raw_chunks):
                chunk_id = f"chunk-{source_id}-{idx}"
                chunk = KnowledgeChunk(
                    id=chunk_id,
                    knowledgeSourceId=source_id,
                    worldId=source.worldId,
                    personId=source.personId,
                    visibility=source.visibility,
                    sourceName=source.name,
                    sourceType=source.type,
                    content=c_text,
                    chunkIndex=idx,
                    createdAt=source.createdAt,
                )
                self._chunks[chunk_id] = chunk

    async def get_source(self, source_id: str) -> Optional[KnowledgeSource]:
        src = self._sources.get(source_id)
        if src:
            return src.model_copy()
        return None

    async def list_sources(
        self,
        world_id: str,
        person_id: Optional[str] = None,
        visibility: Optional[KnowledgeVisibility] = None,
        type: Optional[KnowledgeType] = None,
    ) -> List[KnowledgeSource]:
        results: List[KnowledgeSource] = []
        for src in self._sources.values():
            if src.worldId != world_id:
                continue
            if visibility and src.visibility != visibility:
                continue
            if type and src.type != type:
                continue
            # If listing for a specific person, include person's private knowledge + world knowledge
            if person_id is not None:
                if src.visibility == "person" and src.personId != person_id:
                    continue
            results.append(src.model_copy())

        results.sort(key=lambda s: s.createdAt, reverse=True)
        return results

    async def create_source(
        self,
        world_id: str,
        name: str,
        type: KnowledgeType,
        source: str,
        extracted_text: str,
        visibility: KnowledgeVisibility = "world",
        person_id: Optional[str] = None,
        description: Optional[str] = None,
        size: Optional[int] = None,
        mime_type: Optional[str] = None,
    ) -> KnowledgeSource:
        source_id = f"know-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()
        raw_chunks = chunking_service.split_text(extracted_text)

        new_source = KnowledgeSource(
            id=source_id,
            worldId=world_id,
            personId=person_id if visibility == "person" else None,
            name=name.strip(),
            description=description.strip() if description else None,
            type=type,
            source=source.strip(),
            status="ready",
            size=size or len(extracted_text.encode("utf-8")),
            mimeType=mime_type or "text/plain",
            visibility=visibility,
            extractedText=extracted_text,
            chunkCount=len(raw_chunks),
            createdAt=now,
            updatedAt=now,
        )
        self._sources[source_id] = new_source

        # Store chunks
        for idx, c_text in enumerate(raw_chunks):
            chunk_id = f"chunk-{source_id}-{idx}"
            chunk = KnowledgeChunk(
                id=chunk_id,
                knowledgeSourceId=source_id,
                worldId=world_id,
                personId=new_source.personId,
                visibility=visibility,
                sourceName=new_source.name,
                sourceType=type,
                content=c_text,
                chunkIndex=idx,
                createdAt=now,
            )
            self._chunks[chunk_id] = chunk

        return new_source.model_copy()

    async def update_source(
        self,
        source_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        visibility: Optional[KnowledgeVisibility] = None,
        new_text: Optional[str] = None,
    ) -> Optional[KnowledgeSource]:
        src = self._sources.get(source_id)
        if not src:
            return None

        updated_dict = src.model_dump()
        if name is not None:
            updated_dict["name"] = name.strip()
        if description is not None:
            updated_dict["description"] = description.strip()
        if visibility is not None:
            updated_dict["visibility"] = visibility
        
        now = datetime.utcnow().isoformat()
        updated_dict["updatedAt"] = now

        # If text content changed, rebuild chunks
        if new_text is not None:
            updated_dict["extractedText"] = new_text
            raw_chunks = chunking_service.split_text(new_text)
            updated_dict["chunkCount"] = len(raw_chunks)

            # Remove old chunks
            to_remove = [k for k, v in self._chunks.items() if v.knowledgeSourceId == source_id]
            for k in to_remove:
                del self._chunks[k]

            # Add new chunks
            for idx, c_text in enumerate(raw_chunks):
                chunk_id = f"chunk-{source_id}-{idx}"
                chunk = KnowledgeChunk(
                    id=chunk_id,
                    knowledgeSourceId=source_id,
                    worldId=src.worldId,
                    personId=src.personId,
                    visibility=updated_dict["visibility"],
                    sourceName=updated_dict["name"],
                    sourceType=src.type,
                    content=c_text,
                    chunkIndex=idx,
                    createdAt=now,
                )
                self._chunks[chunk_id] = chunk

        updated_source = KnowledgeSource(**updated_dict)
        self._sources[source_id] = updated_source
        return updated_source.model_copy()

    async def delete_source(self, source_id: str) -> bool:
        if source_id in self._sources:
            del self._sources[source_id]
            # Remove associated chunks
            to_remove = [k for k, v in self._chunks.items() if v.knowledgeSourceId == source_id]
            for k in to_remove:
                del self._chunks[k]
            return True
        return False

    async def get_chunks_for_world_and_person(
        self,
        world_id: str,
        person_id: Optional[str] = None,
    ) -> List[KnowledgeChunk]:
        valid_chunks: List[KnowledgeChunk] = []
        for chunk in self._chunks.values():
            if chunk.worldId != world_id:
                continue
            # Privacy rule: World knowledge is visible to everyone; Person knowledge is only visible to that Person
            if chunk.visibility == "person":
                if not person_id or chunk.personId != person_id:
                    continue
            valid_chunks.append(chunk.model_copy())
        return valid_chunks

knowledge_repository = InMemoryKnowledgeRepository()
