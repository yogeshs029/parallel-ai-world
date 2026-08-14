import re
from typing import List

class ChunkingService:
    def __init__(self, target_chunk_size: int = 500, chunk_overlap: int = 80):
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        """
        Split text into logical chunks respecting paragraph and sentence boundaries.
        """
        if not text or not text.strip():
            return []

        cleaned = text.strip()
        if len(cleaned) <= self.target_chunk_size:
            return [cleaned]

        # 1. Split into paragraphs first
        paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current_chunk = ""

        for p in paragraphs:
            # If paragraph itself is longer than chunk size, split by sentences
            if len(p) > self.target_chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", p)
                for s in sentences:
                    s_clean = s.strip()
                    if not s_clean:
                        continue
                    if len(current_chunk) + len(s_clean) + 1 <= self.target_chunk_size:
                        current_chunk = f"{current_chunk} {s_clean}".strip()
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = s_clean
            else:
                if len(current_chunk) + len(p) + 2 <= self.target_chunk_size:
                    current_chunk = f"{current_chunk}\n\n{p}".strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = p

        if current_chunk:
            chunks.append(current_chunk)

        # Apply slight overlap between consecutive chunks if practical
        if len(chunks) > 1 and self.chunk_overlap > 0:
            overlapped_chunks = [chunks[0]]
            for i in range(1, len(chunks)):
                prev_text = chunks[i - 1]
                overlap_prefix = prev_text[-self.chunk_overlap:].strip()
                if " " in overlap_prefix:
                    overlap_prefix = overlap_prefix[overlap_prefix.index(" ") + 1:]
                merged = f"...{overlap_prefix} {chunks[i]}" if overlap_prefix else chunks[i]
                overlapped_chunks.append(merged.strip())
            return overlapped_chunks

        return chunks

chunking_service = ChunkingService()
