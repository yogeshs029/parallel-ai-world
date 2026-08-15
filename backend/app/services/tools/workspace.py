import os
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from .safety import tool_safety_service

MAX_FILE_READ_BYTES = 1024 * 1024 * 2  # 2 MB max read
MAX_FILE_WRITE_BYTES = 1024 * 1024 * 5  # 5 MB max write

class WorkspaceManager:
    def __init__(self, base_storage_dir: Optional[Path] = None):
        if base_storage_dir:
            self.base_dir = Path(base_storage_dir)
        else:
            # Default to backend/storage/workspaces
            self.base_dir = Path(__file__).resolve().parent.parent.parent / "storage" / "workspaces"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_world_workspace_dir(self, world_id: str) -> Path:
        """
        Returns and ensures the isolated workspace root for a given world.
        """
        clean_id = "".join(c for c in world_id if c.isalnum() or c in ("-", "_")).strip()
        if not clean_id:
            clean_id = "default_world"
        world_dir = self.base_dir / clean_id
        world_dir.mkdir(parents=True, exist_ok=True)
        return world_dir

    def list_files(self, world_id: str, rel_path: str = "") -> Dict[str, Any]:
        """
        Lists files and directories inside the permitted workspace.
        """
        root = self.get_world_workspace_dir(world_id)
        valid, target, err = tool_safety_service.validate_workspace_path(rel_path or ".", root)
        if not valid or target is None:
            return {"success": False, "error": err or "Invalid path"}

        if not target.exists():
            return {"success": False, "error": f"Path '{rel_path}' does not exist in workspace."}

        if not target.is_dir():
            return {"success": False, "error": f"Path '{rel_path}' is a file, not a directory."}

        entries = []
        try:
            for item in sorted(target.iterdir()):
                stat = item.stat()
                entries.append({
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "size": stat.st_size if item.is_file() else 0,
                    "modifiedAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": str(item.relative_to(root)).replace("\\", "/")
                })
            return {"success": True, "path": rel_path or "/", "files": entries}
        except Exception as e:
            return {"success": False, "error": f"Failed to list directory: {str(e)}"}

    def read_file(self, world_id: str, rel_path: str) -> Dict[str, Any]:
        """
        Reads content from a sandboxed workspace file.
        """
        root = self.get_world_workspace_dir(world_id)
        valid, target, err = tool_safety_service.validate_workspace_path(rel_path, root)
        if not valid or target is None:
            return {"success": False, "error": err or "Invalid path"}

        if not target.exists():
            return {"success": False, "error": f"File '{rel_path}' not found."}

        if target.is_dir():
            return {"success": False, "error": f"Path '{rel_path}' is a directory, not a file."}

        try:
            size = target.stat().st_size
            if size > MAX_FILE_READ_BYTES:
                return {
                    "success": False,
                    "error": f"File size ({size} bytes) exceeds the maximum read limit of {MAX_FILE_READ_BYTES} bytes."
                }

            with open(target, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            return {
                "success": True,
                "path": str(target.relative_to(root)).replace("\\", "/"),
                "size": size,
                "content": content,
                "modifiedAt": datetime.fromtimestamp(target.stat().st_mtime).isoformat()
            }
        except Exception as e:
            return {"success": False, "error": f"Could not read file '{rel_path}': {str(e)}"}

    def write_file(self, world_id: str, rel_path: str, content: str) -> Dict[str, Any]:
        """
        Writes text content to a sandboxed workspace file. Creates parent directories as needed.
        """
        root = self.get_world_workspace_dir(world_id)
        valid, target, err = tool_safety_service.validate_workspace_path(rel_path, root)
        if not valid or target is None:
            return {"success": False, "error": err or "Invalid path"}

        content_bytes = content.encode("utf-8")
        if len(content_bytes) > MAX_FILE_WRITE_BYTES:
            return {
                "success": False,
                "error": f"Content length ({len(content_bytes)} bytes) exceeds the maximum write limit of {MAX_FILE_WRITE_BYTES} bytes."
            }

        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(content)

            return {
                "success": True,
                "path": str(target.relative_to(root)).replace("\\", "/"),
                "bytesWritten": len(content_bytes),
                "modifiedAt": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": f"Could not write file '{rel_path}': {str(e)}"}

    def create_directory(self, world_id: str, rel_path: str) -> Dict[str, Any]:
        """
        Creates a new directory inside the permitted workspace.
        """
        root = self.get_world_workspace_dir(world_id)
        valid, target, err = tool_safety_service.validate_workspace_path(rel_path, root)
        if not valid or target is None:
            return {"success": False, "error": err or "Invalid path"}

        try:
            target.mkdir(parents=True, exist_ok=True)
            return {
                "success": True,
                "path": str(target.relative_to(root)).replace("\\", "/"),
                "created": True
            }
        except Exception as e:
            return {"success": False, "error": f"Could not create directory '{rel_path}': {str(e)}"}

    def search_files(self, world_id: str, query: str, rel_path: str = "") -> Dict[str, Any]:
        """
        Searches for a text pattern in files within the permitted workspace.
        """
        root = self.get_world_workspace_dir(world_id)
        valid, search_dir, err = tool_safety_service.validate_workspace_path(rel_path or ".", root)
        if not valid or search_dir is None:
            return {"success": False, "error": err or "Invalid path"}

        if not search_dir.exists():
            return {"success": False, "error": "Search directory does not exist."}

        results = []
        q_lower = query.lower()

        try:
            for dirpath, _, filenames in os.walk(search_dir):
                for filename in filenames:
                    file_path = Path(dirpath) / filename
                    if file_path.stat().st_size > 500_000:
                        continue  # Skip large files in search
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            lines = f.readlines()
                        matches = []
                        for idx, line in enumerate(lines, 1):
                            if q_lower in line.lower():
                                matches.append({"line": idx, "content": line.strip()})
                                if len(matches) >= 5:
                                    break
                        if matches or q_lower in filename.lower():
                            results.append({
                                "file": str(file_path.relative_to(root)).replace("\\", "/"),
                                "matches": matches
                            })
                            if len(results) >= 20:
                                break
                    except Exception:
                        continue
                if len(results) >= 20:
                    break

            return {"success": True, "query": query, "results": results}
        except Exception as e:
            return {"success": False, "error": f"File search failed: {str(e)}"}

workspace_manager = WorkspaceManager()
