from abc import ABC, abstractmethod
from typing import Optional

class STTProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language: Optional[str] = None,
    ) -> str:
        """Transcribes audio bytes into text."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if the STT engine is ready."""
        pass
