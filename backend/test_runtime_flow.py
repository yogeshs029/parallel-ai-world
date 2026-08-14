import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def test_runtime_flow():
    base_url = "http://127.0.0.1:8000/api"
    world_id = "world-company"
    person_id = "person-maya"

    print("\n--- 1. Testing World Runtime Diagnostic Status ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        status_res = await client.get(f"{base_url}/runtime/status")
        print(f"Status code: {status_res.status_code}")
        status_data = status_res.json()
        print(f"Runtime running: {status_data['isRunning']}")
        print(f"Worker status: {status_data['workerStatus']}")
        print(f"Last heartbeat: {status_data['lastHeartbeat']}")
        assert status_data['isRunning'] is True, "Runtime worker is not running!"

        print("\n--- 2. Testing Background Task Creation & Worker Execution ---")
        task_create_res = await client.post(
            f"{base_url}/worlds/{world_id}/tasks",
            json={
                "worldId": world_id,
                "assignedPersonId": person_id,
                "title": "Prepare website mobile layout review",
                "description": "Analyze mobile viewport drawer navigation and make 2 actionable recommendations.",
                "priority": "high",
                "notifyOnCompletion": True
            }
        )
        task_id = task_create_res.json()["id"]
        print(f"Created task [{task_id}]: {task_create_res.json()['title']} (Status: {task_create_res.json()['status']})")

        # Wait for the background worker loop to pick up and process the task
        print("Waiting for background runtime worker to execute task with LLM...")
        completed_task = None
        for attempt in range(20):
            await asyncio.sleep(1.5)
            t_res = await client.get(f"{base_url}/worlds/{world_id}/tasks/{task_id}")
            t_data = t_res.json()
            if t_data["status"] == "completed":
                completed_task = t_data
                break
            print(f" ... attempt {attempt+1}: status = {t_data['status']}")

        assert completed_task is not None, "Task was not completed by the background worker within timeout!"
        print(f" -> Task COMPLETED by worker!")
        print(f"    Result: \"{completed_task['result']}\"")
        print(f"    CompletedAt: {completed_task['completedAt']}")

        print("\n--- 3. Testing Person-Initiated Completion Message in Chat History ---")
        msgs_res = await client.get(f"{base_url}/worlds/{world_id}/people/{person_id}/messages")
        messages = msgs_res.json()
        print(f"Found {len(messages)} messages in Maya's conversation.")
        completion_msg = None
        for m in messages:
            if "Prepare website mobile layout review" in m["content"] or completed_task["result"][:30] in m["content"]:
                completion_msg = m
                break
        assert completion_msg is not None, "Person-initiated message was not saved in conversation history!"
        print(f" -> Person-Initiated Message found:")
        print(f"    \"{completion_msg['content']}\"")

        print("\n--- 4. Testing Notification Inbox ---")
        notifs_res = await client.get(f"{base_url}/notifications")
        notifs = notifs_res.json()
        print(f"Total notifications in inbox: {len(notifs)}")
        task_notif = None
        for n in notifs:
            if n.get("relatedEntityId") == task_id or "Prepare website mobile layout review" in n["title"]:
                task_notif = n
                break
        assert task_notif is not None, "Task completion notification was not created!"
        print(f" -> Notification generated:")
        print(f"    Title: {task_notif['title']}")
        print(f"    Message: {task_notif['message']}")
        print(f"    Read: {task_notif['read']}")

        print("\n--- 5. Testing Permission & Approval Workflow ---")
        # Check permissions for Maya
        perms_res = await client.get(f"{base_url}/worlds/{world_id}/people/{person_id}/permissions")
        perms = perms_res.json()
        print(f"Maya's worldEdit permission: {perms['worldEdit']} (should be False by default)")
        assert perms['worldEdit'] is False, "Default permission should be conservative!"

        # Create an approval request for a sensitive action
        appr_res = await client.post(
            f"{base_url}/worlds/{world_id}/approvals",
            json={
                "worldId": world_id,
                "requesterPersonId": person_id,
                "requesterName": "Maya",
                "requesterEmoji": "👩‍💻",
                "actionType": "UPDATE_WORLD",
                "target": "world-company",
                "title": "Update World Description",
                "reason": "Align world description with 2026 solid wood furniture sustainability roadmap.",
                "payload": {"description": "Sustainable solid teakwood furniture directly to homes."}
            }
        )
        approval_id = appr_res.json()["id"]
        print(f"Created Approval Request [{approval_id}]: {appr_res.json()['title']}")

        # Approve the request
        approve_action = await client.post(
            f"{base_url}/worlds/{world_id}/approvals/{approval_id}/approve",
            json={"comment": "Looks great, approved."}
        )
        resolved_appr = approve_action.json()
        print(f"Approval resolution: {resolved_appr['status']} (Comment: '{resolved_appr['resolutionComment']}')")
        assert resolved_appr['status'] == "approved", "Approval request was not marked approved!"

        print("\n=== ALL MODULE 6 RUNTIME INTEGRATION TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(test_runtime_flow())
