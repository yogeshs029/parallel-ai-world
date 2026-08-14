import asyncio
import io
import logging
from typing import Optional
import numpy as np
import soundfile as sf
import scipy.signal
from .base import STTProvider

logger = logging.getLogger(__name__)

class WhisperSTTProvider(STTProvider):
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            import whisper
            logger.info(f"Loading Whisper STT model '{self.model_name}'...")
            self._model = whisper.load_model(self.model_name)
            logger.info("Whisper STT model loaded successfully.")
        return self._model

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language: Optional[str] = None,
    ) -> str:
        if not audio_bytes or len(audio_bytes) < 100:
            return ""

        try:
            loop = asyncio.get_running_loop()

            def _sync_transcribe():
                # Read audio bytes directly in-memory using soundfile (No ffmpeg dependency required)
                try:
                    data, sample_rate = sf.read(io.BytesIO(audio_bytes), dtype="float32")
                except Exception as read_err:
                    logger.warning(f"Soundfile direct read failed ({read_err}), fallback empty")
                    return ""

                # Convert to mono if multi-channel
                if len(data.shape) > 1:
                    data = data.mean(axis=1)

                # Resample to 16000 Hz if necessary (Whisper expects 16kHz float32)
                target_sr = 16000
                if sample_rate != target_sr:
                    num_target_samples = int(len(data) * target_sr / sample_rate)
                    data = scipy.signal.resample(data, num_target_samples).astype(np.float32)

                # Ensure float32 array
                audio_np = data.astype(np.float32)

                model = self._get_model()
                kwargs = {}
                if language:
                    kwargs["language"] = language

                result = model.transcribe(audio_np, fp16=False, **kwargs)
                return result.get("text", "").strip()

            transcript = await loop.run_in_executor(None, _sync_transcribe)
            return transcript
        except Exception as e:
            logger.error(f"Whisper in-memory transcription failed: {e}")
            raise e

    async def health_check(self) -> bool:
        try:
            import whisper
            return True
        except Exception as e:
            logger.warning(f"Whisper STT health check failed: {e}")
            return False
