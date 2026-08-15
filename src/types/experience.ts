export type ThemePreset =
  | 'modern'
  | 'minimal'
  | 'warm'
  | 'professional'
  | 'playful'
  | 'elegant'
  | 'dark'
  | 'light'
  | 'luxury'
  | 'custom';

export type BorderRadiusOption = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type DensityOption = 'compact' | 'comfortable' | 'spacious';

export type TypographyOption = 'inter' | 'outfit' | 'roboto' | 'serif' | 'mono';

export type ShadowOption = 'none' | 'subtle' | 'elevated' | 'glow';

export interface WorldTheme {
  preset: ThemePreset;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceBorderColor: string;
  textColor: string;
  mutedTextColor: string;
  borderRadius: BorderRadiusOption;
  density: DensityOption;
  typography: TypographyOption;
  shadows: ShadowOption;
}

export interface WorldNavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  visible: boolean;
  order: number;
}

export interface WorldTerminology {
  peopleLabel: string;
  personLabel: string;
  goalsLabel: string;
  goalLabel: string;
  tasksLabel: string;
  taskLabel: string;
  projectsLabel: string;
  knowledgeLabel: string;
  activityLabel: string;
}

export interface WorldHeaderConfig {
  showLogo: boolean;
  showSearch: boolean;
  showMemberAvatars: boolean;
  showCommandTrigger: boolean;
  customTagline?: string | null;
}

export interface WorldFooterConfig {
  enabled: boolean;
  customText?: string | null;
  showReturnHome: boolean;
}

export interface WorldDashboardBlock {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  visible: boolean;
  order: number;
}

export interface WorldExperience {
  worldId: string;
  theme: WorldTheme;
  layout: string;
  navigation: WorldNavigationItem[];
  headerConfig: WorldHeaderConfig;
  footerConfig: WorldFooterConfig;
  terminology: WorldTerminology;
  dashboardBlocks: WorldDashboardBlock[];
  enabledFeatures: string[];
  customizations: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

export interface WorldExperienceUpdate {
  theme?: WorldTheme;
  layout?: string;
  navigation?: WorldNavigationItem[];
  headerConfig?: WorldHeaderConfig;
  footerConfig?: WorldFooterConfig;
  terminology?: WorldTerminology;
  dashboardBlocks?: WorldDashboardBlock[];
  enabledFeatures?: string[];
  customizations?: Record<string, unknown>;
}

export type CommandDomain =
  | 'WORLD_EXPERIENCE'
  | 'PERSON'
  | 'RELATIONSHIP'
  | 'GOAL'
  | 'TASK'
  | 'KNOWLEDGE'
  | 'PROJECT'
  | 'PERMISSION'
  | 'TOOL';

export interface WorldChangeProposal {
  id: string;
  worldId: string;
  prompt: string;
  domain: CommandDomain;
  summary: string;
  changes: Record<string, unknown>;
  requiresApproval: boolean;
  status: 'preview' | 'applied' | 'rejected' | 'failed';
  createdAt: string;
  appliedAt?: string | null;
}

export interface WorldExperienceVersion {
  id: string;
  worldId: string;
  versionNumber: number;
  configuration: Record<string, unknown>;
  reason: string;
  createdAt: string;
  createdBy: string;
}
