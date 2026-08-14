from abc import ABC, abstractmethod
from typing import List
from ....schemas.voice import VoiceOption

class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 1.0,
    ) -> bytes:
        """Synthesizes text into audio bytes (e.g. MP3 / WAV)."""
        pass

    @abstractmethod
    async def list_voices(self) -> List[VoiceOption]:
        """Returns the curated catalog of friendly voice options."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if the TTS service is operational."""
        pass
