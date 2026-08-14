import logging
from typing import List, Optional
from ...schemas.voice import (
    VoiceOption,
    VoiceProfile,
    VoiceProfileUpdate,
    TTSRequest,
    STTResponse,
    VoiceHealth,
)
from .tts.edge_tts_provider import EdgeTTSProvider
from .stt.whisper_provider import WhisperSTTProvider
from .repository import voice_profile_repository
from .sentence_chunker import split_into_sentences

logger = logging.getLogger(__name__)

class VoiceService:
    def __init__(self):
        self.tts = EdgeTTSProvider()
        self.stt = WhisperSTTProvider(model_name="base")
        self.repository = voice_profile_repository

    async def list_voices(self) -> List[VoiceOption]:
        return await self.tts.list_voices()

    async def synthesize(self, req: TTSRequest) -> bytes:
        return await self.tts.synthesize(
            text=req.text,
            voice_id=req.voiceId or "en-US-AvaNeural",
            speed=req.speed or 1.0,
            pitch=req.pitch or 1.0,
        )

    async def preview_voice(self, voice_id: str, speed: float = 1.0, pitch: float = 1.0, custom_text: Optional[str] = None) -> bytes:
        voices = await self.tts.list_voices()
        voice_map = {v.id: v for v in voices}
        selected = voice_map.get(voice_id)

        preview_text = custom_text or (selected.previewText if selected else "Hi, I'm glad to meet you.")
        return await self.tts.synthesize(
            text=preview_text,
            voice_id=voice_id,
            speed=speed,
            pitch=pitch,
        )

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.wav", language: Optional[str] = None) -> STTResponse:
        transcript = await self.stt.transcribe(audio_bytes=audio_bytes, filename=filename, language=language)
        return STTResponse(
            transcript=transcript,
            language=language or "en",
            confidence=0.95 if transcript else 0.0,
        )

    async def get_health(self) -> VoiceHealth:
        tts_ok = await self.tts.health_check()
        stt_ok = await self.stt.health_check()
        voices = await self.tts.list_voices()
        return VoiceHealth(
            ttsAvailable=tts_ok,
            sttAvailable=stt_ok,
            ttsProvider="EdgeTTS",
            sttProvider="Whisper",
            supportedVoicesCount=len(voices),
        )

    async def get_person_voice(self, world_id: str, person_id: str) -> VoiceProfile:
        return await self.repository.get_profile(world_id, person_id)

    async def update_person_voice(self, world_id: str, person_id: str, update: VoiceProfileUpdate) -> VoiceProfile:
        return await self.repository.update_profile(world_id, person_id, update)

voice_service = VoiceService()
