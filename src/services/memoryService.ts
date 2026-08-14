import { Memory, CreateMemoryInput, UpdateMemoryInput, SearchMemoryQuery } from '../types/memory';
import { API_BASE } from '../lib/apiConfig';

const LOCAL_STORAGE_KEY = 'parallel_ai_memories_v2';

const INITIAL_FALLBACK_MEMORIES: Memory[] = [
  {
    id: 'mem-comp-1',
    worldId: 'world-company',
    personId: null,
    scope: 'world',
    type: 'knowledge',
    title: 'Business Core',
    content: 'The company crafts and sells sustainably-sourced, handcrafted solid hardwood furniture.',
    importance: 'high',
    confidence: 1.0,
    source: 'manual',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-comp-2',
    worldId: 'world-company',
    personId: null,
    scope: 'world',
    type: 'fact',
    title: 'Quality Warranty',
    content: 'All handcrafted dining tables and furniture include a lifetime structural warranty.',
    importance: 'medium',
    confidence: 1.0,
    source: 'manual',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-maya-1',
    worldId: 'world-company',
    personId: 'person-maya',
    scope: 'person',
    type: 'responsibility',
    title: 'Primary Technical Focus',
    content: 'Maya is responsible for building the company website, Stripe checkout, and inventory tools.',
    importance: 'critical',
    confidence: 1.0,
    source: 'manual',
    isActive: true,
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-maya-2',
    worldId: 'world-company',
    personId: 'person-maya',
    scope: 'person',
    type: 'preference',
    title: 'Engineering Standards',
    content: 'Maya prefers clean, modular React and TypeScript architecture with fast load times.',
    importance: 'high',
    confidence: 1.0,
    source: 'manual',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalStore(): Memory[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read memories from localStorage:', e);
  }
  return [...INITIAL_FALLBACK_MEMORIES];
}

function saveLocalStore(memories: Memory[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memories));
  } catch (e) {
    console.warn('Could not save memories to localStorage:', e);
  }
}

export const memoryService = {
  async getMemories(
    worldId: string,
    options?: { personId?: string; scope?: string },
  ): Promise<Memory[]> {
    try {
      let url = `${API_BASE}/worlds/${worldId}/memories`;
      const params = new URLSearchParams();
      if (options?.personId) params.append('person_id', options.personId);
      if (options?.scope) params.append('scope', options.scope);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data: Memory[] = await res.json();
        // Sync local cache
        saveLocalStore(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend memory API offline, using local repository:', e);
    }

    // Local fallback
    const store = getLocalStore();
    return store.filter((m) => {
      if (m.worldId !== worldId || !m.isActive) return false;
      if (options?.scope && m.scope !== options.scope) return false;
      if (options?.personId && m.scope === 'person' && m.personId !== options.personId) return false;
      return true;
    });
  },

  async getPersonMemories(worldId: string, personId: string): Promise<Memory[]> {
    return this.getMemories(worldId, { personId, scope: 'person' });
  },

  async getWorldMemories(worldId: string): Promise<Memory[]> {
    return this.getMemories(worldId, { scope: 'world' });
  },

  async createMemory(worldId: string, input: CreateMemoryInput): Promise<Memory> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, worldId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, creating memory locally:', e);
    }

    // Local fallback
    const store = getLocalStore();
    const newMemory: Memory = {
      id: `mem-${Date.now()}`,
      worldId,
      personId: input.scope === 'person' ? input.personId || null : null,
      scope: input.scope || 'world',
      type: input.type || 'fact',
      title: input.title || input.content.slice(0, 30),
      content: input.content.trim(),
      importance: input.importance || 'medium',
      confidence: input.confidence ?? 1.0,
      source: input.source || 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: input.metadata,
    };
    saveLocalStore([newMemory, ...store]);
    return newMemory;
  },

  async updateMemory(worldId: string, memoryId: string, input: UpdateMemoryInput): Promise<Memory | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/memories/${memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, updating memory locally:', e);
    }

    // Local fallback
    const store = getLocalStore();
    const idx = store.findIndex((m) => m.id === memoryId);
    if (idx === -1) return null;

    const updated: Memory = {
      ...store[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    saveLocalStore(store);
    return updated;
  },

  async deleteMemory(worldId: string, memoryId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/memories/${memoryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Backend offline, deleting memory locally:', e);
    }

    // Local fallback
    const store = getLocalStore();
    const next = store.filter((m) => m.id !== memoryId);
    saveLocalStore(next);
    return true;
  },

  async searchMemories(worldId: string, query: SearchMemoryQuery, personId?: string): Promise<Memory[]> {
    try {
      let url = `${API_BASE}/worlds/${worldId}/memories/search`;
      if (personId) url += `?person_id=${personId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, searching memory locally:', e);
    }

    // Local fallback
    const q = query.query.toLowerCase().trim();
    const store = getLocalStore();
    return store.filter((m) => {
      if (m.worldId !== worldId || !m.isActive) return false;
      if (query.scope && m.scope !== query.scope) return false;
      if (query.type && m.type !== query.type) return false;
      return (
        m.content.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        m.type.toLowerCase().includes(q)
      );
    });
  },

  async clearPersonMemories(worldId: string, personId: string): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/memories/clear`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        return data.clearedCount || 0;
      }
    } catch (e) {
      console.warn('Backend offline, clearing person memory locally:', e);
    }

    const store = getLocalStore();
    const remaining = store.filter((m) => !(m.worldId === worldId && m.personId === personId));
    saveLocalStore(remaining);
    return store.length - remaining.length;
  },

  async clearWorldMemories(worldId: string): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/memories/clear`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        return data.clearedCount || 0;
      }
    } catch (e) {
      console.warn('Backend offline, clearing world memory locally:', e);
    }

    const store = getLocalStore();
    const remaining = store.filter((m) => !(m.worldId === worldId && m.scope === 'world'));
    saveLocalStore(remaining);
    return store.length - remaining.length;
  },
};
