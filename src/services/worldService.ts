import { World, WorldType, CreateWorldInput, UpdateWorldInput, UserStats } from '../types';
import { API_BASE } from '../lib/apiConfig';

const STORAGE_KEY = 'parallel_ai_worlds_v2';

const LEGACY_ID_MAP: Record<string, string> = {
  'world-nexus-prime': 'world-company',
  'world-aegis-forge': 'world-company',
  'world-quantum-lab': 'world-study',
  'world-hyperion-sim': 'world-home',
};

const LEGACY_DEMO_IDS = new Set([
  'world-company',
  'world-home',
  'world-study',
  'world-story',
  'world-romance',
  'world-nexus-prime',
  'world-aegis-forge',
  'world-quantum-lab',
  'world-hyperion-sim',
]);

function getStoredWorlds(): World[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((w) => w && w.id && !LEGACY_DEMO_IDS.has(w.id));
        if (filtered.length !== parsed.length) {
          saveStoredWorlds(filtered);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Could not read worlds from localStorage:', e);
  }
  return [];
}

function saveStoredWorlds(worlds: World[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worlds));
  } catch (e) {
    console.warn('Could not write worlds to localStorage:', e);
  }
}

export function deleteAllStoredWorlds(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('parallel_ai_worlds');
    localStorage.removeItem('parallel_worlds');
    localStorage.removeItem('parallel_ai_worlds_v1');
    worldsStore = [];
    statsStore.totalWorlds = 0;
  } catch (e) {
    console.warn('Error clearing worlds:', e);
  }
}

let worldsStore: World[] = getStoredWorlds();
let statsStore: UserStats = {
  totalWorlds: worldsStore.length,
  totalPeople: 0,
  activeTasks: 0,
  completedTasks: 0,
};

const delay = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultEmojiMap: Record<WorldType, string> = {
  home: '🏠',
  family: '👨‍👩‍👧',
  school: '🏫',
  company: '🏢',
  business: '💼',
  study: '📚',
  game: '🎮',
  personal: '👤',
  romantic: '💖',
  dating: '🌹',
  custom: '✨',
};

const defaultGradientMap: Record<WorldType, { accentColor: string; coverGradient: string; badgeText: string }> = {
  home: {
    accentColor: 'amber',
    coverGradient: 'from-amber-600/30 via-orange-600/20 to-transparent',
    badgeText: 'Home',
  },
  family: {
    accentColor: 'rose',
    coverGradient: 'from-rose-600/30 via-pink-600/20 to-transparent',
    badgeText: 'Family',
  },
  school: {
    accentColor: 'blue',
    coverGradient: 'from-blue-600/30 via-indigo-600/20 to-transparent',
    badgeText: 'School',
  },
  company: {
    accentColor: 'indigo',
    coverGradient: 'from-indigo-600/30 via-purple-600/20 to-transparent',
    badgeText: 'Company',
  },
  business: {
    accentColor: 'emerald',
    coverGradient: 'from-emerald-600/30 via-teal-600/20 to-transparent',
    badgeText: 'Business',
  },
  study: {
    accentColor: 'cyan',
    coverGradient: 'from-cyan-600/30 via-blue-600/20 to-transparent',
    badgeText: 'Study',
  },
  game: {
    accentColor: 'purple',
    coverGradient: 'from-purple-600/30 via-pink-600/20 to-transparent',
    badgeText: 'Game',
  },
  personal: {
    accentColor: 'purple',
    coverGradient: 'from-purple-600/30 via-indigo-600/20 to-transparent',
    badgeText: 'Personal',
  },
  romantic: {
    accentColor: 'rose',
    coverGradient: 'from-rose-600/30 via-pink-600/20 to-transparent',
    badgeText: 'Romantic',
  },
  dating: {
    accentColor: 'pink',
    coverGradient: 'from-pink-600/30 via-rose-600/20 to-transparent',
    badgeText: 'Dating',
  },
  custom: {
    accentColor: 'purple',
    coverGradient: 'from-purple-600/30 via-cyan-600/20 to-transparent',
    badgeText: 'Custom',
  },
};

