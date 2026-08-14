from typing import Tuple, Optional
from .repositories import permission_repository
from ...schemas.runtime import WorldActionType

ACTION_PERMISSION_MAP = {
    "CREATE_TASK": "taskCreate",
    "UPDATE_TASK": "taskEdit",
    "CREATE_PROJECT": "projectCreate",
    "UPDATE_PROJECT": "projectEdit",
    "ADD_KNOWLEDGE": "knowledgeCreate",
    "UPDATE_KNOWLEDGE": "knowledgeEdit",
    "CREATE_PERSON": "peopleCreate",
    "UPDATE_PERSON": "peopleEdit",
    "UPDATE_WORLD": "worldEdit",
    "MESSAGE_USER": "messageUser",
}

class PermissionService:
    async def evaluate_action(
        self, world_id: str, person_id: str, action_type: WorldActionType
    ) -> Tuple[bool, bool, str]:
        """
        Returns (is_permitted, requires_approval, reason).
        If directly permitted -> (True, False, "Action permitted by configuration")
        If requires approval -> (False, True, "Action requires user approval")
        If strictly denied -> (False, False, "Action blocked by permissions")
        """
        perms = await permission_repository.get_permissions(world_id, person_id)
        perm_field = ACTION_PERMISSION_MAP.get(action_type)

        if not perm_field:
            return False, False, f"Unknown action type: {action_type}"

        has_perm = getattr(perms, perm_field, False)

        if has_perm:
            return True, False, "Action permitted by persona permissions."

        # High impact actions can be escalated to approval
        if action_type in ["UPDATE_WORLD", "CREATE_PERSON", "UPDATE_PERSON", "UPDATE_KNOWLEDGE"]:
            return False, True, f"Modifying {action_type.lower()} requires user approval."

        return False, False, f"Permission '{perm_field}' is disabled for this persona."

permission_service = PermissionService()
