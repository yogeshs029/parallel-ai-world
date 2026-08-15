import uuid
import copy
from datetime import datetime
from typing import Dict, Any, List, Optional

from ...schemas.experience import (
    WorldExperience,
    WorldExperienceUpdate,
    WorldTheme,
    ThemePreset,
    BorderRadiusOption,
    DensityOption,
    TypographyOption,
    ShadowOption,
    WorldNavigationItem,
    WorldTerminology,
    WorldHeaderConfig,
    WorldFooterConfig,
    WorldDashboardBlock,
    WorldExperienceVersion,
)

PRESETS: Dict[str, Dict[str, Any]] = {
    "modern": {
        "preset": ThemePreset.MODERN,
        "primaryColor": "#8B5CF6",
        "secondaryColor": "#6366F1",
        "accentColor": "#EC4899",
        "backgroundColor": "#090A12",
        "surfaceColor": "#121426",
        "surfaceBorderColor": "rgba(255, 255, 255, 0.08)",
        "textColor": "#FFFFFF",
        "mutedTextColor": "#94A3B8",
        "borderRadius": BorderRadiusOption.LG,
        "density": DensityOption.COMFORTABLE,
        "typography": TypographyOption.INTER,
        "shadows": ShadowOption.GLOW,
    },
    "warm": {
        "preset": ThemePreset.WARM,
        "primaryColor": "#F59E0B",
        "secondaryColor": "#EA580C",
        "accentColor": "#F43F5E",
        "backgroundColor": "#0F0D0B",
        "surfaceColor": "#1C1713",
        "surfaceBorderColor": "rgba(245, 158, 11, 0.15)",
        "textColor": "#FFFBEB",
        "mutedTextColor": "#D97706",
        "borderRadius": BorderRadiusOption.XL,
        "density": DensityOption.SPACIOUS,
        "typography": TypographyOption.OUTFIT,
        "shadows": ShadowOption.ELEVATED,
    },
    "professional": {
        "preset": ThemePreset.PROFESSIONAL,
        "primaryColor": "#2563EB",
        "secondaryColor": "#0284C7",
        "accentColor": "#10B981",
        "backgroundColor": "#0A0D14",
        "surfaceColor": "#131926",
        "surfaceBorderColor": "rgba(255, 255, 255, 0.10)",
        "textColor": "#F8FAFC",
        "mutedTextColor": "#64748B",
        "borderRadius": BorderRadiusOption.MD,
        "density": DensityOption.COMPACT,
        "typography": TypographyOption.ROBOTO,
        "shadows": ShadowOption.SUBTLE,
    },
    "luxury": {
        "preset": ThemePreset.LUXURY,
        "primaryColor": "#D97706",
        "secondaryColor": "#B45309",
        "accentColor": "#F59E0B",
        "backgroundColor": "#080706",
        "surfaceColor": "#141210",
        "surfaceBorderColor": "rgba(217, 119, 6, 0.25)",
        "textColor": "#FAF5EE",
        "mutedTextColor": "#A8A29E",
        "borderRadius": BorderRadiusOption.SM,
        "density": DensityOption.SPACIOUS,
        "typography": TypographyOption.SERIF,
        "shadows": ShadowOption.ELEVATED,
    },
    "dark": {
        "preset": ThemePreset.DARK,
        "primaryColor": "#38BDF8",
        "secondaryColor": "#818CF8",
        "accentColor": "#34D399",
        "backgroundColor": "#030712",
        "surfaceColor": "#0F172A",
        "surfaceBorderColor": "rgba(255, 255, 255, 0.08)",
        "textColor": "#F9FAFB",
        "mutedTextColor": "#9CA3AF",
        "borderRadius": BorderRadiusOption.LG,
        "density": DensityOption.COMFORTABLE,
        "typography": TypographyOption.INTER,
        "shadows": ShadowOption.GLOW,
    },
    "playful": {
        "preset": ThemePreset.PLAYFUL,
        "primaryColor": "#EC4899",
        "secondaryColor": "#8B5CF6",
        "accentColor": "#F59E0B",
        "backgroundColor": "#0E0717",
        "surfaceColor": "#1A1028",
        "surfaceBorderColor": "rgba(236, 72, 153, 0.2)",
        "textColor": "#FFFFFF",
        "mutedTextColor": "#C084FC",
        "borderRadius": BorderRadiusOption.FULL,
        "density": DensityOption.COMFORTABLE,
        "typography": TypographyOption.OUTFIT,
        "shadows": ShadowOption.GLOW,
    },
}

