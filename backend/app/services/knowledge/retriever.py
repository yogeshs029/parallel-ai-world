from abc import ABC, abstractmethod
from typing import List, Optional, Set
import re

from ...schemas.knowledge import RetrievedKnowledgeChunk
from .repository import knowledge_repository, KnowledgeRepository

STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be",
    "been", "being", "in", "that", "to", "for", "with", "as", "at", "by",
    "from", "on", "into", "of", "about", "what", "which", "who", "when",
    "where", "why", "how", "do", "does", "did", "can", "could", "would",
    "should", "you", "your", "my", "our", "we", "me", "it", "this", "these",
    "much", "tell", "show", "give",
}

class KnowledgeRetriever(ABC):
    @abstractmethod
    async def retrieve(
        self,
        world_id: str,
        person_id: Optional[str],
        query: str,
        limit: int = 4,
    ) -> List[RetrievedKnowledgeChunk]:
        pass

class KeywordKnowledgeRetriever(KnowledgeRetriever):
    def __init__(self, repository: KnowledgeRepository = knowledge_repository):
        self.repository = repository

    def _tokenize(self, text: str) -> Set[str]:
        words = re.findall(r"\b[a-zA-Z0-9₹_-]+\b", text.lower())
        return {w for w in words if w not in STOPWORDS and len(w) > 1}

    async def retrieve(
        self,
        world_id: str,
        person_id: Optional[str],
        query: str,
        limit: int = 4,
    ) -> List[RetrievedKnowledgeChunk]:
        all_chunks = await self.repository.get_chunks_for_world_and_person(
            world_id=world_id,
            person_id=person_id,
        )

        if not all_chunks:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scored_chunks = []

        for chunk in all_chunks:
            combined_text = f"{chunk.sourceName} {chunk.content}".lower()
            chunk_tokens = self._tokenize(combined_text)

            intersection = query_tokens.intersection(chunk_tokens)
            base_score = len(intersection)

            # Bonus for exact substring match of key words
            for token in query_tokens:
                if token in chunk.content.lower():
                    base_score += 1.5
                if token in chunk.sourceName.lower():
                    base_score += 2.0

            if base_score > 0:
                scored_chunks.append((
                    base_score,
                    RetrievedKnowledgeChunk(
                        chunkId=chunk.id,
                        sourceId=chunk.knowledgeSourceId,
                        sourceName=chunk.sourceName,
                        sourceType=chunk.sourceType,
                        visibility=chunk.visibility,
                        content=chunk.content,
                        score=base_score,
                    )
                ))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored_chunks[:limit]]

knowledge_retriever = KeywordKnowledgeRetriever()
