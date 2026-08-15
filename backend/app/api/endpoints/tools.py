from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional

from ...schemas.tools import (
    ToolDefinition,
    ToolRequestCreate,
    ToolRequest,
    PersonCapabilities,
    WorldToolPolicy,
    ToolAuditLog,
    ApprovalScope,
)
from ...services.tools.registry import tool_registry
from ...services.tools.executor import tool_executor

router = APIRouter()

# ── 1. REGISTRY & DISCOVERY ──

@router.get("/tools", response_model=List[ToolDefinition])
async def list_registered_tools():
    """Lists all registered tools in the system with their JSON schemas."""
    return tool_registry.list_tools()

@router.get("/worlds/{world_id}/people/{person_id}/tools", response_model=List[ToolDefinition])
async def get_available_tools_for_person(world_id: str, person_id: str):
    """Returns only the tools that this Person is permitted to use under the World's policy."""
    caps = tool_executor.get_person_capabilities(world_id, person_id)
    policy = tool_executor.get_world_policy(world_id)
    return tool_registry.get_available_tools_for_person(caps, policy)

# ── 2. EXECUTION & REQUESTS ──

@router.post("/tools/execute", response_model=ToolRequest)
async def request_and_execute_tool(req_in: ToolRequestCreate):
    """Requests a tool execution. Validates permissions, checks approvals, and executes in sandbox."""
    return await tool_executor.request_and_execute_tool(req_in)

@router.get("/tools/requests", response_model=List[ToolRequest])
async def list_tool_requests(world_id: Optional[str] = Query(None)):
    """Lists tool requests and execution history."""
    return tool_executor.list_requests(world_id=world_id)

@router.post("/tools/requests/{request_id}/approve", response_model=ToolRequest)
async def approve_tool_request(
    request_id: str,
    scope: ApprovalScope = Body(ApprovalScope.ONCE, embed=True)
):
    """Approves a tool request and resumes its execution in the sandbox."""
    try:
        return await tool_executor.approve_and_execute(request_id, scope=scope)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/tools/requests/{request_id}/reject", response_model=ToolRequest)
async def reject_tool_request(
    request_id: str,
    reason: str = Body("Denied by user.", embed=True)
):
    """Rejects a pending tool request."""
    try:
        return await tool_executor.reject_request(request_id, reason=reason)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/tools/requests/{request_id}/cancel", response_model=ToolRequest)
async def cancel_tool_request(request_id: str):
    """Cancels a running or pending tool request."""
    try:
        return await tool_executor.cancel_request(request_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ── 3. PERSON CAPABILITIES ──

@router.get("/worlds/{world_id}/people/{person_id}/capabilities", response_model=PersonCapabilities)
async def get_person_capabilities(world_id: str, person_id: str):
    """Retrieves tool capabilities for a specific person."""
    return tool_executor.get_person_capabilities(world_id, person_id)

@router.put("/worlds/{world_id}/people/{person_id}/capabilities", response_model=PersonCapabilities)
async def update_person_capabilities(world_id: str, person_id: str, caps: PersonCapabilities):
    """Updates tool capabilities and approval triggers for a person."""
    return tool_executor.update_person_capabilities(world_id, person_id, caps)

# ── 4. WORLD POLICY ──

@router.get("/worlds/{world_id}/tools/policy", response_model=WorldToolPolicy)
async def get_world_tool_policy(world_id: str):
    """Retrieves tool governance policy for a world."""
    return tool_executor.get_world_policy(world_id)

@router.put("/worlds/{world_id}/tools/policy", response_model=WorldToolPolicy)
async def update_world_tool_policy(world_id: str, policy: WorldToolPolicy):
    """Updates tool governance policy for a world."""
    return tool_executor.update_world_policy(world_id, policy)

# ── 5. AUDIT LOGS ──

@router.get("/worlds/{world_id}/tools/audit", response_model=List[ToolAuditLog])
async def list_world_tool_audit_logs(world_id: str):
    """Retrieves secret-redacted audit logs for all tool invocations in a world."""
    return tool_executor.list_audit_logs(world_id=world_id)
