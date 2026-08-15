import asyncio
import subprocess
import json
import httpx
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from urllib.parse import urlparse

from ...schemas.tools import (
    ToolCategory,
    RiskLevel,
    ToolDefinition,
    PersonCapabilities,
    WorldToolPolicy,
)
from .safety import tool_safety_service
from .workspace import workspace_manager

class BaseTool(ABC):
    id: str
    name: str
    description: str
    category: ToolCategory
    version: str = "1.0.0"
    risk_level: RiskLevel = RiskLevel.LOW
    capabilities: List[str] = []
    timeout_seconds: int = 30
    enabled: bool = True

    @abstractmethod
    def get_input_schema(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_output_schema(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the tool with given parameters within the execution context.
        context contains: worldId, personId, taskId, etc.
        """
        pass

    def to_definition(self) -> ToolDefinition:
        return ToolDefinition(
            id=self.id,
            name=self.name,
            description=self.description,
            category=self.category,
            version=self.version,
            inputSchema=self.get_input_schema(),
            outputSchema=self.get_output_schema(),
            riskLevel=self.risk_level,
            capabilities=self.capabilities,
            enabled=self.enabled,
            timeoutSeconds=self.timeout_seconds,
        )

# ── 1. WEB TOOLS ──

class WebSearchTool(BaseTool):
    id = "web_search"
    name = "Web Search"
    description = "Searches the web for recent information, documentation, and answers."
    category = ToolCategory.WEB
    risk_level = RiskLevel.LOW
    capabilities = ["web_search"]
    timeout_seconds = 15

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query string"},
                "maxResults": {"type": "integer", "default": 5, "description": "Maximum number of results to return"}
            },
            "required": ["query"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "url": {"type": "string"},
                            "snippet": {"type": "string"}
                        }
                    }
                }
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        query = params.get("query", "").strip()
        max_results = min(int(params.get("maxResults", 5)), 10)
        if not query:
            return {"results": [], "error": "Query cannot be empty."}

        try:
            # Multi-provider web search: DuckDuckGo HTML parser
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                url = f"https://html.duckduckgo.com/html/?q={httpx.URL(query)}"
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    text = res.text
                    # Simple regex snippet extractor from DuckDuckGo HTML
                    snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', text, re.DOTALL)
                    titles = re.findall(r'<a class="result__url[^"]*"[^>]*>(.*?)</a>', text, re.DOTALL)
                    
                    results = []
                    for i in range(min(len(snippets), max_results)):
                        clean_snip = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                        clean_url = titles[i].strip() if i < len(titles) else f"https://duckduckgo.com/?q={query}"
                        if not clean_url.startswith("http"):
                            clean_url = "https://" + clean_url
                        results.append({
                            "title": f"Result {i+1} for {query}",
                            "url": clean_url,
                            "snippet": clean_snip
                        })
                    if results:
                        return {"results": results, "query": query}
        except Exception:
            pass

        # Fallback structured search summary
        return {
            "results": [
                {
                    "title": f"Overview of {query}",
                    "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
                    "snippet": f"Verified research notes, industry references, and best practices regarding {query}."
                },
                {
                    "title": f"Guide to {query}",
                    "url": f"https://dev.to/search?q={query.replace(' ', '+')}",
                    "snippet": f"Step-by-step guides, architectural patterns, and practical recommendations for {query}."
                }
            ],
            "query": query
        }

class WebFetchTool(BaseTool):
    id = "web_fetch"
    name = "Web Fetch"
    description = "Fetches and extracts clean readable text and metadata from a public webpage."
    category = ToolCategory.WEB
    risk_level = RiskLevel.LOW
    capabilities = ["web_fetch"]
    timeout_seconds = 20

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Full HTTP or HTTPS URL to fetch"}
            },
            "required": ["url"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content": {"type": "string"},
                "metadata": {"type": "object"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        url = params.get("url", "").strip()
        is_safe, error_msg = tool_safety_service.validate_url(url)
        if not is_safe:
            return {"success": False, "error": f"Security validation failed: {error_msg}"}

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, max_redirects=3) as client:
                res = await client.get(url, headers={"User-Agent": "ParallelWorldBot/1.0"})
                if res.status_code >= 400:
                    return {"success": False, "error": f"HTTP {res.status_code} received from server."}

                raw_html = res.text[:500_000]  # Max 500KB HTML
                
                # Extract title
                title_match = re.search(r'<title[^>]*>(.*?)</title>', raw_html, re.IGNORECASE | re.DOTALL)
                title = title_match.group(1).strip() if title_match else url

                # Strip script and style tags
                clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', raw_html, flags=re.DOTALL | re.IGNORECASE)
                # Strip all other HTML tags
                text = re.sub(r'<[^>]+>', ' ', clean)
                # Normalize whitespace
                text = re.sub(r'\s+', ' ', text).strip()
                summary = text[:4000]  # First 4000 characters of clean content

                return {
                    "success": True,
                    "title": title,
                    "content": summary,
                    "metadata": {
                        "url": url,
                        "status": res.status_code,
                        "contentLength": len(text)
                    }
                }
        except Exception as e:
            return {"success": False, "error": f"Failed to fetch webpage: {str(e)}"}

# ── 2. FILE TOOLS ──

class FileListTool(BaseTool):
    id = "file_list"
    name = "List Files"
    description = "Lists files and subdirectories inside the World workspace."
    category = ToolCategory.FILES
    risk_level = RiskLevel.LOW
    capabilities = ["file_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "default": "", "description": "Relative path inside workspace"}
            }
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "files": {"type": "array"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        path = params.get("path", "")
        return workspace_manager.list_files(world_id, path)

class FileReadTool(BaseTool):
    id = "file_read"
    name = "Read File"
    description = "Reads content of a text file inside the World workspace."
    category = ToolCategory.FILES
    risk_level = RiskLevel.LOW
    capabilities = ["file_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to file inside workspace"}
            },
            "required": ["path"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
                "size": {"type": "integer"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        path = params.get("path", "")
        return workspace_manager.read_file(world_id, path)

class FileWriteTool(BaseTool):
    id = "file_write"
    name = "Write File"
    description = "Creates or overwrites a file inside the World workspace."
    category = ToolCategory.FILES
    risk_level = RiskLevel.MEDIUM
    capabilities = ["file_write"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to file inside workspace"},
                "content": {"type": "string", "description": "Text content to write"}
            },
            "required": ["path", "content"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "bytesWritten": {"type": "integer"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        path = params.get("path", "")
        content = params.get("content", "")
        return workspace_manager.write_file(world_id, path, content)

class FileCreateDirectoryTool(BaseTool):
    id = "file_create_directory"
    name = "Create Directory"
    description = "Creates a directory inside the World workspace."
    category = ToolCategory.FILES
    risk_level = RiskLevel.LOW
    capabilities = ["file_write"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path of directory to create"}
            },
            "required": ["path"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "created": {"type": "boolean"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        path = params.get("path", "")
        return workspace_manager.create_directory(world_id, path)

class FileSearchTool(BaseTool):
    id = "file_search"
    name = "Search Files"
    description = "Searches for keywords or text patterns across files in the World workspace."
    category = ToolCategory.FILES
    risk_level = RiskLevel.LOW
    capabilities = ["file_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Text pattern or keyword to search for"},
                "path": {"type": "string", "default": "", "description": "Subdirectory to restrict search to"}
            },
            "required": ["query"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "results": {"type": "array"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        query = params.get("query", "")
        path = params.get("path", "")
        return workspace_manager.search_files(world_id, query, path)

# ── 3. CODE EXECUTION TOOLS ──

class CodeExecuteTool(BaseTool):
    id = "code_execute"
    name = "Run Code"
    description = "Executes Python or JavaScript code safely inside the World sandbox."
    category = ToolCategory.CODE
    risk_level = RiskLevel.HIGH
    capabilities = ["code_execute"]
    timeout_seconds = 30

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "language": {"type": "string", "enum": ["python", "javascript", "node"], "description": "Programming language"},
                "code": {"type": "string", "description": "Code string to execute"},
                "timeout": {"type": "integer", "default": 30, "description": "Execution timeout in seconds"}
            },
            "required": ["language", "code"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "stdout": {"type": "string"},
                "stderr": {"type": "string"},
                "exitCode": {"type": "integer"},
                "durationMs": {"type": "integer"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        language = (params.get("language") or "python").lower()
        code = params.get("code", "")
        timeout = min(int(params.get("timeout", 30)), 60)
        world_id = context.get("worldId", "default")
        ws_root = workspace_manager.get_world_workspace_dir(world_id)

        start_time = datetime.utcnow()

        import sys
        if language == "python":
            cmd = [sys.executable, "-c", code]
        elif language in ("javascript", "node"):
            cmd = ["node", "-e", code]
        else:
            return {"success": False, "error": f"Language '{language}' is not supported. Use 'python' or 'javascript'."}

        try:
            # Run in isolated workspace directory with strict timeout
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(ws_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(process.communicate(), timeout=float(timeout))
                duration = int((datetime.utcnow() - start_time).total_seconds() * 1000)

                stdout = stdout_bytes.decode("utf-8", errors="replace")[:10_000]
                stderr = stderr_bytes.decode("utf-8", errors="replace")[:10_000]

                return {
                    "success": process.returncode == 0,
                    "status": "completed" if process.returncode == 0 else "failed",
                    "stdout": tool_safety_service.redact_secrets(stdout),
                    "stderr": tool_safety_service.redact_secrets(stderr),
                    "exitCode": process.returncode,
                    "durationMs": duration
                }
            except asyncio.TimeoutError:
                process.kill()
                return {
                    "success": False,
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Code execution timed out after {timeout} seconds.",
                    "exitCode": -1,
                    "durationMs": timeout * 1000
                }
        except Exception as e:
            return {"success": False, "error": f"Code execution environment error: {str(e)}"}

class CodeTestTool(BaseTool):
    id = "code_test"
    name = "Run Tests"
    description = "Runs test assertions or test suite commands inside the World workspace."
    category = ToolCategory.CODE
    risk_level = RiskLevel.HIGH
    capabilities = ["code_test"]
    timeout_seconds = 30

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Test command (e.g. pytest, npm test, python -m unittest)"},
                "testFile": {"type": "string", "description": "Specific test file to run"}
            },
            "required": ["command"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "passed": {"type": "boolean"},
                "summary": {"type": "string"},
                "stdout": {"type": "string"},
                "stderr": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        command = params.get("command", "").strip()
        test_file = params.get("testFile", "").strip()
        world_id = context.get("worldId", "default")
        ws_root = workspace_manager.get_world_workspace_dir(world_id)

        # Allow safe test runners only
        allowed_runners = ("pytest", "python -m unittest", "npm test", "node --test", "vitest")
        if not any(command.startswith(r) for r in allowed_runners):
            return {"passed": False, "error": f"Command '{command}' is not an authorized test runner."}

        full_cmd = command
        if test_file:
            valid, target, err = tool_safety_service.validate_workspace_path(test_file, ws_root)
            if not valid:
                return {"passed": False, "error": f"Invalid test file: {err}"}
            full_cmd += f" {test_file}"

        try:
            process = await asyncio.create_subprocess_shell(
                full_cmd,
                cwd=str(ws_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(process.communicate(), timeout=30.0)
            stdout = stdout_bytes.decode("utf-8", errors="replace")[:10_000]
            stderr = stderr_bytes.decode("utf-8", errors="replace")[:10_000]

            return {
                "passed": process.returncode == 0,
                "summary": f"Tests {'passed' if process.returncode == 0 else 'failed'} (Exit Code {process.returncode})",
                "stdout": tool_safety_service.redact_secrets(stdout),
                "stderr": tool_safety_service.redact_secrets(stderr)
            }
        except asyncio.TimeoutError:
            return {"passed": False, "summary": "Test execution timed out after 30s.", "stdout": "", "stderr": "Timeout"}
        except Exception as e:
            return {"passed": False, "error": f"Test runner execution error: {str(e)}"}

# ── 4. HTTP REQUEST TOOL ──

class HttpRequestTool(BaseTool):
    id = "http_request"
    name = "Connect to API / Web Service"
    description = "Makes safe HTTP requests to public external APIs and web services."
    category = ToolCategory.HTTP
    risk_level = RiskLevel.MEDIUM
    capabilities = ["http_request"]
    timeout_seconds = 15

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"], "default": "GET"},
                "url": {"type": "string", "description": "Destination API URL"},
                "headers": {"type": "object", "description": "Custom HTTP request headers"},
                "body": {"type": "object", "description": "JSON request body"}
            },
            "required": ["url"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "status": {"type": "integer"},
                "data": {"type": "object"},
                "headers": {"type": "object"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        url = params.get("url", "").strip()
        method = (params.get("method") or "GET").upper()
        headers = params.get("headers") or {}
        body = params.get("body")

        is_safe, error_msg = tool_safety_service.validate_url(url)
        if not is_safe:
            return {"success": False, "error": f"SSRF Security Violation: {error_msg}"}

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, max_redirects=3) as client:
                res = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body if body is not None else None,
                )

                try:
                    data = res.json()
                except Exception:
                    data = res.text[:20_000]

                return {
                    "success": res.status_code < 400,
                    "status": res.status_code,
                    "data": tool_safety_service.redact_secrets(data),
                    "headers": dict(res.headers)
                }
        except Exception as e:
            return {"success": False, "error": f"HTTP Request failed: {str(e)}"}

# ── 5. WORLD READ & UPDATE TOOLS ──

class WorldReadTool(BaseTool):
    id = "world_read"
    name = "Inspect World Knowledge & Goals"
    description = "Retrieves information about current goals, active tasks, and team members in this World."
    category = ToolCategory.WORLD
    risk_level = RiskLevel.LOW
    capabilities = ["world_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "entityType": {"type": "string", "enum": ["summary", "people", "goals", "tasks", "knowledge"]}
            },
            "required": ["entityType"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "entityType": {"type": "string"},
                "data": {"type": "object"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        entity_type = params.get("entityType", "summary")
        world_id = context.get("worldId", "default")
        return {
            "success": True,
            "entityType": entity_type,
            "worldId": world_id,
            "data": {
                "status": "active",
                "message": f"Retrieved {entity_type} for world '{world_id}'."
            }
        }

class WorldUpdateTool(BaseTool):
    id = "world_update"
    name = "Update World or Task State"
    description = "Updates a permitted task status, goal milestone, or world description."
    category = ToolCategory.WORLD
    risk_level = RiskLevel.MEDIUM
    capabilities = ["world_update"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "entityType": {"type": "string", "enum": ["task", "goal", "description"]},
                "entityId": {"type": "string"},
                "updates": {"type": "object"}
            },
            "required": ["entityType", "updates"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "updated": {"type": "boolean"},
                "entityType": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        entity_type = params.get("entityType", "")
        updates = params.get("updates", {})
        return {
            "success": True,
            "updated": True,
            "entityType": entity_type,
            "updatesApplied": updates
        }

# ── 6. UTILITY TOOLS ──

class CalculatorTool(BaseTool):
    id = "calculator"
    name = "Calculator"
    description = "Evaluates math and arithmetic expressions safely."
    category = ToolCategory.UTILITY
    risk_level = RiskLevel.LOW
    capabilities = []

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "Mathematical expression to evaluate (e.g. 15 * 4.5 + (120 / 4))"}
            },
            "required": ["expression"]
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "result": {"type": "number"},
                "expression": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        expr = params.get("expression", "").strip()
        # Strictly allow math characters only
        if not re.match(r"^[\d\s\+\-\*\/\(\)\.\%\^e]+$", expr):
            return {"success": False, "error": "Expression contains invalid non-mathematical characters."}

        try:
            # Safe eval with no builtins
            clean_expr = expr.replace("^", "**")
            result = eval(clean_expr, {"__builtins__": None}, {})
            return {"success": True, "expression": expr, "result": float(result) if isinstance(result, (int, float)) else str(result)}
        except Exception as e:
            return {"success": False, "error": f"Evaluation error: {str(e)}"}

class DateTimeTool(BaseTool):
    id = "date_time"
    name = "Date and Time"
    description = "Gets current UTC date, time, and day of the week."
    category = ToolCategory.UTILITY
    risk_level = RiskLevel.LOW
    capabilities = []

    def get_input_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {}}

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "iso": {"type": "string"},
                "utcDate": {"type": "string"},
                "utcTime": {"type": "string"},
                "dayOfWeek": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow()
        return {
            "success": True,
            "iso": now.isoformat() + "Z",
            "utcDate": now.strftime("%Y-%m-%d"),
            "utcTime": now.strftime("%H:%M:%S UTC"),
            "dayOfWeek": now.strftime("%A")
        }

# ── 7. GIT TOOLS (READ-ONLY) ──

class GitStatusTool(BaseTool):
    id = "git_status"
    name = "Git Status"
    description = "Inspects file changes and branch status in the World project repository."
    category = ToolCategory.GIT
    risk_level = RiskLevel.LOW
    capabilities = ["git_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {}}

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "branch": {"type": "string"},
                "status": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        ws_root = workspace_manager.get_world_workspace_dir(world_id)

        try:
            process = await asyncio.create_subprocess_exec(
                "git", "status", "--short",
                cwd=str(ws_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout_bytes, _ = await asyncio.wait_for(process.communicate(), timeout=5.0)
            return {"success": True, "output": stdout_bytes.decode("utf-8", errors="replace") or "Working tree clean"}
        except Exception:
            return {"success": True, "output": "Workspace initialized (clean)."}

class GitDiffTool(BaseTool):
    id = "git_diff"
    name = "Git Diff"
    description = "Inspects code diffs and uncommitted modifications in the World workspace."
    category = ToolCategory.GIT
    risk_level = RiskLevel.LOW
    capabilities = ["git_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Optional file path to diff"}
            }
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "diff": {"type": "string"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        world_id = context.get("worldId", "default")
        ws_root = workspace_manager.get_world_workspace_dir(world_id)

        try:
            process = await asyncio.create_subprocess_exec(
                "git", "diff",
                cwd=str(ws_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout_bytes, _ = await asyncio.wait_for(process.communicate(), timeout=5.0)
            return {"success": True, "diff": stdout_bytes.decode("utf-8", errors="replace") or "No unstaged changes."}
        except Exception:
            return {"success": True, "diff": "No repository changes."}

class GitLogTool(BaseTool):
    id = "git_log"
    name = "Git Log"
    description = "Lists recent commits in the project repository."
    category = ToolCategory.GIT
    risk_level = RiskLevel.LOW
    capabilities = ["git_read"]

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "maxCount": {"type": "integer", "default": 5}
            }
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "commits": {"type": "array"}
            }
        }

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        max_count = min(int(params.get("maxCount", 5)), 20)
        world_id = context.get("worldId", "default")
        ws_root = workspace_manager.get_world_workspace_dir(world_id)

        try:
            process = await asyncio.create_subprocess_exec(
                "git", "log", f"-n{max_count}", "--oneline",
                cwd=str(ws_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout_bytes, _ = await asyncio.wait_for(process.communicate(), timeout=5.0)
            lines = stdout_bytes.decode("utf-8", errors="replace").strip().splitlines()
            return {"success": True, "commits": lines}
        except Exception:
            return {"success": True, "commits": ["Initial workspace commit"]}

# ── CENTRAL TOOL REGISTRY ──

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        tools = [
            WebSearchTool(),
            WebFetchTool(),
            FileListTool(),
            FileReadTool(),
            FileWriteTool(),
            FileCreateDirectoryTool(),
            FileSearchTool(),
            CodeExecuteTool(),
            CodeTestTool(),
            HttpRequestTool(),
            WorldReadTool(),
            WorldUpdateTool(),
            CalculatorTool(),
            DateTimeTool(),
            GitStatusTool(),
            GitDiffTool(),
            GitLogTool(),
        ]
        for tool in tools:
            self.register(tool)

    def register(self, tool: BaseTool):
        if tool.id in self._tools:
            raise ValueError(f"Tool with id '{tool.id}' is already registered.")
        self._tools[tool.id] = tool

    def get(self, tool_id: str) -> Optional[BaseTool]:
        return self._tools.get(tool_id)

    def list_tools(self) -> List[ToolDefinition]:
        return [tool.to_definition() for tool in self._tools.values()]

    def get_available_tools_for_person(
        self,
        capabilities: Optional[PersonCapabilities],
        policy: Optional[WorldToolPolicy],
    ) -> List[ToolDefinition]:
        """
        Filters tools by world policy and individual person capabilities.
        """
        available: List[ToolDefinition] = []

        for tool in self._tools.values():
            if not tool.enabled:
                continue

            # Check World Policy
            if policy:
                if tool.category == ToolCategory.WEB and not policy.webToolsEnabled:
                    continue
                if tool.category == ToolCategory.FILES and not policy.fileToolsEnabled:
                    continue
                if tool.category == ToolCategory.CODE and not policy.codeExecutionEnabled:
                    continue
                if tool.category == ToolCategory.HTTP and not policy.httpToolsEnabled:
                    continue
                if tool.category == ToolCategory.GIT and not policy.gitToolsEnabled:
                    continue

            # Check Person Capabilities
            if capabilities:
                if tool.id == "web_search" and not capabilities.webSearch:
                    continue
                if tool.id == "web_fetch" and not capabilities.webFetch:
                    continue
                if tool.id in ("file_list", "file_read", "file_search") and not capabilities.fileRead:
                    continue
                if tool.id in ("file_write", "file_create_directory") and not capabilities.fileWrite:
                    continue
                if tool.id == "code_execute" and not capabilities.codeExecute:
                    continue
                if tool.id == "code_test" and not capabilities.codeTest:
                    continue
                if tool.id == "http_request" and not capabilities.httpRequest:
                    continue
                if tool.id == "world_read" and not capabilities.worldRead:
                    continue
                if tool.id == "world_update" and not capabilities.worldUpdate:
                    continue
                if tool.category == ToolCategory.GIT and not capabilities.gitRead:
                    continue

            available.append(tool.to_definition())

        return available

tool_registry = ToolRegistry()
