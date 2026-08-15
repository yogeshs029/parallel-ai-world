import {
  KnowledgeSource,
  CreateNoteInput,
  CreateUrlInput,
  UpdateKnowledgeInput,
  RetrievedKnowledgeChunk,
} from '../types/knowledge';
import { API_BASE } from '../lib/apiConfig';

const LOCAL_STORAGE_KEY = 'parallel_ai_knowledge_v1';

function getLocalStore(): KnowledgeSource[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read knowledge from localStorage:', e);
  }
  return [];
}

function saveLocalStore(sources: KnowledgeSource[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sources));
  } catch (e) {
    console.warn('Could not save knowledge to localStorage:', e);
  }
}

export const knowledgeService = {
  async getKnowledgeList(
    worldId: string,
    options?: { personId?: string; visibility?: string; type?: string },
  ): Promise<KnowledgeSource[]> {
    try {
      let url = `${API_BASE}/worlds/${worldId}/knowledge`;
      const params = new URLSearchParams();
      if (options?.personId) params.append('person_id', options.personId);
      if (options?.visibility) params.append('visibility', options.visibility);
      if (options?.type) params.append('type', options.type);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data: KnowledgeSource[] = await res.json();
        saveLocalStore(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend knowledge API offline, using local repository:', e);
    }

    // Local fallback
    const store = getLocalStore();
    return store.filter((s) => {
      if (s.worldId !== worldId) return false;
      if (options?.visibility && s.visibility !== options.visibility) return false;
      if (options?.type && s.type !== options.type) return false;
      if (options?.personId && s.visibility === 'person' && s.personId !== options.personId) return false;
      return true;
    });
  },

  async getKnowledge(worldId: string, knowledgeId: string): Promise<KnowledgeSource | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/${knowledgeId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, reading local knowledge:', e);
    }

    const store = getLocalStore();
    return store.find((s) => s.id === knowledgeId && s.worldId === worldId) || null;
  },

  async uploadDocument(
    worldId: string,
    file: File,
    options?: { name?: string; description?: string; visibility?: string; personId?: string | null },
  ): Promise<KnowledgeSource> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.name) formData.append('name', options.name);
      if (options?.description) formData.append('description', options.description);
      if (options?.visibility) formData.append('visibility', options.visibility);
      if (options?.personId) formData.append('person_id', options.personId);

      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    } catch (e) {
      console.warn('Upload API error or offline:', e);
      throw e;
    }
  },

  async createNote(worldId: string, input: CreateNoteInput): Promise<KnowledgeSource> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, worldId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, creating note locally:', e);
    }

    // Local fallback
    const store = getLocalStore();
    const newNote: KnowledgeSource = {
      id: `know-${Date.now()}`,
      worldId,
      personId: input.visibility === 'person' ? input.personId || null : null,
      name: input.title.trim(),
      description: input.description || null,
      type: 'note',
      source: `${input.title} Note`,
      status: 'ready',
      size: input.content.length,
      mimeType: 'text/plain',
      visibility: input.visibility || 'world',
      extractedText: input.content.trim(),
      chunkCount: Math.ceil(input.content.length / 500),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore([newNote, ...store]);
    return newNote;
  },

  async createUrl(worldId: string, input: CreateUrlInput): Promise<KnowledgeSource> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, worldId }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json();
      throw new Error(err.detail || 'Could not read web page.');
    } catch (e) {
      console.warn('Backend offline, creating URL reference:', e);
      throw e;
    }
  },

  async updateKnowledge(
    worldId: string,
    knowledgeId: string,
    input: UpdateKnowledgeInput,
  ): Promise<KnowledgeSource | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/${knowledgeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, updating knowledge locally:', e);
    }

    const store = getLocalStore();
    const idx = store.findIndex((s) => s.id === knowledgeId && s.worldId === worldId);
    if (idx === -1) return null;

    const updated: KnowledgeSource = {
      ...store[idx],
      name: input.name ?? store[idx].name,
      description: input.description ?? store[idx].description,
      visibility: input.visibility ?? store[idx].visibility,
      extractedText: input.content ?? store[idx].extractedText,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    saveLocalStore(store);
    return updated;
  },

  async refreshUrl(worldId: string, knowledgeId: string): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/${knowledgeId}/refresh`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Refresh failed');
    }
    return await res.json();
  },

  async deleteKnowledge(worldId: string, knowledgeId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/knowledge/${knowledgeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Backend offline, deleting knowledge locally:', e);
    }

    const store = getLocalStore();
    const next = store.filter((s) => s.id !== knowledgeId);
    saveLocalStore(next);
    return true;
  },

  async searchKnowledge(
    worldId: string,
    query: string,
    personId?: string,
  ): Promise<RetrievedKnowledgeChunk[]> {
    try {
      let url = `${API_BASE}/worlds/${worldId}/knowledge/search`;
      if (personId) url += `?person_id=${personId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 5 }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend offline, searching local knowledge:', e);
    }

    return [];
  },
};
