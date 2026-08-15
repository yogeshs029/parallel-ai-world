import uuid
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

from ...schemas.tools import (
    ToolRequestCreate,
    ToolRequest,
    ToolResult,
    ToolRequestStatus,
    ToolAuditLog,
    RiskLevel,
    PersonCapabilities,
    WorldToolPolicy,
    ApprovalScope,
)
from .registry import tool_registry
from .safety import tool_safety_service
from ..runtime.repositories import approval_repository, notification_repository, event_repository
from ...schemas.runtime import ApprovalCreate, NotificationCreate, EventCreate
from ..runtime.broadcaster import broadcaster

Tuple_Check = tuple[bool, Optional[str]]

class ToolExecutor:
    def __init__(self):
        self._capabilities: Dict[str, PersonCapabilities] = {}
        self._policies: Dict[str, WorldToolPolicy] = {}
        self._requests: Dict[str, ToolRequest] = {}
        self._audit_logs: List[ToolAuditLog] = []
        self._task_usage: Dict[str, Dict[str, int]] = {}
        self._task_fingerprints: Dict[str, List[str]] = {}

    def _cap_key(self, world_id: str, person_id: str) -> str:
        return f"{world_id}:{person_id}"

    def get_person_capabilities(self, world_id: str, person_id: str) -> PersonCapabilities:
        key = self._cap_key(world_id, person_id)
        if key not in self._capabilities:
            self._capabilities[key] = PersonCapabilities(personId=person_id, worldId=world_id)
        return self._capabilities[key]

    def update_person_capabilities(self, world_id: str, person_id: str, caps: PersonCapabilities) -> PersonCapabilities:
        key = self._cap_key(world_id, person_id)
        caps.worldId = world_id
        caps.personId = person_id
        caps.updatedAt = datetime.utcnow().isoformat()
        self._capabilities[key] = caps
        return caps

    def get_world_policy(self, world_id: str) -> WorldToolPolicy:
        if world_id not in self._policies:
            self._policies[world_id] = WorldToolPolicy(worldId=world_id)
        return self._policies[world_id]

    def update_world_policy(self, world_id: str, policy: WorldToolPolicy) -> WorldToolPolicy:
        policy.worldId = world_id
        policy.updatedAt = datetime.utcnow().isoformat()
        self._policies[world_id] = policy
        return policy

    def check_permissions(self, world_id: str, person_id: str, tool_id: str) -> Tuple_Check:
        caps = self.get_person_capabilities(world_id, person_id)
        policy = self.get_world_policy(world_id)
        tool = tool_registry.get(tool_id)

        if not tool:
            return False, f"Tool '{tool_id}' is not recognized."
        if not tool.enabled:
            return False, f"Tool '{tool_id}' is currently disabled system-wide."

        # World Policy Check
        if tool.category.value == "WEB" and not policy.webToolsEnabled:
            return False, f"Web tools are disabled in this World."
        if tool.category.value == "FILES" and not policy.fileToolsEnabled:
            return False, f"File access is disabled in this World."
        if tool.category.value == "CODE" and not policy.codeExecutionEnabled:
            return False, f"Code execution is disabled in this World."
        if tool.category.value == "HTTP" and not policy.httpToolsEnabled:
            return False, f"External HTTP tools are disabled in this World."
        if tool.category.value == "GIT" and not policy.gitToolsEnabled:
            return False, f"Git tools are disabled in this World."

        # Person Capabilities Check
        if tool_id == "web_search" and not caps.webSearch:
            return False, "Person is not permitted to use Web Search."
        if tool_id == "web_fetch" and not caps.webFetch:
            return False, "Person is not permitted to Fetch Webpages."
        if tool_id in ("file_list", "file_read", "file_search") and not caps.fileRead:
            return False, "Person is not permitted to Read Files."
        if tool_id in ("file_write", "file_create_directory") and not caps.fileWrite:
            return False, "Person is not permitted to Write/Create Files."
        if tool_id == "code_execute" and not caps.codeExecute:
            return False, "Person is not permitted to Run Code."
        if tool_id == "code_test" and not caps.codeTest:
            return False, "Person is not permitted to Run Tests."
        if tool_id == "http_request" and not caps.httpRequest:
            return False, "Person is not permitted to make HTTP Requests."
        if tool_id == "world_read" and not caps.worldRead:
            return False, "Person is not permitted to Read World Data."
        if tool_id == "world_update" and not caps.worldUpdate:
            return False, "Person is not permitted to Update World Data."
        if tool.category.value == "GIT" and not caps.gitRead:
            return False, "Person is not permitted to inspect Git status."

        return True, None

    def requires_approval(self, world_id: str, person_id: str, tool_id: str) -> bool:
        caps = self.get_person_capabilities(world_id, person_id)
        policy = self.get_world_policy(world_id)
        tool = tool_registry.get(tool_id)

        if not tool:
            return False

        # World policy approval rules
        if policy.requireApprovalForHighRisk and tool.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            return True
        if policy.requireApprovalForCode and tool.category.value == "CODE":
            return True
        if policy.requireApprovalForFileWrite and tool_id == "file_write":
            return True

        # Person capability approval triggers ("Ask before using")
        if tool_id == "file_write" and caps.askBeforeFileWrite:
            return True
        if tool_id in ("code_execute", "code_test") and caps.askBeforeCodeExecute:
            return True
        if tool_id == "http_request" and caps.askBeforeHttpRequest:
            return True
        if tool_id == "world_update" and caps.askBeforeWorldUpdate:
            return True

        return False

    def check_loop_protection(self, task_id: Optional[str], tool_id: str, params: Dict[str, Any]) -> bool:
        if not task_id:
            return True  # Direct interactive call

        if task_id not in self._task_fingerprints:
            self._task_fingerprints[task_id] = []

        # Create deterministic fingerprint hash of tool + input
        input_str = json.dumps(params, sort_keys=True, default=str)
        fp = hashlib.md5(f"{tool_id}:{input_str}".encode("utf-8")).hexdigest()

        # Count occurrences in task history
        recent_fps = self._task_fingerprints[task_id][-10:]
        count = recent_fps.count(fp)

        if count >= 3:
            return False  # Loop detected

        self._task_fingerprints[task_id].append(fp)
        return True

    def check_and_update_budget(self, world_id: str, task_id: Optional[str], tool_id: str) -> Tuple_Check:
        if not task_id:
            return True, None

        policy = self.get_world_policy(world_id)
        if task_id not in self._task_usage:
            self._task_usage[task_id] = {"total_calls": 0, "code_calls": 0}

        usage = self._task_usage[task_id]
        if usage["total_calls"] >= policy.maxToolCallsPerTask:
            return False, f"Task exceeded maximum tool calls budget ({policy.maxToolCallsPerTask})."

        tool = tool_registry.get(tool_id)
        if tool and tool.category.value == "CODE":
            if usage["code_calls"] >= policy.maxCodeExecutionsPerTask:
                return False, f"Task exceeded maximum code executions budget ({policy.maxCodeExecutionsPerTask})."
            usage["code_calls"] += 1

        usage["total_calls"] += 1
        return True, None

    async def request_and_execute_tool(self, req_in: ToolRequestCreate) -> ToolRequest:
        req_id = f"treq-{uuid.uuid4().hex[:8]}"
        tool = tool_registry.get(req_in.toolId)
        risk = tool.risk_level if tool else RiskLevel.LOW

        request_obj = ToolRequest(
            id=req_id,
            worldId=req_in.worldId,
            personId=req_in.personId,
            taskId=req_in.taskId,
            toolId=req_in.toolId,
            input=req_in.input,
            status=ToolRequestStatus.REQUESTED,
            riskLevel=risk,
            requestedAt=datetime.utcnow().isoformat(),
        )
        self._requests[req_id] = request_obj

        # 1. Permission Check
        permitted, perm_err = self.check_permissions(req_in.worldId, req_in.personId, req_in.toolId)
        if not permitted:
            request_obj.status = ToolRequestStatus.REJECTED
            request_obj.error = perm_err
            request_obj.completedAt = datetime.utcnow().isoformat()
            self._record_audit(request_obj, duration=0, error=perm_err)
            return request_obj

        # 2. Tool Budget Check
        budget_ok, budget_err = self.check_and_update_budget(req_in.worldId, req_in.taskId, req_in.toolId)
        if not budget_ok:
            request_obj.status = ToolRequestStatus.FAILED
            request_obj.error = budget_err
            request_obj.completedAt = datetime.utcnow().isoformat()
            self._record_audit(request_obj, duration=0, error=budget_err)
            return request_obj

        # 3. Tool Loop Protection Check
        if not self.check_loop_protection(req_in.taskId, req_in.toolId, req_in.input):
            loop_err = "Tool loop detected: identical tool call repeated multiple times."
            request_obj.status = ToolRequestStatus.FAILED
            request_obj.error = loop_err
            request_obj.completedAt = datetime.utcnow().isoformat()
            self._record_audit(request_obj, duration=0, error=loop_err)
            return request_obj

        # 4. Approval Requirement Check
        if self.requires_approval(req_in.worldId, req_in.personId, req_in.toolId):
            try:
                # Trigger Module 6 Approval Request
                app_create = ApprovalCreate(
                    worldId=req_in.worldId,
                    requesterPersonId=req_in.personId,
                    requesterName=f"Agent {req_in.personId}",
                    actionType="UPDATE_WORLD",
                    target=f"{tool.name if tool else req_in.toolId}",
                    title=f"Request to use {tool.name if tool else req_in.toolId}",
                    reason=f"Requires permission to execute {req_in.toolId} with given arguments.",
                    payload={"toolRequestId": req_id, "toolId": req_in.toolId, "input": req_in.input},
                )
                appr = await approval_repository.create_approval(app_create)
                request_obj.approvalRequestId = appr.id
                request_obj.status = ToolRequestStatus.REQUESTED

                # Send user notification
                notif = await notification_repository.create_notification(
                    NotificationCreate(
                        worldId=req_in.worldId,
                        personId=req_in.personId,
                        type="approval_required",
                        title="Tool Permission Required",
                        message=f"Agent requested permission to run {tool.name if tool else req_in.toolId}.",
                        relatedEntityId=appr.id,
                        actionUrl=f"/world/{req_in.worldId}",
                    )
                )
                await broadcaster.broadcast("approval_requested", appr.model_dump())
                await broadcaster.broadcast("notification", notif.model_dump())
                await broadcaster.broadcast("tool_requested", request_obj.model_dump())
                return request_obj
            except Exception as e:
                pass

        # 5. Direct Execution (No approval required)
        return await self._execute_tool_internal(request_obj)

    async def approve_and_execute(self, request_id: str, scope: ApprovalScope = ApprovalScope.ONCE) -> ToolRequest:
        req = self._requests.get(request_id)
        if not req:
            raise ValueError(f"Tool request '{request_id}' not found.")

        req.approvalScope = scope
        req.status = ToolRequestStatus.APPROVED
        await broadcaster.broadcast("tool_approved", req.model_dump())
        return await self._execute_tool_internal(req)

    async def reject_request(self, request_id: str, reason: str = "Denied by user.") -> ToolRequest:
        req = self._requests.get(request_id)
        if not req:
            raise ValueError(f"Tool request '{request_id}' not found.")

        req.status = ToolRequestStatus.REJECTED
        req.error = reason
        req.completedAt = datetime.utcnow().isoformat()
        self._record_audit(req, duration=0, error=reason)
        await broadcaster.broadcast("tool_rejected", req.model_dump())
        return req

    async def cancel_request(self, request_id: str) -> ToolRequest:
        req = self._requests.get(request_id)
        if not req:
            raise ValueError(f"Tool request '{request_id}' not found.")

        req.status = ToolRequestStatus.CANCELLED
        req.error = "Execution cancelled by user."
        req.completedAt = datetime.utcnow().isoformat()
        self._record_audit(req, duration=0, error=req.error)
        await broadcaster.broadcast("tool_cancelled", req.model_dump())
        return req

    async def _execute_tool_internal(self, req: ToolRequest) -> ToolRequest:
        tool = tool_registry.get(req.toolId)
        if not tool:
            req.status = ToolRequestStatus.FAILED
            req.error = f"Tool '{req.toolId}' is not registered."
            req.completedAt = datetime.utcnow().isoformat()
            return req

        req.status = ToolRequestStatus.RUNNING
        req.startedAt = datetime.utcnow().isoformat()
        await broadcaster.broadcast("tool_started", req.model_dump())

        context = {
            "worldId": req.worldId,
            "personId": req.personId,
            "taskId": req.taskId,
            "requestId": req.id,
        }

        start_time = datetime.utcnow()
        try:
            raw_output = await tool.execute(req.input, context)
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            # Redact secrets from output
            safe_output = tool_safety_service.redact_secrets(raw_output)
            is_success = safe_output.get("success", True) if isinstance(safe_output, dict) else True
            err_msg = safe_output.get("error") if isinstance(safe_output, dict) and not is_success else None

            result = ToolResult(
                success=is_success,
                output=safe_output,
                error=err_msg,
                durationMs=duration_ms,
                createdAt=datetime.utcnow().isoformat(),
            )
            req.result = result
            req.status = ToolRequestStatus.COMPLETED if is_success else ToolRequestStatus.FAILED
            req.error = err_msg
            req.completedAt = datetime.utcnow().isoformat()

            self._record_audit(req, duration=duration_ms, error=err_msg)

            # Create World Event in runtime
            try:
                await event_repository.create_event(
                    EventCreate(
                        worldId=req.worldId,
                        personId=req.personId,
                        type="TOOL_COMPLETED" if is_success else "TOOL_FAILED",
                        payload={"toolId": req.toolId, "durationMs": duration_ms, "success": is_success},
                    )
                )
            except Exception:
                pass

            await broadcaster.broadcast("tool_completed", req.model_dump())
            return req
        except Exception as e:
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            err_str = f"Tool execution failed: {str(e)}"
            req.status = ToolRequestStatus.FAILED
            req.error = err_str
            req.completedAt = datetime.utcnow().isoformat()
            req.result = ToolResult(
                success=False,
                output=None,
                error=err_str,
                durationMs=duration_ms,
                createdAt=datetime.utcnow().isoformat(),
            )
            self._record_audit(req, duration=duration_ms, error=err_str)
            await broadcaster.broadcast("tool_failed", req.model_dump())
            return req

    def _record_audit(self, req: ToolRequest, duration: int = 0, error: Optional[str] = None):
        input_summary = json.dumps(req.input, default=str)[:200]
        audit = ToolAuditLog(
            id=f"audit-{uuid.uuid4().hex[:8]}",
            worldId=req.worldId,
            personId=req.personId,
            taskId=req.taskId,
            toolId=req.toolId,
            inputSummary=tool_safety_service.redact_secrets(input_summary),
            status=req.status,
            riskLevel=req.riskLevel,
            approvalStatus=req.status.value if req.status in (ToolRequestStatus.APPROVED, ToolRequestStatus.REJECTED) else None,
            durationMs=duration,
            error=error,
            timestamp=datetime.utcnow().isoformat(),
        )
        self._audit_logs.append(audit)
        if len(self._audit_logs) > 500:
            self._audit_logs.pop(0)

    def list_requests(self, world_id: Optional[str] = None) -> List[ToolRequest]:
        if world_id:
            return [r for r in self._requests.values() if r.worldId == world_id]
        return list(self._requests.values())

    def list_audit_logs(self, world_id: Optional[str] = None) -> List[ToolAuditLog]:
        if world_id:
            return [a for a in self._audit_logs if a.worldId == world_id]
        return list(self._audit_logs)

Tuple_Check = tuple[bool, Optional[str]]

tool_executor = ToolExecutor()
