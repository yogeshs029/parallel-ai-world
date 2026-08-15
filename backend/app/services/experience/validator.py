import re
from typing import Dict, Any, Tuple, Optional

HEX_COLOR_REGEX = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

def parse_hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    clean = hex_str.lstrip("#")
    if len(clean) == 3:
        clean = "".join(c * 2 for c in clean)
    return int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)

def calculate_luminance(r: int, g: int, b: int) -> float:
    def channel_lum(c: int) -> float:
        v = c / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * channel_lum(r) + 0.7152 * channel_lum(g) + 0.0722 * channel_lum(b)

def get_contrast_ratio(hex1: str, hex2: str) -> float:
    try:
        rgb1 = parse_hex_to_rgb(hex1)
        rgb2 = parse_hex_to_rgb(hex2)
        lum1 = calculate_luminance(*rgb1)
        lum2 = calculate_luminance(*rgb2)
        brightest = max(lum1, lum2)
        darkest = min(lum1, lum2)
        return (brightest + 0.05) / (darkest + 0.05)
    except Exception:
        return 4.5  # default safe fallback

class WorldChangeValidator:
    @staticmethod
    def validate_color(color_str: str) -> Tuple[bool, Optional[str]]:
        if not color_str or not isinstance(color_str, str):
            return False, "Color must be a valid hex string."
        if not HEX_COLOR_REGEX.match(color_str.strip()):
            return False, f"Invalid color format '{color_str}'. Expected hex format (e.g. #8B5CF6)."
        return True, None

    @staticmethod
    def validate_theme_safety(theme_dict: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        bg = theme_dict.get("backgroundColor", "#090A12")
        text = theme_dict.get("textColor", "#FFFFFF")

        # Validate color format
        valid_bg, err_bg = WorldChangeValidator.validate_color(bg)
        if not valid_bg:
            return False, f"Invalid background color: {err_bg}"

        valid_text, err_text = WorldChangeValidator.validate_color(text)
        if not valid_text:
            return False, f"Invalid text color: {err_text}"

        # Check contrast between background and text
        if bg.startswith("#") and text.startswith("#"):
            ratio = get_contrast_ratio(bg, text)
            if ratio < 2.5:
                return False, f"Insufficient text contrast (Ratio: {ratio:.1f}:1). Text would be unreadable."

        return True, None

    @staticmethod
    def validate_proposal(changes: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        if not changes or not isinstance(changes, dict):
            return False, "Proposal changes must be a dictionary."

        # Validate theme if present
        if "theme" in changes and isinstance(changes["theme"], dict):
            theme_valid, theme_err = WorldChangeValidator.validate_theme_safety(changes["theme"])
            if not theme_valid:
                return False, theme_err

        # Validate terminology if present
        if "terminology" in changes and isinstance(changes["terminology"], dict):
            for k, v in changes["terminology"].items():
                if not isinstance(v, str) or len(v.strip()) == 0:
                    return False, f"Terminology for '{k}' cannot be empty."

        return True, None

world_change_validator = WorldChangeValidator()
