import re
import ipaddress
import socket
from urllib.parse import urlparse
from pathlib import Path
from typing import Tuple, Optional, Any

# Blocked host path patterns
BLOCKED_SYSTEM_PATHS = [
    r"^/etc(/.*)?$",
    r"^/var(/.*)?$",
    r"^/usr(/.*)?$",
    r"^/root(/.*)?$",
    r"^/sys(/.*)?$",
    r"^/proc(/.*)?$",
    r"^[a-zA-Z]:\\windows(\\.*)?$",
    r"^[a-zA-Z]:\\program files(\\.*)?$",
    r"^[a-zA-Z]:\\program files \(x86\)(\\.*)?$",
    r"^[a-zA-Z]:\\system32(\\.*)?$",
    r".*\.ssh(/|\\).*",
    r".*\.aws(/|\\).*",
    r".*\.git(/|\\)config$",
    r".*\.env(\..*)?$",
]

# Sensitive keys and tokens patterns for redaction
SECRET_PATTERNS = [
    (re.compile(r"sk-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE), "sk-***REDACTED***"),
    (re.compile(r"gsk_[a-zA-Z0-9_\-]{20,}", re.IGNORECASE), "gsk_***REDACTED***"),
    (re.compile(r"AIzaSy[a-zA-Z0-9_\-]{30,}", re.IGNORECASE), "AIzaSy***REDACTED***"),
    (re.compile(r"(Bearer\s+)[a-zA-Z0-9\._\-]{20,}", re.IGNORECASE), r"\1***REDACTED***"),
    (re.compile(r"(password|secret|token|apiKey|api_key)(\s*[:=]\s*['\"])[^'\"]+(['\"])", re.IGNORECASE), r"\1\2***REDACTED***\3"),
]

class ToolSafetyService:
    @staticmethod
    def validate_url(url_str: str) -> Tuple[bool, Optional[str]]:
        """
        Validates a URL against SSRF and unsafe schemes.
        Blocks localhost, private IPv4/IPv6 ranges, cloud metadata IPs, and non-http/https schemes.
        """
        if not url_str or not isinstance(url_str, str):
            return False, "URL is empty or invalid."

        try:
            parsed = urlparse(url_str.strip())
        except Exception:
            return False, "Could not parse URL."

        scheme = (parsed.scheme or "").lower()
        if scheme not in ("http", "https"):
            return False, f"URL scheme '{scheme}' is forbidden. Only HTTP and HTTPS are allowed."

        hostname = (parsed.hostname or "").strip().lower()
        if not hostname:
            return False, "URL hostname is missing."

        # Block loopback and metadata hostnames
        if hostname in ("localhost", "0.0.0.0", "127.0.0.1", "::1", "metadata.google.internal", "instance-data"):
            return False, f"Access to internal host '{hostname}' is blocked for SSRF protection."

        # Block default port violations
        port = parsed.port
        if port is not None and port not in (80, 443, 8080, 8443):
            return False, f"Port {port} is not permitted for outgoing requests."

        # Resolve IP address to test private ranges
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip = ipaddress.ip_address(ip_str)

                if ip.is_loopback:
                    return False, f"Hostname '{hostname}' resolves to loopback IP {ip_str} (SSRF blocked)."
                if ip.is_private:
                    return False, f"Hostname '{hostname}' resolves to private network IP {ip_str} (SSRF blocked)."
                if ip.is_link_local:
                    return False, f"Hostname '{hostname}' resolves to link-local IP {ip_str} (SSRF blocked)."
                if ip.is_reserved:
                    return False, f"Hostname '{hostname}' resolves to reserved IP {ip_str} (SSRF blocked)."

                # Check AWS/GCP/Azure link-local metadata IP 169.254.169.254
                if ip_str == "169.254.169.254":
                    return False, "Access to cloud metadata service (169.254.169.254) is blocked."
        except socket.gaierror:
            return False, f"Could not resolve hostname '{hostname}'."
        except Exception as e:
            return False, f"IP validation failed for hostname '{hostname}': {str(e)}"

        return True, None

    @staticmethod
    def validate_workspace_path(rel_path: str, workspace_root: Path) -> Tuple[bool, Optional[Path], Optional[str]]:
        """
        Validates that a relative path stays inside the given workspace root.
        Prevents traversal (../), absolute host paths, and sensitive system targets.
        """
        if not rel_path:
            return False, None, "Path is empty."

        clean_path_str = str(rel_path).strip().replace("\\", "/")

        # Check for traversal attempts
        if ".." in clean_path_str.split("/"):
            return False, None, "Path traversal sequence ('..') is not permitted."

        # Check blocked system patterns
        for pattern in BLOCKED_SYSTEM_PATHS:
            if re.match(pattern, clean_path_str, re.IGNORECASE):
                return False, None, f"Access to system or sensitive path '{clean_path_str}' is blocked."

        try:
            # Resolve against workspace root
            target_path = (workspace_root / clean_path_str.lstrip("/")).resolve()
            resolved_root = workspace_root.resolve()

            # Ensure target is strictly inside workspace_root
            try:
                target_path.relative_to(resolved_root)
            except ValueError:
                return False, None, "Path escapes the permitted World workspace boundary."

            return True, target_path, None
        except Exception as e:
            return False, None, f"Path resolution failed: {str(e)}"

    @staticmethod
    def redact_secrets(content: Any) -> Any:
        """
        Redacts sensitive tokens, API keys, and passwords from logs and messages.
        """
        if isinstance(content, str):
            res = content
            for pattern, repl in SECRET_PATTERNS:
                res = pattern.sub(repl, res)
            return res
        elif isinstance(content, dict):
            return {k: ToolSafetyService.redact_secrets(v) for k, v in content.items()}
        elif isinstance(content, list):
            return [ToolSafetyService.redact_secrets(i) for i in content]
        return content

tool_safety_service = ToolSafetyService()