export const worldService = {
  async getAllWorlds(): Promise<World[]> {
    await delay(30);
    return [...worldsStore];
  },

  async getWorldById(id: string): Promise<World | null> {
    await delay(30);
    // Check direct match
    let found = worldsStore.find((w) => w.id === id);
    // Check legacy id map
    if (!found && LEGACY_ID_MAP[id]) {
      const mappedId = LEGACY_ID_MAP[id];
      found = worldsStore.find((w) => w.id === mappedId);
    }
    return found ? { ...found } : null;
  },

  async createWorld(payload: CreateWorldInput): Promise<World> {
    await delay(60);
    const id = `world-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;

    const defTheme = defaultGradientMap[payload.type] || defaultGradientMap.custom;

    const visualIdentity = {
      accentColor: payload.visualIdentity?.accentColor || defTheme.accentColor,
      coverGradient: payload.visualIdentity?.coverGradient || defTheme.coverGradient,
      badgeText: payload.visualIdentity?.badgeText || defTheme.badgeText,
    };

    const icon = payload.icon || defaultEmojiMap[payload.type] || '✨';

    const newWorld: World = {
      id,
      name: payload.name.trim(),
      description: payload.description.trim(),
      type: payload.type,
      category: payload.type,
      icon,
      emoji: icon,
      visualIdentity,
      purpose: payload.purpose?.trim() || payload.description.trim(),
      promptDescription: payload.promptDescription?.trim(),
      memberCount: 0,
      peopleCount: 0,
      activeTaskCount: 0,
      activeTasksCount: 0,
      status: 'active',
      tags: payload.tags || [payload.type.charAt(0).toUpperCase() + payload.type.slice(1)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    worldsStore = [newWorld, ...worldsStore];
    saveStoredWorlds(worldsStore);
    statsStore.totalWorlds = worldsStore.length;
    return { ...newWorld };
  },

  async updateWorld(id: string, payload: UpdateWorldInput): Promise<World | null> {
    await delay(50);
    const index = worldsStore.findIndex((w) => w.id === id);
    if (index === -1) return null;

    const current = worldsStore[index];
    const type = payload.type || current.type;
    const defTheme = defaultGradientMap[type] || defaultGradientMap.custom;

    const updatedWorld: World = {
      ...current,
      name: payload.name ? payload.name.trim() : current.name,
      description: payload.description ? payload.description.trim() : current.description,
      type,
      category: type,
      icon: payload.icon || current.icon,
      emoji: payload.icon || current.emoji,
      visualIdentity: {
        ...current.visualIdentity,
        ...(payload.visualIdentity || {}),
        coverGradient: payload.visualIdentity?.coverGradient || current.visualIdentity.coverGradient || defTheme.coverGradient,
        accentColor: payload.visualIdentity?.accentColor || current.visualIdentity.accentColor || defTheme.accentColor,
      },
      purpose: payload.purpose ? payload.purpose.trim() : current.purpose,
      status: payload.status || current.status,
      tags: payload.tags || current.tags,
      updatedAt: new Date().toISOString(),
    };

    worldsStore[index] = updatedWorld;
    saveStoredWorlds(worldsStore);
    return { ...updatedWorld };
  },

  async deleteWorld(id: string): Promise<boolean> {
    await delay(50);
    const initialLen = worldsStore.length;
    worldsStore = worldsStore.filter((w) => w.id !== id);
    saveStoredWorlds(worldsStore);
    statsStore.totalWorlds = worldsStore.length;

    // 1. Cascade delete People in this world
    try {
      const pRaw = localStorage.getItem('parallel_ai_people_v2');
      if (pRaw) {
        const people = JSON.parse(pRaw);
        if (Array.isArray(people)) {
          const filtered = people.filter((p: any) => p.worldId !== id);
          localStorage.setItem('parallel_ai_people_v2', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error cascading people deletion:', e);
    }

    // 2. Cascade delete Tasks in this world
    try {
      const tRaw = localStorage.getItem('parallel_ai_tasks_v2');
      if (tRaw) {
        const tasks = JSON.parse(tRaw);
        if (Array.isArray(tasks)) {
          const filtered = tasks.filter((t: any) => t.worldId !== id);
          localStorage.setItem('parallel_ai_tasks_v2', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error cascading tasks deletion:', e);
    }

    // 3. Cascade delete Activities in this world
    try {
      const aRaw = localStorage.getItem('parallel_ai_activities_v2');
      if (aRaw) {
        const acts = JSON.parse(aRaw);
        if (Array.isArray(acts)) {
          const filtered = acts.filter((a: any) => a.worldId !== id);
          localStorage.setItem('parallel_ai_activities_v2', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error cascading activities deletion:', e);
    }

    // 4. Cascade delete Memories in this world
    try {
      const mRaw = localStorage.getItem('parallel_ai_memories_v2');
      if (mRaw) {
        const mems = JSON.parse(mRaw);
        if (Array.isArray(mems)) {
          const filtered = mems.filter((m: any) => m.worldId !== id);
          localStorage.setItem('parallel_ai_memories_v2', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error cascading memories deletion:', e);
    }

    // 5. Cascade delete Knowledge in this world
    try {
      const kRaw = localStorage.getItem('parallel_ai_knowledge_v1');
      if (kRaw) {
        const know = JSON.parse(kRaw);
        if (Array.isArray(know)) {
          const filtered = know.filter((k: any) => k.worldId !== id);
          localStorage.setItem('parallel_ai_knowledge_v1', JSON.stringify(filtered));
        }
      }
      localStorage.removeItem(`parallel_ai_knowledge_v1:${id}`);
    } catch (e) {
      console.warn('Error cascading knowledge deletion:', e);
    }

    // 6. Cascade delete Goals, Plans, Relationships, Experience & Versions
    try {
      localStorage.removeItem(`parallel_ai_goals_v1:${id}`);
      localStorage.removeItem(`parallel_ai_plans_v1:${id}`);
      localStorage.removeItem(`parallel_ai_relationships_v1:${id}`);
      localStorage.removeItem(`parallel_world_experience_${id}`);
      localStorage.removeItem(`parallel_world_versions_${id}`);
    } catch (e) {
      console.warn('Error cascading specific world keys:', e);
    }

    // 7. Backend Cascade Call
    try {
      await fetch(`${API_BASE}/worlds/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend world delete API offline, client cascade completed:', e);
    }

    // 8. Dispatch notification event for reactive UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('parallel:world_deleted', { detail: { worldId: id } }));
    }

    return worldsStore.length < initialLen;
  },

  async getRecentWorlds(limit = 4): Promise<World[]> {
    await delay(20);
    return worldsStore.slice(0, limit);
  },

  async getUserStats(): Promise<UserStats> {
    await delay(20);
    return { ...statsStore, totalWorlds: worldsStore.length };
  },
};
