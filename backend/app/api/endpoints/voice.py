from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from typing import List, Optional
from ...schemas.voice import (
    VoiceOption,
    VoiceProfile,
    VoiceProfileUpdate,
    TTSRequest,
    VoicePreviewRequest,
    STTResponse,
    VoiceHealth,
)
from ...services.voice.service import voice_service

router = APIRouter(prefix="", tags=["voice"])

@router.get("/voice/voices", response_model=List[VoiceOption])
async def list_voices():
    """Lists curated, human-friendly voice options."""
    return await voice_service.list_voices()

@router.post("/voice/tts")
async def synthesize_speech(req: TTSRequest):
    """Synthesizes text into an MP3 audio stream."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    try:
        audio_bytes = await voice_service.synthesize(req)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

@router.post("/voice/preview")
async def preview_voice(req: VoicePreviewRequest):
    """Generates an instant fixed-phrase voice preview."""
    try:
        audio_bytes = await voice_service.preview_voice(
            voice_id=req.voiceId,
            speed=req.speed or 1.0,
            pitch=req.pitch or 1.0,
            custom_text=req.customText,
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice preview failed: {str(e)}")

@router.post("/voice/stt", response_model=STTResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """Transcribes an uploaded audio file (WAV/WebM/MP3) from microphone into text."""
    try:
        content = await file.read()
        if len(content) > 25 * 1024 * 1024: # 25MB max
            raise HTTPException(status_code=413, detail="Audio file too large")

        result = await voice_service.transcribe(
            audio_bytes=content,
            filename=file.filename or "audio.wav",
            language=language,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(e)}")

@router.get("/voice/health", response_model=VoiceHealth)
async def voice_health():
    """Returns TTS and STT engine health diagnostics."""
    return await voice_service.get_health()

@router.get("/worlds/{world_id}/people/{person_id}/voice", response_model=VoiceProfile)
async def get_person_voice(world_id: str, person_id: str):
    """Retrieves a persona's voice configuration."""
    return await voice_service.get_person_voice(world_id, person_id)

@router.put("/worlds/{world_id}/people/{person_id}/voice", response_model=VoiceProfile)
async def update_person_voice(
    world_id: str,
    person_id: str,
    update: VoiceProfileUpdate,
):
    """Updates a persona's voice configuration."""
    return await voice_service.update_person_voice(world_id, person_id, update)
