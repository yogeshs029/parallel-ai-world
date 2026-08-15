import uuid
import re
from datetime import datetime
from typing import Dict, Any, Optional

from ...schemas.experience import (
    WorldChangeProposal,
    CommandDomain,
    WorldExperienceUpdate,
    WorldTheme,
    ThemePreset,
    BorderRadiusOption,
    DensityOption,
    TypographyOption,
    ShadowOption,
)
from .engine import world_experience_engine, PRESETS
from .validator import world_change_validator

class WorldCommandRouter:
    def __init__(self):
        self._proposals: Dict[str, WorldChangeProposal] = {}

    async def interpret_prompt(self, world_id: str, prompt: str) -> WorldChangeProposal:
        p_lower = prompt.lower().strip()
        proposal_id = f"prop-{uuid.uuid4().hex[:8]}"

        # 1. Identify Domain
        domain = CommandDomain.WORLD_EXPERIENCE
        requires_approval = False
        summary_items = []
        changes: Dict[str, Any] = {}

        # Domain checks
        if re.search(r"\b(add|create|hire|new)\s+(a\s+)?(person|member|designer|developer|manager)\b", p_lower):
            domain = CommandDomain.PERSON
            summary_items.append("Create new Person in world")
            changes = {"action": "CREATE_PERSON", "details": prompt}
        elif re.search(r"\b(create|add|give|assign|new)\s+(a\s+)?goal\b", p_lower):
            domain = CommandDomain.GOAL
            summary_items.append("Create new Goal in world")
            changes = {"action": "CREATE_GOAL", "details": prompt}
        elif re.search(r"\b(permission|give\s+access|grant\s+access|allow\s+access|give\s+\w+\s+permission)\b", p_lower):
            domain = CommandDomain.PERMISSION
            summary_items.append("Update Person permissions")
            changes = {"action": "UPDATE_PERMISSIONS", "details": prompt}
        elif re.search(r"\b(delete|destroy|remove)\s+(this\s+)?world\b", p_lower):
            domain = CommandDomain.WORLD_EXPERIENCE
            requires_approval = True
            summary_items.append("⚠️ Destructive Action: Delete World")
            changes = {"action": "DELETE_WORLD", "confirmed": False}

        # 2. If WORLD_EXPERIENCE: Parse Theme, Navigation, Terminology, Features
        if domain == CommandDomain.WORLD_EXPERIENCE and not requires_approval:
            current_exp = world_experience_engine.get_or_create_experience(world_id)
            theme_dict = current_exp.theme.model_dump()
            theme_modified = False

            # Theme Preset & Color parsing
            if "luxury" in p_lower or "furniture" in p_lower or "gold" in p_lower or "amber" in p_lower:
                theme_dict = dict(PRESETS["luxury"])
                theme_modified = True
                summary_items.append("Applied Luxury Warm Wood visual theme")
            elif "warm" in p_lower or "cozy" in p_lower:
                theme_dict = dict(PRESETS["warm"])
                theme_modified = True
                summary_items.append("Applied Warm Amber visual theme")
            elif "dark navy" in p_lower or "navy" in p_lower or "blue" in p_lower or "professional" in p_lower or "company" in p_lower:
                theme_dict = dict(PRESETS["professional"])
                theme_modified = True
                summary_items.append("Applied Professional Deep Blue visual theme")
            elif "dark" in p_lower or "night" in p_lower:
                theme_dict = dict(PRESETS["dark"])
                theme_modified = True
                summary_items.append("Applied Midnight Dark visual theme")
            elif "playful" in p_lower or "fun" in p_lower:
                theme_dict = dict(PRESETS["playful"])
                theme_modified = True
                summary_items.append("Applied Playful Vibrant visual theme")
            elif "modern" in p_lower or "purple" in p_lower:
                theme_dict = dict(PRESETS["modern"])
                theme_modified = True
                summary_items.append("Applied Modern Cosmic Purple visual theme")

            # Radius & Spacing parsing
            if "compact" in p_lower or "simpler" in p_lower or "minimal" in p_lower:
                theme_dict["density"] = DensityOption.COMPACT.value
                theme_dict["borderRadius"] = BorderRadiusOption.MD.value
                summary_items.append("Switched to compact density")
                theme_modified = True
            elif "spacious" in p_lower or "relaxed" in p_lower:
                theme_dict["density"] = DensityOption.SPACIOUS.value
                theme_dict["borderRadius"] = BorderRadiusOption.XL.value
                summary_items.append("Switched to spacious layout density")
                theme_modified = True

            if theme_modified:
                changes["theme"] = theme_dict

            # Terminology parsing
            term_dict = current_exp.terminology.model_dump()
            term_modified = False
            if "rename goals to objectives" in p_lower or "objectives" in p_lower:
                term_dict["goalsLabel"] = "Objectives"
                term_dict["goalLabel"] = "Objective"
                term_modified = True
                summary_items.append("Renamed 'Goals' to 'Objectives'")
            if "rename people to family" in p_lower or "family" in p_lower:
                term_dict["peopleLabel"] = "Family"
                term_dict["personLabel"] = "Family Member"
                term_modified = True
                summary_items.append("Renamed 'People' to 'Family'")
            if "rename people to team" in p_lower or "team" in p_lower:
                term_dict["peopleLabel"] = "Team Members"
                term_dict["personLabel"] = "Team Member"
                term_modified = True
                summary_items.append("Renamed 'People' to 'Team Members'")

            if term_modified:
                changes["terminology"] = term_dict

            # Navigation & Feature Visibility parsing
            nav_items = [copy_item.model_dump() for copy_item in current_exp.navigation]
            nav_modified = False

            if "put people first" in p_lower or "people first" in p_lower or "people to the top" in p_lower:
                people_item = next((item for item in nav_items if item["id"] == "people"), None)
                if people_item:
                    nav_items.remove(people_item)
                    nav_items.insert(0, people_item)
                    for idx, itm in enumerate(nav_items):
                        itm["order"] = idx
                    nav_modified = True
                    summary_items.append("Moved People to primary navigation position")

            if "hide activity" in p_lower:
                for itm in nav_items:
                    if itm["id"] == "activity":
                        itm["visible"] = False
                        nav_modified = True
                summary_items.append("Hidden Activity log from main navigation")

            if "show activity" in p_lower:
                for itm in nav_items:
                    if itm["id"] == "activity":
                        itm["visible"] = True
                        nav_modified = True
                summary_items.append("Made Activity log visible in navigation")

            if nav_modified:
                changes["navigation"] = nav_items

        summary_text = " • ".join(summary_items) if summary_items else f"Customization for: '{prompt}'"

        proposal = WorldChangeProposal(
            id=proposal_id,
            worldId=world_id,
            prompt=prompt,
            domain=domain,
            summary=summary_text,
            changes=changes,
            requiresApproval=requires_approval,
            status="preview",
            createdAt=datetime.utcnow().isoformat(),
        )

        self._proposals[proposal_id] = proposal
        return proposal

    async def apply_proposal(self, proposal_id: str) -> WorldChangeProposal:
        proposal = self._proposals.get(proposal_id)
        if not proposal:
            raise ValueError(f"Proposal '{proposal_id}' not found.")

        # Safety Validation
        valid, err = world_change_validator.validate_proposal(proposal.changes)
        if not valid:
            proposal.status = "failed"
            raise ValueError(f"Validation failed: {err}")

        # Apply to experience engine if domain is WORLD_EXPERIENCE
        if proposal.domain == CommandDomain.WORLD_EXPERIENCE:
            update = WorldExperienceUpdate()
            if "theme" in proposal.changes:
                update.theme = WorldTheme(**proposal.changes["theme"])
            if "navigation" in proposal.changes:
                update.navigation = proposal.changes["navigation"]
            if "terminology" in proposal.changes:
                update.terminology = proposal.changes["terminology"]

            world_experience_engine.update_experience(
                proposal.worldId,
                update,
                reason=f"Applied prompt: '{proposal.prompt}'"
            )

        proposal.status = "applied"
        proposal.appliedAt = datetime.utcnow().isoformat()
        return proposal

world_command_router = WorldCommandRouter()
