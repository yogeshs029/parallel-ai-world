from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ...schemas.memory import Memory, MemoryCreate, MemoryUpdate, MemoryScope

INITIAL_MEMORIES: List[Dict[str, Any]] = []

class MemoryRepository(ABC):
    @abstractmethod
    async def get(self, memory_id: str) -> Optional[Memory]:
        pass

    @abstractmethod
    async def list(
        self,
        world_id: str,
        person_id: Optional[str] = None,
        scope: Optional[MemoryScope] = None,
        is_active: bool = True,
    ) -> List[Memory]:
        pass

    @abstractmethod
    async def create(self, data: MemoryCreate) -> Memory:
        pass

    @abstractmethod
    async def update(self, memory_id: str, data: MemoryUpdate) -> Optional[Memory]:
        pass

    @abstractmethod
    async def delete(self, memory_id: str) -> bool:
        pass

    @abstractmethod
    async def clear_person(self, world_id: str, person_id: str) -> int:
        pass

    @abstractmethod
    async def clear_world(self, world_id: str) -> int:
        pass

class InMemoryMemoryRepository(MemoryRepository):
    def __init__(self):
        self._store: Dict[str, Memory] = {}
        for item in INITIAL_MEMORIES:
            self._store[item["id"]] = Memory(**item)

    def reset(self):
        self._store.clear()

    async def get(self, memory_id: str) -> Optional[Memory]:
        mem = self._store.get(memory_id)
        if mem:
            return mem.model_copy()
        return None

    async def list(
        self,
        world_id: str,
        person_id: Optional[str] = None,
        scope: Optional[MemoryScope] = None,
        is_active: bool = True,
    ) -> List[Memory]:
        results: List[Memory] = []
        for mem in self._store.values():
            if mem.worldId != world_id:
                continue
            if is_active and not mem.isActive:
                continue
            if scope and mem.scope != scope:
                continue
            # If person_id specified, include personal memories for that person + world memories
            if person_id is not None:
                if mem.scope == "person" and mem.personId != person_id:
                    continue
            results.append(mem.model_copy())

        # Sort by createdAt descending
        results.sort(key=lambda m: m.createdAt, reverse=True)
        return results

    async def create(self, data: MemoryCreate) -> Memory:
        memory_id = f"mem-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()
        
        new_memory = Memory(
            id=memory_id,
            worldId=data.worldId,
            personId=data.personId if data.scope == "person" else None,
            scope=data.scope,
            type=data.type,
            title=data.title or (data.content[:30] + "..." if len(data.content) > 30 else data.content),
            content=data.content.strip(),
            importance=data.importance,
            confidence=data.confidence,
            source=data.source,
            isActive=True,
            createdAt=now,
            updatedAt=now,
            metadata=data.metadata or {},
        )
        self._store[memory_id] = new_memory
        return new_memory.model_copy()

    async def update(self, memory_id: str, data: MemoryUpdate) -> Optional[Memory]:
        current = self._store.get(memory_id)
        if not current:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        updated_data = current.model_dump()
        updated_data.update(update_dict)
        updated_data["updatedAt"] = datetime.utcnow().isoformat()

        updated_memory = Memory(**updated_data)
        self._store[memory_id] = updated_memory
        return updated_memory.model_copy()

    async def delete(self, memory_id: str) -> bool:
        if memory_id in self._store:
            del self._store[memory_id]
            return True
        return False

    async def clear_person(self, world_id: str, person_id: str) -> int:
        to_delete = [
            k for k, v in self._store.items()
            if v.worldId == world_id and v.personId == person_id
        ]
        for k in to_delete:
            del self._store[k]
        return len(to_delete)

    async def clear_world(self, world_id: str) -> int:
        to_delete = [
            k for k, v in self._store.items()
            if v.worldId == world_id and v.scope == "world"
        ]
        for k in to_delete:
            del self._store[k]
        return len(to_delete)

# Global repository instance
memory_repository = InMemoryMemoryRepository()
