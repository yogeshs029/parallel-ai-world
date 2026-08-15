import asyncio
from typing import Dict
from datetime import datetime
from ...schemas.voice import VoiceProfile, VoiceProfileUpdate

INITIAL_PROFILES: Dict[str, VoiceProfile] = {}

class VoiceProfileRepository:
    def __init__(self):
        self._profiles: Dict[str, VoiceProfile] = {k: v.model_copy() for k, v in INITIAL_PROFILES.items()}
        self._lock = asyncio.Lock()

    def _get_or_create_default(self, world_id: str, person_id: str) -> VoiceProfile:
        if person_id in self._profiles:
            return self._profiles[person_id]

        profile = VoiceProfile(
            personId=person_id,
            worldId=world_id,
            enabled=True,
            voiceId="en-US-AvaNeural",
            voiceName="Warm Female",
            voiceGender="female",
            language="en-US",
            speakingRate=1.0,
            pitch=1.0,
            volume=1.0,
            autoSpeak=True,
        )
        self._profiles[person_id] = profile
        return profile

    async def get_profile(self, world_id: str, person_id: str) -> VoiceProfile:
        async with self._lock:
            profile = self._get_or_create_default(world_id, person_id)
            return profile.model_copy()

    async def update_profile(
        self,
        world_id: str,
        person_id: str,
        update: VoiceProfileUpdate,
    ) -> VoiceProfile:
        async with self._lock:
            current = self._get_or_create_default(world_id, person_id)
            updated_data = current.model_dump()

            for field, val in update.model_dump(exclude_unset=True).items():
                if val is not None:
                    updated_data[field] = val

            updated_data["updatedAt"] = datetime.utcnow().isoformat()
            new_profile = VoiceProfile(**updated_data)
            self._profiles[person_id] = new_profile
            return new_profile.model_copy()

voice_profile_repository = VoiceProfileRepository()
