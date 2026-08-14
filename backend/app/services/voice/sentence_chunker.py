import re
from typing import List, Tuple

class SentenceChunker:
    """
    Detects natural sentence boundaries in streaming text
    so speech synthesis can begin progressively without waiting for full completion.
    """
    # Regex split on sentence terminators followed by whitespace, newline, or end of text
    SENTENCE_END_REGEX = re.compile(r'([.!?]+[\s\n]+|[\n]{2,})')

    def __init__(self, min_length: int = 15):
        self.min_length = min_length
        self.buffer = ""

    def add_token(self, token: str) -> List[str]:
        """
        Appends streamed token and extracts any completed sentences.
        """
        self.buffer += token
        return self._extract_sentences(is_final=False)

    def flush(self) -> List[str]:
        """
        Flushes any remaining text in the buffer as the final sentence.
        """
        return self._extract_sentences(is_final=True)

    def _extract_sentences(self, is_final: bool) -> List[str]:
        ready_sentences: List[str] = []

        if is_final:
            text = self.buffer.strip()
            self.buffer = ""
            if text:
                ready_sentences.append(text)
            return ready_sentences

        parts = self.SENTENCE_END_REGEX.split(self.buffer)
        if len(parts) > 1:
            # We have at least one delimiter
            # parts will alternate: [text, delimiter, text, delimiter, trailing_text]
            accumulated = ""
            i = 0
            while i < len(parts) - 1:
                sentence_part = parts[i]
                delimiter = parts[i + 1]
                complete = (sentence_part + delimiter).strip()
                if len(complete) >= self.min_length or complete.endswith(('.', '!', '?')):
                    ready_sentences.append(complete)
                else:
                    # Accumulate with previous if too short
                    if ready_sentences:
                        ready_sentences[-1] += " " + complete
                    else:
                        accumulated += complete
                i += 2

            # The last element in parts is the incomplete remainder
            self.buffer = accumulated + parts[-1]

        return ready_sentences

def split_into_sentences(text: str) -> List[str]:
    """Helper to split a complete text into clean spoken sentences."""
    if not text:
        return []
    chunker = SentenceChunker(min_length=10)
    sentences = chunker.add_token(text) + chunker.flush()
    return [s.strip() for s in sentences if s.strip()]
