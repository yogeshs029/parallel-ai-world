import asyncio
import sys
from pathlib import Path

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.schemas.tools import (
    ToolRequestCreate,
    PersonCapabilities,
    WorldToolPolicy,
    ToolRequestStatus,
    ApprovalScope,
)
from backend.app.services.tools.registry import tool_registry
from backend.app.services.tools.executor import tool_executor
from backend.app.services.tools.safety import tool_safety_service
from backend.app.services.tools.workspace import workspace_manager

async def run_all_tests():
    print("==================================================")
    print("🧪 STARTING MODULE 10: TOOLS & EXECUTION TEST SUITE")
    print("==================================================")

    # TEST 1: Tool Registry Count
    tools = tool_registry.list_tools()
    print(f"\n[Test 1] Tool Registry: Found {len(tools)} registered tools.")
    assert len(tools) >= 15, "Expected at least 15 registered tools"
    print("  ✅ Tool registry contains all required tools.")

    # TEST 2: Workspace Sandboxed File Write & Read
    world_id = "test_world_sandbox"
    person_id = "person_dev"
    print("\n[Test 2] Sandboxed Filesystem (Write & Read):")
    write_res = workspace_manager.write_file(world_id, "notes/todo.txt", "Hello from Parallel AI World!")
    assert write_res["success"] is True, f"File write failed: {write_res}"
    print("  ✅ Wrote file to /notes/todo.txt inside world workspace.")

    read_res = workspace_manager.read_file(world_id, "notes/todo.txt")
    assert read_res["success"] is True and "Hello from Parallel" in read_res["content"], f"File read failed: {read_res}"
    print("  ✅ Read file content accurately from sandboxed workspace.")

    # TEST 3: Path Traversal Prevention
    print("\n[Test 3] Path Traversal & System Escape Security:")
    ws_root = workspace_manager.get_world_workspace_dir(world_id)
    traversal_paths = [
        "../../../../etc/passwd",
        "C:\\Windows\\System32\\calc.exe",
        "/etc/shadow",
        "sub/../../../../secret.key",
    ]
    for p in traversal_paths:
        valid, _, err = tool_safety_service.validate_workspace_path(p, ws_root)
        assert not valid, f"Expected security rejection for path '{p}', but it passed!"
        print(f"  ✅ Blocked unsafe path: {p} -> {err}")

    # TEST 4: SSRF Protection
    print("\n[Test 4] SSRF Protection on HTTP and Web Fetch:")
    unsafe_urls = [
        "http://localhost:8000/admin",
        "http://127.0.0.1:11434/api/tags",
        "http://169.254.169.254/latest/meta-data/",
        "file:///etc/passwd",
        "javascript:alert(1)",
    ]
    for u in unsafe_urls:
        safe, err = tool_safety_service.validate_url(u)
        assert not safe, f"Expected SSRF rejection for URL '{u}', but it passed!"
        print(f"  ✅ Blocked unsafe URL: {u} -> {err}")

    # TEST 5: Code Execution Sandbox
    print("\n[Test 5] Code Execution Sandbox:")
    code_req = ToolRequestCreate(
        worldId=world_id,
        personId=person_id,
        toolId="code_execute",
        input={"language": "python", "code": "def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)\nprint('FIB_10:', fib(10))"}
    )
    # Enable code execution capability
    caps = PersonCapabilities(personId=person_id, worldId=world_id, codeExecute=True, askBeforeCodeExecute=False)
    tool_executor.update_person_capabilities(world_id, person_id, caps)
    policy = WorldToolPolicy(worldId=world_id, codeExecutionEnabled=True, requireApprovalForCode=False, requireApprovalForHighRisk=False)
    tool_executor.update_world_policy(world_id, policy)

    code_res = await tool_executor.request_and_execute_tool(code_req)
    assert code_res.status == ToolRequestStatus.COMPLETED, f"Code execution failed: {code_res.error}"
    assert "FIB_10: 55" in code_res.result.output.get("stdout", ""), f"Unexpected output: {code_res.result.output}"
    print("  ✅ Python code executed safely inside sandbox with correct output (FIB_10: 55).")

    # TEST 6: Permission Enforcement
    print("\n[Test 6] Permission System Denials:")
    person_no_files = "person_restricted"
    no_file_caps = PersonCapabilities(personId=person_no_files, worldId=world_id, fileWrite=False)
    tool_executor.update_person_capabilities(world_id, person_no_files, no_file_caps)

    write_req = ToolRequestCreate(
        worldId=world_id,
        personId=person_no_files,
        toolId="file_write",
        input={"path": "forbidden.txt", "content": "should fail"}
    )
    denied_res = await tool_executor.request_and_execute_tool(write_req)
    assert denied_res.status == ToolRequestStatus.REJECTED, f"Expected rejection but got {denied_res.status}"
    print(f"  ✅ File write rejected when person lacks permission: {denied_res.error}")

    # TEST 7: Approval Workflow Integration
    print("\n[Test 7] Approval Workflow Integration:")
    person_approval = "person_ask"
    ask_caps = PersonCapabilities(
        personId=person_approval,
        worldId=world_id,
        fileWrite=True,
        askBeforeFileWrite=True,
    )
    tool_executor.update_person_capabilities(world_id, person_approval, ask_caps)

    req_appr = ToolRequestCreate(
        worldId=world_id,
        personId=person_approval,
        toolId="file_write",
        input={"path": "approved_file.txt", "content": "Approved by user!"}
    )
    pending_res = await tool_executor.request_and_execute_tool(req_appr)
    assert pending_res.status == ToolRequestStatus.REQUESTED, f"Expected REQUESTED status awaiting approval, got {pending_res.status}"
    print("  ✅ Tool execution paused with status 'requested' awaiting user approval.")

    approved_exec = await tool_executor.approve_and_execute(pending_res.id, scope=ApprovalScope.ONCE)
    assert approved_exec.status == ToolRequestStatus.COMPLETED, f"Expected COMPLETED after approval, got {approved_exec.status}"
    print("  ✅ Tool resumed and completed successfully after approval.")

    # TEST 8: Tool Loop Protection
    print("\n[Test 8] Loop Protection:")
    task_id = "task_loop_test"
    calc_req = ToolRequestCreate(
        worldId=world_id,
        personId=person_id,
        taskId=task_id,
        toolId="calculator",
        input={"expression": "100 * 2"}
    )
    for i in range(3):
        await tool_executor.request_and_execute_tool(calc_req)
    # 4th identical call must be blocked
    loop_blocked = await tool_executor.request_and_execute_tool(calc_req)
    assert loop_blocked.status == ToolRequestStatus.FAILED and "loop" in loop_blocked.error.lower(), f"Loop protection failed: {loop_blocked.error}"
    print("  ✅ Repeated identical tool calls blocked by Loop Protection.")

    # TEST 9: Secret Redaction
    print("\n[Test 9] Secret Redaction:")
    raw_output = "Connected with apiKey: 'sk-abcdef1234567890abcdef1234567890' and password='SuperSecretPassword123!'"
    redacted = tool_safety_service.redact_secrets(raw_output)
    assert "sk-***REDACTED***" in redacted or "REDACTED" in redacted, f"Secret was not redacted: {redacted}"
    assert "SuperSecretPassword123!" not in redacted, f"Password leaked: {redacted}"
    print("  ✅ Secrets and credentials redacted from output and audit trails.")

    print("\n==================================================")
    print("🎉 ALL MODULE 10 TESTS PASSED CLEANLY (100% SUCCESS)")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
