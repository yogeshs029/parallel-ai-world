from fastapi import APIRouter, HTTPException, Body
from typing import List

from ...schemas.experience import (
    WorldExperience,
    WorldExperienceUpdate,
    WorldChangeProposal,
    WorldExperienceVersion,
    WorldCommandInput,
)
from ...services.experience.engine import world_experience_engine
from ...services.experience.router import world_command_router

router = APIRouter()

# ── 1. WORLD EXPERIENCE CONFIGURATION ──

@router.get("/worlds/{world_id}/experience", response_model=WorldExperience)
async def get_world_experience(world_id: str):
    """Retrieves the active Living World experience configuration."""
    return world_experience_engine.get_or_create_experience(world_id)

@router.put("/worlds/{world_id}/experience", response_model=WorldExperience)
async def update_world_experience(world_id: str, update: WorldExperienceUpdate):
    """Updates theme, navigation, terminology, or layout for this World."""
    return world_experience_engine.update_experience(world_id, update)

# ── 2. NATURAL LANGUAGE COMMAND CONTROL ──

@router.post("/worlds/{world_id}/commands", response_model=WorldChangeProposal)
async def process_world_command(world_id: str, cmd_in: WorldCommandInput):
    """Interprets a natural-language customization prompt into a structured change proposal."""
    return await world_command_router.interpret_prompt(world_id, cmd_in.prompt)

@router.post("/worlds/{world_id}/commands/{proposal_id}/apply", response_model=WorldChangeProposal)
async def apply_world_command_proposal(world_id: str, proposal_id: str):
    """Applies an approved change proposal to the World experience."""
    try:
        return await world_command_router.apply_proposal(proposal_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── 3. VERSION HISTORY & UNDO ──

@router.get("/worlds/{world_id}/experience/versions", response_model=List[WorldExperienceVersion])
async def list_experience_versions(world_id: str):
    """Lists history of experience versions and revisions for this World."""
    return world_experience_engine.list_versions(world_id)

@router.post("/worlds/{world_id}/experience/undo", response_model=WorldExperience)
async def undo_world_experience(world_id: str):
    """Reverts to the previous World experience revision snapshot."""
    return world_experience_engine.undo(world_id)
