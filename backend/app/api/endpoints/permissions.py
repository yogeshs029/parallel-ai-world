from fastapi import APIRouter
from ...schemas.runtime import PersonPermissions, PersonPermissionsUpdate
from ...services.runtime.repositories import permission_repository

router = APIRouter()

@router.get("/worlds/{world_id}/people/{person_id}/permissions", response_model=PersonPermissions)
async def get_person_permissions(world_id: str, person_id: str):
    return await permission_repository.get_permissions(world_id=world_id, person_id=person_id)

@router.put("/worlds/{world_id}/people/{person_id}/permissions", response_model=PersonPermissions)
async def update_person_permissions(
    world_id: str, person_id: str, updates: PersonPermissionsUpdate
):
    return await permission_repository.update_permissions(
        world_id=world_id, person_id=person_id, updates=updates
    )
