import { API_BASE } from '../lib/apiConfig';
import {
  WorldExperience,
  WorldExperienceUpdate,
  WorldChangeProposal,
  WorldExperienceVersion,
} from '../types/experience';
import { THEME_PRESETS } from './themeEngine';

const EXP_STORAGE_PREFIX = 'parallel_world_experience_';
const VERSIONS_STORAGE_PREFIX = 'parallel_world_versions_';

export const experienceService = {
  async getExperience(worldId: string): Promise<WorldExperience> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/experience`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${EXP_STORAGE_PREFIX}${worldId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}

    const isHome = worldId.includes('home');
    const isSchool = worldId.includes('school');
    const preset = isHome ? 'warm' : isSchool ? 'modern' : 'professional';

    const defaultExp: WorldExperience = {
      worldId,
      theme: THEME_PRESETS[preset],
      layout: 'standard',
      navigation: [
        { id: 'overview', label: isHome ? 'Home' : 'Dashboard', icon: 'LayoutDashboard', path: `/world/${worldId}`, visible: true, order: 0 },
        { id: 'people', label: isHome ? 'Family' : 'People', icon: 'Users', path: `/world/${worldId}/people`, visible: true, order: 1 },
        { id: 'goals', label: isHome ? 'Plans' : 'Goals & Tasks', icon: 'Target', path: `/world/${worldId}`, visible: true, order: 2 },
        { id: 'knowledge', label: 'Knowledge Base', icon: 'BookOpen', path: `/world/${worldId}/knowledge`, visible: true, order: 3 },
        { id: 'memory', label: 'Memory', icon: 'Brain', path: `/world/${worldId}/memory`, visible: true, order: 4 },
        { id: 'activity', label: 'Activity Log', icon: 'Activity', path: `/world/${worldId}`, visible: true, order: 5 },
      ],
      headerConfig: {
        showLogo: true,
        showSearch: true,
        showMemberAvatars: true,
        showCommandTrigger: true,
      },
      footerConfig: {
        enabled: false,
        showReturnHome: true,
      },
      terminology: {
        peopleLabel: isHome ? 'Family' : 'People',
        personLabel: isHome ? 'Family Member' : 'Person',
        goalsLabel: isHome ? 'Plans' : 'Goals',
        goalLabel: isHome ? 'Plan' : 'Goal',
        tasksLabel: isHome ? 'Things to do' : 'Tasks',
        taskLabel: isHome ? 'Task' : 'Task',
        projectsLabel: 'Projects',
        knowledgeLabel: 'Knowledge',
        activityLabel: 'Activity',
      },
      dashboardBlocks: [
        { id: 'summary', type: 'summary', title: 'World Overview', size: 'full', visible: true, order: 0 },
        { id: 'metrics', type: 'metrics', title: 'Key Metrics', size: 'full', visible: true, order: 1 },
        { id: 'people', type: 'people', title: isHome ? 'Family Members' : 'Team', size: 'medium', visible: true, order: 2 },
        { id: 'goals', type: 'goals', title: isHome ? 'Active Plans' : 'Goals', size: 'medium', visible: true, order: 3 },
        { id: 'activity', type: 'activity', title: 'Recent Activity', size: 'large', visible: true, order: 4 },
      ],
      enabledFeatures: ['people', 'goals', 'tasks', 'knowledge', 'activity', 'tools', 'memory'],
      customizations: {},
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(defaultExp));
    } catch {}

    return defaultExp;
  },

  async updateExperience(
    worldId: string,
    update: WorldExperienceUpdate,
  ): Promise<WorldExperience> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/experience`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const current = await this.getExperience(worldId);
    const updated: WorldExperience = {
      ...current,
      theme: update.theme || current.theme,
      layout: update.layout || current.layout,
      navigation: update.navigation || current.navigation,
      headerConfig: update.headerConfig || current.headerConfig,
      footerConfig: update.footerConfig || current.footerConfig,
      terminology: update.terminology || current.terminology,
      dashboardBlocks: update.dashboardBlocks || current.dashboardBlocks,
      enabledFeatures: update.enabledFeatures || current.enabledFeatures,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    const key = `${EXP_STORAGE_PREFIX}${worldId}`;
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}

    return updated;
  },

  async processCommand(worldId: string, prompt: string): Promise<WorldChangeProposal> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Local client proposal generation fallback
    const pLower = prompt.toLowerCase();
    const isLuxury = pLower.includes('luxury') || pLower.includes('furniture');
    const isWarm = pLower.includes('warm') || pLower.includes('home');
    const isDark = pLower.includes('dark') || pLower.includes('navy');

    const themeKey = isLuxury ? 'luxury' : isWarm ? 'warm' : isDark ? 'dark' : 'modern';

    return {
      id: `prop-${Date.now()}`,
      worldId,
      prompt,
      domain: 'WORLD_EXPERIENCE',
      summary: `Apply ${themeKey.toUpperCase()} theme & customize navigation`,
      changes: {
        theme: THEME_PRESETS[themeKey],
      },
      requiresApproval: false,
      status: 'preview',
      createdAt: new Date().toISOString(),
    };
  },

  async applyProposal(worldId: string, proposalId: string): Promise<WorldChangeProposal> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/commands/${proposalId}/apply`, {
        method: 'POST',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      id: proposalId,
      worldId,
      prompt: 'Applied',
      domain: 'WORLD_EXPERIENCE',
      summary: 'Applied changes',
      changes: {},
      requiresApproval: false,
      status: 'applied',
      createdAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
    };
  },

  async listVersions(worldId: string): Promise<WorldExperienceVersion[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/experience/versions`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${VERSIONS_STORAGE_PREFIX}${worldId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  async undo(worldId: string): Promise<WorldExperience> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/experience/undo`, {
        method: 'POST',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return this.getExperience(worldId);
  },
};
