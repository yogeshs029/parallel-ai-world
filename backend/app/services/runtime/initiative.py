from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

INITIATIVE_COOLDOWNS = {
    "ONLY_WHEN_ASKED": timedelta(days=365),
    "TASK_COMPLETION": timedelta(seconds=10), # Task completions can trigger immediately
    "IMPORTANT_EVENTS": timedelta(minutes=15),
    "OCCASIONAL": timedelta(hours=6),
    "PROACTIVE": timedelta(hours=2),
}

class InitiativeService:
    def __init__(self):
        # person_id -> datetime
        self._last_initiated: Dict[str, datetime] = {}
        # world_id -> list of recent timestamps
        self._world_initiative_history: Dict[str, list] = {}

    def is_quiet_hours(self, start_hour: int = 23, end_hour: int = 8) -> bool:
        """Check if current server time is in quiet hours"""
        now = datetime.now()
        current_hour = now.hour
        if start_hour > end_hour:
            # e.g., 23 to 8
            return current_hour >= start_hour or current_hour < end_hour
        else:
            return start_hour <= current_hour < end_hour

    def can_initiate(
        self,
        world_id: str,
        person_id: str,
        initiative_level: str = "TASK_COMPLETION",
        is_task_completion: bool = False,
        is_important_event: bool = False,
        respect_quiet_hours: bool = True,
    ) -> Tuple[bool, str]:
        """
        Determines whether a person can initiate a notification or conversation.
        """
        if initiative_level == "ONLY_WHEN_ASKED" and not is_task_completion:
            return False, "Persona configured to only speak when asked."

        if respect_quiet_hours and self.is_quiet_hours():
            return False, "Quiet hours active."

        now = datetime.utcnow()

        # Check persona cooldown
        cooldown = INITIATIVE_COOLDOWNS.get(initiative_level, timedelta(hours=2))
        if is_task_completion:
            cooldown = timedelta(seconds=5)
        elif is_important_event:
            cooldown = timedelta(minutes=5)

        last_time = self._last_initiated.get(person_id)
        if last_time and (now - last_time) < cooldown:
            remaining = int((cooldown - (now - last_time)).total_seconds() / 60)
            return False, f"Persona in cooldown ({remaining} minutes remaining)."

        # Check world throttle (max 10 proactive messages per hour per world)
        world_history = self._world_initiative_history.get(world_id, [])
        one_hour_ago = now - timedelta(hours=1)
        recent_world_events = [t for t in world_history if t > one_hour_ago]
        if len(recent_world_events) >= 15:
            return False, "World-level rate limit reached."

        return True, "Initiative permitted."

    def record_initiative(self, world_id: str, person_id: str):
        """Record that a persona just initiated an action/message"""
        now = datetime.utcnow()
        self._last_initiated[person_id] = now
        if world_id not in self._world_initiative_history:
            self._world_initiative_history[world_id] = []
        self._world_initiative_history[world_id].append(now)

initiative_service = InitiativeService()
