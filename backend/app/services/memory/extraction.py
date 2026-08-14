import json
import logging
import re
from typing import List, Dict, Optional, Any
from datetime import datetime

from ...schemas.memory import MemoryCreate, MemoryUpdate, ExtractedMemoryCandidate, Memory
from ..llm.ollama import OllamaProvider
from .repository import memory_repository, MemoryRepository

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a Memory Extraction Assistant for an interactive digital world.
Your job is to extract ONLY important, long-term, high-signal facts, decisions, goals, preferences, or events from the conversation.

CRITICAL RULES:
1. ONLY extract meaningful information (e.g., project launch dates, product details, user preferences, business decisions, key responsibilities).
2. DO NOT extract greetings, small talk, casual jokes, temporary questions, or trivia ("hi", "how are you", "what's up").
3. Respond ONLY with a valid JSON object matching this structure:
{
  "memories": [
    {
      "scope": "world",
      "type": "event",
      "title": "Website Launch Date",
      "content": "The company website launch is scheduled for September 15.",
      "importance": "high"
    }
  ]
}
If no meaningful memories should be stored, return {"memories": []}.
Do NOT output any markdown fences, backticks, or other text outside the JSON object.
"""

class MemoryExtractionService:
    def __init__(
        self,
        llm_provider: OllamaProvider = None,
        repository: MemoryRepository = memory_repository,
    ):
        self.llm = llm_provider or OllamaProvider()
        self.repository = repository

    def _is_trivial(self, text: str) -> bool:
        cleaned = text.lower().strip()
        trivial_phrases = {
            "hi", "hello", "hey", "good morning", "good evening", "how are you",
            "thanks", "thank you", "ok", "okay", "cool", "nice", "sounds good",
            "bye", "goodbye", "see ya", "what's up", "help",
        }
        if cleaned in trivial_phrases or len(cleaned) < 5:
            return True
        return False

    def _calculate_similarity(self, s1: str, s2: str) -> float:
        w1 = set(re.findall(r"\b\w+\b", s1.lower()))
        w2 = set(re.findall(r"\b\w+\b", s2.lower()))
        if not w1 or not w2:
            return 0.0
        return len(w1.intersection(w2)) / len(w1.union(w2))

    def _clean_json_str(self, raw_str: str) -> str:
        # Remove code blocks if present
        text = re.sub(r"^```(?:json)?", "", raw_str.strip(), flags=re.IGNORECASE)
        text = re.sub(r"```$", "", text.strip())
        
        # Find first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
            
        # Clean trailing commas before closing braces/brackets
        text = re.sub(r",\s*([\]}])", r"\1", text)
        return text

    async def extract_and_store(
        self,
        world_id: str,
        person_id: Optional[str],
        messages: List[Dict[str, str]],
    ) -> List[Memory]:
        """
        Analyze recent conversation turns and extract high-signal persistent memories.
        """
        if not messages:
            return []

        # Check if conversation is only trivial
        user_msgs = [m["content"] for m in messages if m.get("role") == "user"]
        if all(self._is_trivial(m) for m in user_msgs):
            logger.info("Skipping memory extraction for trivial small talk.")
            return []

        # Prepare messages for extraction prompt
        dialogue = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in messages[-4:]])
        extraction_messages = [
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Extract high-signal memories from this recent dialogue:\n\n{dialogue}",
            },
        ]

        try:
            response = await self.llm.generate(extraction_messages)
            cleaned_json = self._clean_json_str(response)
            
            try:
                parsed = json.loads(cleaned_json)
            except Exception as parse_err:
                logger.warning(f"JSON decode failed on extracted memory output: {cleaned_json} ({parse_err})")
                return []

            candidates = parsed.get("memories", [])
            if not isinstance(candidates, list) or len(candidates) == 0:
                return []

            existing_memories = await self.repository.list(
                world_id=world_id,
                person_id=person_id,
                is_active=True,
            )

            stored: List[Memory] = []

            for cand_data in candidates:
                try:
                    candidate = ExtractedMemoryCandidate(**cand_data)
                except Exception as val_err:
                    logger.warning(f"Skipping invalid candidate: {cand_data} ({val_err})")
                    continue

                if self._is_trivial(candidate.content):
                    continue

                # Check deduplication and conflicts
                duplicate_found = False
                for existing in existing_memories:
                    sim = self._calculate_similarity(existing.content, candidate.content)
                    
                    # Exact or very high overlap: skip duplicate
                    if sim > 0.75:
                        duplicate_found = True
                        break

                    # Same topic/title with modified details: conflict resolution / update
                    if existing.type == candidate.type and (
                        (existing.title and candidate.title and self._calculate_similarity(existing.title, candidate.title) > 0.6) or
                        sim > 0.45
                    ):
                        # Mark old memory as superseded
                        logger.info(f"Superseding memory '{existing.id}' with newer information.")
                        await self.repository.update(
                            existing.id,
                            MemoryUpdate(isActive=False),
                        )

                if duplicate_found:
                    logger.info(f"Skipping duplicate candidate: {candidate.content}")
                    continue

                # Store new memory
                created = await self.repository.create(
                    MemoryCreate(
                        worldId=world_id,
                        personId=person_id if candidate.scope == "person" else None,
                        scope=candidate.scope,
                        type=candidate.type,
                        title=candidate.title,
                        content=candidate.content,
                        importance=candidate.importance,
                        confidence=candidate.confidence,
                        source="conversation",
                    )
                )
                stored.append(created)
                logger.info(f"Stored new persistent memory [{created.id}]: {created.content}")

            return stored
        except Exception as e:
            logger.error(f"Error during memory extraction: {e}")
            return []

memory_extraction_service = MemoryExtractionService()
