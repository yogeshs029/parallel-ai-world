from abc import ABC, abstractmethod
from typing import List, Optional, Set
import re

from ...schemas.memory import Memory
from .repository import memory_repository, MemoryRepository

STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be",
    "been", "being", "in", "that", "to", "for", "with", "as", "at", "by",
    "from", "on", "into", "of", "about", "what", "which", "who", "when",
    "where", "why", "how", "do", "does", "did", "can", "could", "would",
    "should", "you", "your", "my", "our", "we", "me", "it", "this", "these",
}

IMPORTANCE_WEIGHTS = {
    "critical": 4.0,
    "high": 2.5,
    "medium": 1.5,
    "low": 1.0,
}

class MemoryRetriever(ABC):
    @abstractmethod
    async def retrieve(
        self,
        world_id: str,
        person_id: Optional[str],
        query: str,
        limit: int = 5,
    ) -> List[Memory]:
        pass

class KeywordMemoryRetriever(MemoryRetriever):
    def __init__(self, repository: MemoryRepository = memory_repository):
        self.repository = repository

    def _tokenize(self, text: str) -> Set[str]:
        words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
        return {w for w in words if w not in STOPWORDS and len(w) > 1}

    async def retrieve(
        self,
        world_id: str,
        person_id: Optional[str],
        query: str,
        limit: int = 5,
    ) -> List[Memory]:
        # 1. Fetch all active memories for world + person
        all_memories = await self.repository.list(
            world_id=world_id,
            person_id=person_id,
            is_active=True,
        )

        if not all_memories:
            return []

        query_tokens = self._tokenize(query)
        scored_memories = []

        for mem in all_memories:
            mem_text = f"{mem.title or ''} {mem.content} {mem.type}".lower()
            mem_tokens = self._tokenize(mem_text)

            # Intersection score
            intersection = query_tokens.intersection(mem_tokens)
            base_score = len(intersection)

            # Direct substring match bonus
            for token in query_tokens:
                if token in mem.content.lower():
                    base_score += 1.5

            # Importance multiplier
            weight = IMPORTANCE_WEIGHTS.get(mem.importance, 1.0)
            final_score = base_score * weight

            # Critical memories receive baseline relevance
            if mem.importance == "critical" and final_score == 0:
                final_score = 0.5

            if final_score > 0:
                scored_memories.append((final_score, mem))

        # Sort by score descending
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [mem for _, mem in scored_memories[:limit]]

memory_retriever = KeywordMemoryRetriever()