class WorldExperienceEngine:
    def __init__(self):
        self._experiences: Dict[str, WorldExperience] = {}
        self._version_history: Dict[str, List[WorldExperienceVersion]] = {}

    def get_default_navigation(self, world_id: str, world_type: str = "company") -> List[WorldNavigationItem]:
        is_home = "home" in world_id.lower() or world_type == "home"
        is_school = "school" in world_id.lower() or world_type == "school"

        if is_home:
            return [
                WorldNavigationItem(id="home", label="Home", icon="Home", path=f"/world/{world_id}", visible=True, order=0),
                WorldNavigationItem(id="people", label="Family", icon="Users", path=f"/world/{world_id}/people", visible=True, order=1),
                WorldNavigationItem(id="goals", label="Plans", icon="Target", path=f"/world/{world_id}", visible=True, order=2),
                WorldNavigationItem(id="tasks", label="Things to Do", icon="CheckSquare", path=f"/world/{world_id}", visible=True, order=3),
                WorldNavigationItem(id="knowledge", label="Home Info", icon="BookOpen", path=f"/world/{world_id}/knowledge", visible=True, order=4),
                WorldNavigationItem(id="memory", label="Memories", icon="Brain", path=f"/world/{world_id}/memory", visible=True, order=5),
            ]
        elif is_school:
            return [
                WorldNavigationItem(id="overview", label="Classroom", icon="GraduationCap", path=f"/world/{world_id}", visible=True, order=0),
                WorldNavigationItem(id="people", label="Students & Teachers", icon="Users", path=f"/world/{world_id}/people", visible=True, order=1),
                WorldNavigationItem(id="goals", label="Learning Goals", icon="Target", path=f"/world/{world_id}", visible=True, order=2),
                WorldNavigationItem(id="tasks", label="Assignments", icon="CheckSquare", path=f"/world/{world_id}", visible=True, order=3),
                WorldNavigationItem(id="knowledge", label="Course Library", icon="BookOpen", path=f"/world/{world_id}/knowledge", visible=True, order=4),
                WorldNavigationItem(id="activity", label="Activity", icon="Activity", path=f"/world/{world_id}", visible=True, order=5),
            ]

        # Default Company
        return [
            WorldNavigationItem(id="overview", label="Dashboard", icon="LayoutDashboard", path=f"/world/{world_id}", visible=True, order=0),
            WorldNavigationItem(id="people", label="People", icon="Users", path=f"/world/{world_id}/people", visible=True, order=1),
            WorldNavigationItem(id="goals", label="Goals & Tasks", icon="Target", path=f"/world/{world_id}", visible=True, order=2),
            WorldNavigationItem(id="knowledge", label="Knowledge Base", icon="BookOpen", path=f"/world/{world_id}/knowledge", visible=True, order=3),
            WorldNavigationItem(id="memory", label="Memory", icon="Brain", path=f"/world/{world_id}/memory", visible=True, order=4),
            WorldNavigationItem(id="activity", label="Activity Log", icon="Activity", path=f"/world/{world_id}", visible=True, order=5),
        ]

    def get_default_terminology(self, world_id: str, world_type: str = "company") -> WorldTerminology:
        if "home" in world_id.lower() or world_type == "home":
            return WorldTerminology(
                peopleLabel="Family",
                personLabel="Family Member",
                goalsLabel="Plans",
                goalLabel="Plan",
                tasksLabel="Things to do",
                taskLabel="Task",
                projectsLabel="Home Projects",
                knowledgeLabel="Household Knowledge",
                activityLabel="Activity"
            )
        elif "school" in world_id.lower() or world_type == "school":
            return WorldTerminology(
                peopleLabel="Students & Teachers",
                personLabel="Member",
                goalsLabel="Learning Goals",
                goalLabel="Learning Goal",
                tasksLabel="Assignments",
                taskLabel="Assignment",
                projectsLabel="Lessons",
                knowledgeLabel="Course Material",
                activityLabel="Class Activity"
            )

        return WorldTerminology()

    def get_default_dashboard_blocks(self) -> List[WorldDashboardBlock]:
        return [
            WorldDashboardBlock(id="summary", type="summary", title="World Overview", size="full", visible=True, order=0),
            WorldDashboardBlock(id="metrics", type="metrics", title="Key Metrics", size="full", visible=True, order=1),
            WorldDashboardBlock(id="people", type="people", title="Active People", size="medium", visible=True, order=2),
            WorldDashboardBlock(id="goals", type="goals", title="Goals & Objectives", size="medium", visible=True, order=3),
            WorldDashboardBlock(id="activity", type="activity", title="Recent Activity", size="large", visible=True, order=4),
        ]

    def get_or_create_experience(self, world_id: str, world_type: str = "company") -> WorldExperience:
        if world_id not in self._experiences:
            preset_key = "warm" if "home" in world_id.lower() else "professional" if "company" in world_id.lower() else "modern"
            theme_dict = PRESETS.get(preset_key, PRESETS["modern"])
            theme = WorldTheme(**theme_dict)

            exp = WorldExperience(
                worldId=world_id,
                theme=theme,
                layout="standard",
                navigation=self.get_default_navigation(world_id, world_type),
                headerConfig=WorldHeaderConfig(showLogo=True, showSearch=True, showMemberAvatars=True, showCommandTrigger=True),
                footerConfig=WorldFooterConfig(enabled=False, showReturnHome=True),
                terminology=self.get_default_terminology(world_id, world_type),
                dashboardBlocks=self.get_default_dashboard_blocks(),
                version=1,
                updatedAt=datetime.utcnow().isoformat(),
            )
            self._experiences[world_id] = exp
            self._save_version(world_id, exp, "Initial World experience created")

        return self._experiences[world_id]

    def update_experience(self, world_id: str, update: WorldExperienceUpdate, reason: str = "User updated experience") -> WorldExperience:
        current = self.get_or_create_experience(world_id)

        # Snapshot for undo/versioning
        self._save_version(world_id, current, reason)

        # Apply partial updates
        if update.theme is not None:
            current.theme = update.theme
        if update.layout is not None:
            current.layout = update.layout
        if update.navigation is not None:
            current.navigation = update.navigation
        if update.headerConfig is not None:
            current.headerConfig = update.headerConfig
        if update.footerConfig is not None:
            current.footerConfig = update.footerConfig
        if update.terminology is not None:
            current.terminology = update.terminology
        if update.dashboardBlocks is not None:
            current.dashboardBlocks = update.dashboardBlocks
        if update.enabledFeatures is not None:
            current.enabledFeatures = update.enabledFeatures
        if update.customizations is not None:
            current.customizations = update.customizations

        current.version += 1
        current.updatedAt = datetime.utcnow().isoformat()
        self._experiences[world_id] = current
        return current

    def _save_version(self, world_id: str, exp: WorldExperience, reason: str):
        if world_id not in self._version_history:
            self._version_history[world_id] = []

        ver = WorldExperienceVersion(
            id=f"ver-{uuid.uuid4().hex[:8]}",
            worldId=world_id,
            versionNumber=exp.version,
            configuration=copy.deepcopy(exp.model_dump()),
            reason=reason,
            createdAt=datetime.utcnow().isoformat(),
            createdBy="User",
        )
        self._version_history[world_id].append(ver)
        if len(self._version_history[world_id]) > 30:
            self._version_history[world_id].pop(0)

    def list_versions(self, world_id: str) -> List[WorldExperienceVersion]:
        return list(reversed(self._version_history.get(world_id, [])))

    def undo(self, world_id: str) -> WorldExperience:
        history = self._version_history.get(world_id, [])
        if not history:
            return self.get_or_create_experience(world_id)

        last_snapshot = history.pop()
        raw_config = last_snapshot.configuration

        restored = WorldExperience(**raw_config)
        restored.version += 1
        restored.updatedAt = datetime.utcnow().isoformat()
        self._experiences[world_id] = restored
        return restored

world_experience_engine = WorldExperienceEngine()
