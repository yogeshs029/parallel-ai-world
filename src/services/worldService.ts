import { World, WorldType, CreateWorldInput, UpdateWorldInput, UserStats } from '../types';
import { INITIAL_WORLDS, INITIAL_USER_STATS } from './mockData';

const STORAGE_KEY = 'parallel_ai_worlds_v2';

const LEGACY_ID_MAP: Record<string, string> = {
  'world-nexus-prime': 'world-company',
  'world-aegis-forge': 'world-company',
  'world-quantum-lab': 'world-study',
  'world-hyperion-sim': 'world-home',
};

function getStoredWorlds(): World[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default mock worlds are always present
        const merged = [...parsed];
        for (const initW of INITIAL_WORLDS) {
          if (!merged.some((w) => w.id === initW.id)) {
            merged.push(initW);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Could not read worlds from localStorage:', e);
  }
  return [...INITIAL_WORLDS];
}

function saveStoredWorlds(worlds: World[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worlds));
  } catch (e) {
    console.warn('Could not write worlds to localStorage:', e);
  }
}

let worldsStore: World[] = getStoredWorlds();
let statsStore: UserStats = { ...INITIAL_USER_STATS, totalWorlds: worldsStore.length };

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
    // Check initial worlds fallback
    if (!found) {
      found = INITIAL_WORLDS.find((w) => w.id === id);
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
