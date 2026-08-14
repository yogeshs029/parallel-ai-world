import edge_tts
import io
import logging
from typing import List
from .base import TTSProvider
from ....schemas.voice import VoiceOption

logger = logging.getLogger(__name__)

CURATED_VOICES: List[VoiceOption] = [
    VoiceOption(
        id="en-US-AvaNeural",
        name="Warm Female",
        gender="female",
        language="en-US",
        description="Warm, clear, and empathetic tone. Ideal for leaders, mentors, and collaborative guides.",
        previewText="Hi! I'm Maya. It's really great to work with you on our projects.",
        accent="American",
        isDefault=True,
    ),
    VoiceOption(
        id="en-US-AndrewNeural",
        name="Professional Male",
        gender="male",
        language="en-US",
        description="Confident, articulate, and executive tone. Ideal for leaders, strategists, and managers.",
        previewText="Hello, I'm Rahul. Let's focus on high-impact objectives today.",
        accent="American",
    ),
    VoiceOption(
        id="en-US-EmmaNeural",
        name="Friendly Female",
        gender="female",
        language="en-US",
        description="Lively, cheerful, and approachable tone. Great for creative problem solvers.",
        previewText="Hey there! Let's explore some new ideas and make things happen.",
        accent="American",
    ),
    VoiceOption(
        id="en-US-BrianNeural",
        name="Deep Male",
        gender="male",
        language="en-US",
        description="Calm, resonant, and reassuring deep voice. Ideal for deep technical analysis.",
        previewText="Greetings. I've analyzed the system architecture and have recommendations ready.",
        accent="American",
    ),
    VoiceOption(
        id="en-IN-NeerjaNeural",
        name="Indian English Female",
        gender="female",
        language="en-IN",
        description="Crisp, warm, and natural Indian English accent.",
        previewText="Namaste. I'm Priya, ready to optimize our business operations and analytics.",
        accent="Indian",
    ),
    VoiceOption(
        id="en-IN-PrabhatNeural",
        name="Indian English Male",
        gender="male",
        language="en-IN",
        description="Professional and grounded Indian English accent.",
        previewText="Hello. Let's review the milestones and take action on key priorities.",
        accent="Indian",
    ),
    VoiceOption(
        id="en-GB-SoniaNeural",
        name="British Female",
        gender="female",
        language="en-GB",
        description="Sophisticated, calm British English voice.",
        previewText="Good day. I'm pleased to assist you with our strategic initiatives.",
        accent="British",
    ),
    VoiceOption(
        id="en-AU-NatashaNeural",
        name="Australian Female",
        gender="female",
        language="en-AU",
        description="Energetic, clear Australian accent.",
        previewText="G'day! Let's dive in and get this moving forward.",
        accent="Australian",
    ),
    VoiceOption(
        id="hi-IN-SwaraNeural",
        name="Hindi Female",
        gender="female",
        language="hi-IN",
        description="Expressive and natural Hindi speaker.",
        previewText="नमस्ते, मैं आपकी सहायता के लिए तैयार हूँ।",
        accent="Hindi",
    ),
    VoiceOption(
        id="hi-IN-MadhurNeural",
        name="Hindi Male",
        gender="male",
        language="hi-IN",
        description="Clear and professional Hindi speaker.",
        previewText="नमस्ते, आइए अपने प्रोजेक्ट पर मिलकर काम करें।",
        accent="Hindi",
    ),
]

class EdgeTTSProvider(TTSProvider):
    def __init__(self):
        self._voices_map = {v.id: v for v in CURATED_VOICES}

    async def list_voices(self) -> List[VoiceOption]:
        return CURATED_VOICES

    async def synthesize(
        self,
        text: str,
        voice_id: str = "en-US-AvaNeural",
        speed: float = 1.0,
        pitch: float = 1.0,
    ) -> bytes:
        """
        Synthesizes text into high quality MP3 audio stream using edge-tts.
        Rate format: '+0%' or '-10%' or '+20%'
        Pitch format: '+0Hz' or '-10Hz' or '+20Hz'
        """
        clean_text = text.strip()
        if not clean_text:
            return b""

        # Voice security check: Must be in curated voices
        if voice_id not in self._voices_map:
            logger.warning(f"Requested voice [{voice_id}] not found in curated catalog, defaulting to en-US-AvaNeural")
            voice_id = "en-US-AvaNeural"

        # Rate mapping (0.5x -> -50%, 1.0x -> +0%, 1.5x -> +50%)
        rate_pct = int(round((speed - 1.0) * 100))
        rate_str = f"{'+' if rate_pct >= 0 else ''}{rate_pct}%"

        # Pitch mapping (0.8x -> -20Hz, 1.0x -> +0Hz, 1.2x -> +20Hz)
        pitch_hz = int(round((pitch - 1.0) * 50))
        pitch_str = f"{'+' if pitch_hz >= 0 else ''}{pitch_hz}Hz"

        try:
            communicate = edge_tts.Communicate(
                text=clean_text,
                voice=voice_id,
                rate=rate_str,
                pitch=pitch_str,
            )

            audio_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            return audio_buffer.getvalue()
        except Exception as e:
            logger.error(f"EdgeTTS synthesis failed: {e}")
            raise e

    async def health_check(self) -> bool:
        try:
            sample = await self.synthesize("Health check", voice_id="en-US-AvaNeural")
            return len(sample) > 0
        except Exception as e:
            logger.warn(f"EdgeTTS health check failed: {e}")
            return False
