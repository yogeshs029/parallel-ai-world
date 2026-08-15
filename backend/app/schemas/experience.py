from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ThemePreset(str, Enum):
    MODERN = "modern"
    MINIMAL = "minimal"
    WARM = "warm"
    PROFESSIONAL = "professional"
    PLAYFUL = "playful"
    ELEGANT = "elegant"
    DARK = "dark"
    LIGHT = "light"
    LUXURY = "luxury"
    CUSTOM = "custom"

class BorderRadiusOption(str, Enum):
    NONE = "none"
    SM = "sm"
    MD = "md"
    LG = "lg"
    XL = "xl"
    FULL = "full"

class DensityOption(str, Enum):
    COMPACT = "compact"
    COMFORTABLE = "comfortable"
    SPACIOUS = "spacious"

class TypographyOption(str, Enum):
    INTER = "inter"
    OUTFIT = "outfit"
    ROBOTO = "roboto"
    SERIF = "serif"
    MONO = "mono"

class ShadowOption(str, Enum):
    NONE = "none"
    SUBTLE = "subtle"
    ELEVATED = "elevated"
    GLOW = "glow"

class WorldTheme(BaseModel):
    preset: ThemePreset = Field(default=ThemePreset.MODERN)
    primaryColor: str = Field(default="#8B5CF6", description="Primary brand accent color (hex)")
    secondaryColor: str = Field(default="#6366F1", description="Secondary accent color (hex)")
    accentColor: str = Field(default="#EC4899", description="Highlight accent color (hex)")
    backgroundColor: str = Field(default="#090A12", description="Main background canvas color")
    surfaceColor: str = Field(default="#121426", description="Card and panel surface background")
    surfaceBorderColor: str = Field(default="rgba(255, 255, 255, 0.08)", description="Border color for containers")
    textColor: str = Field(default="#FFFFFF", description="Main text color")
    mutedTextColor: str = Field(default="#94A3B8", description="Muted secondary text color")
    borderRadius: BorderRadiusOption = Field(default=BorderRadiusOption.LG)
    density: DensityOption = Field(default=DensityOption.COMFORTABLE)
    typography: TypographyOption = Field(default=TypographyOption.INTER)
    shadows: ShadowOption = Field(default=ShadowOption.GLOW)

class WorldNavigationItem(BaseModel):
    id: str
    label: str
    icon: str = "Folder"
    path: str
    visible: bool = True
    order: int = 0

class WorldTerminology(BaseModel):
    peopleLabel: str = Field(default="People", description="Plural label for people/members")
    personLabel: str = Field(default="Person", description="Singular label")
    goalsLabel: str = Field(default="Goals", description="Plural label for goals")
    goalLabel: str = Field(default="Goal", description="Singular label")
    tasksLabel: str = Field(default="Tasks", description="Plural label for tasks")
    taskLabel: str = Field(default="Task", description="Singular label")
    projectsLabel: str = Field(default="Projects", description="Plural label for projects")
    knowledgeLabel: str = Field(default="Knowledge", description="Label for knowledge base")
    activityLabel: str = Field(default="Activity", description="Label for activity log")

class WorldHeaderConfig(BaseModel):
    showLogo: bool = True
    showSearch: bool = True
    showMemberAvatars: bool = True
    showCommandTrigger: bool = True
    customTagline: Optional[str] = None

class WorldFooterConfig(BaseModel):
    enabled: bool = False
    customText: Optional[str] = None
    showReturnHome: bool = True

class WorldDashboardBlock(BaseModel):
    id: str
    type: str  # people, goals, tasks, projects, knowledge, activity, summary, metrics
    title: str
    size: str = "medium"  # small, medium, large, full
    visible: bool = True
    order: int = 0

class WorldExperience(BaseModel):
    worldId: str
    theme: WorldTheme = Field(default_factory=WorldTheme)
    layout: str = Field(default="standard", description="Layout style: standard, featured, sidebar, compact")
    navigation: List[WorldNavigationItem] = Field(default_factory=list)
    headerConfig: WorldHeaderConfig = Field(default_factory=WorldHeaderConfig)
    footerConfig: WorldFooterConfig = Field(default_factory=WorldFooterConfig)
    terminology: WorldTerminology = Field(default_factory=WorldTerminology)
    dashboardBlocks: List[WorldDashboardBlock] = Field(default_factory=list)
    enabledFeatures: List[str] = Field(default_factory=lambda: ["people", "goals", "tasks", "knowledge", "activity", "tools", "memory"])
    customizations: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class WorldExperienceUpdate(BaseModel):
    theme: Optional[WorldTheme] = None
    layout: Optional[str] = None
    navigation: Optional[List[WorldNavigationItem]] = None
    headerConfig: Optional[WorldHeaderConfig] = None
    footerConfig: Optional[WorldFooterConfig] = None
    terminology: Optional[WorldTerminology] = None
    dashboardBlocks: Optional[List[WorldDashboardBlock]] = None
    enabledFeatures: Optional[List[str]] = None
    customizations: Optional[Dict[str, Any]] = None

class CommandDomain(str, Enum):
    WORLD_EXPERIENCE = "WORLD_EXPERIENCE"
    PERSON = "PERSON"
    RELATIONSHIP = "RELATIONSHIP"
    GOAL = "GOAL"
    TASK = "TASK"
    KNOWLEDGE = "KNOWLEDGE"
    PROJECT = "PROJECT"
    PERMISSION = "PERMISSION"
    TOOL = "TOOL"

class WorldChangeProposal(BaseModel):
    id: str
    worldId: str
    prompt: str
    domain: CommandDomain = CommandDomain.WORLD_EXPERIENCE
    summary: str
    changes: Dict[str, Any] = Field(default_factory=dict, description="Structured changes to apply")
    requiresApproval: bool = False
    status: str = Field(default="preview", description="preview, applied, rejected, failed")
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    appliedAt: Optional[str] = None

class WorldExperienceVersion(BaseModel):
    id: str
    worldId: str
    versionNumber: int
    configuration: Dict[str, Any]
    reason: str = "User customization"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    createdBy: str = "User"

class WorldCommandInput(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language customization or action request")
