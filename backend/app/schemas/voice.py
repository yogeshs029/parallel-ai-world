from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

VoiceGender = Literal["female", "male", "neutral"]

class VoiceOption(BaseModel):
    id: str
    name: str
    gender: VoiceGender
    language: str = "en-US"
    description: str
    previewText: str = "Hi, I'm happy to help you in this world."
    accent: Optional[str] = "American"
    isDefault: bool = False

class VoiceProfile(BaseModel):
    personId: str
    worldId: str
    enabled: bool = True
    voiceId: str = "en-US-AvaNeural"
    voiceName: str = "Warm Female"
    voiceGender: VoiceGender = "female"
    language: str = "en-US"
    speakingRate: float = 1.0 # 0.5 to 2.0
    pitch: float = 1.0 # 0.5 to 1.5
    volume: float = 1.0 # 0.1 to 1.0
    autoSpeak: bool = True
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class VoiceProfileUpdate(BaseModel):
    enabled: Optional[bool] = None
    voiceId: Optional[str] = None
    voiceName: Optional[str] = None
    voiceGender: Optional[VoiceGender] = None
    language: Optional[str] = None
    speakingRate: Optional[float] = None
    pitch: Optional[float] = None
    volume: Optional[float] = None
    autoSpeak: Optional[bool] = None

class TTSRequest(BaseModel):
    text: str
    voiceId: Optional[str] = "en-US-AvaNeural"
    language: Optional[str] = "en-US"
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 1.0
    personId: Optional[str] = None

class VoicePreviewRequest(BaseModel):
    voiceId: str
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 1.0
    customText: Optional[str] = None

class STTResponse(BaseModel):
    transcript: str
    language: Optional[str] = "en"
    duration: Optional[float] = None
    confidence: Optional[float] = 0.95

class VoiceHealth(BaseModel):
    ttsAvailable: bool
    sttAvailable: bool
    ttsProvider: str
    sttProvider: str
    supportedVoicesCount: int
