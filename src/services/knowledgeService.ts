import {
  KnowledgeSource,
  CreateNoteInput,
  CreateUrlInput,
  UpdateKnowledgeInput,
  RetrievedKnowledgeChunk,
} from '../types/knowledge';

const API_BASE = 'http://127.0.0.1:8000/api';
const LOCAL_STORAGE_KEY = 'parallel_ai_knowledge_v1';

const INITIAL_FALLBACK_SOURCES: KnowledgeSource[] = [
  {
    id: 'know-world-1',
    worldId: 'world-company',
    personId: null,
    name: 'Company Handbook',
    description: 'General company policies, benefits, and workplace culture.',
    type: 'document',
    source: 'Company Handbook.pdf',
    status: 'ready',
    size: 245000,
    mimeType: 'application/pdf',
    visibility: 'world',
    extractedText:
      'Welcome to Parallel Furniture Co. We design, manufacture, and deliver sustainable, solid hardwood furniture direct to homeowners.\n\nWorkplace Culture & Benefits:\n- Flexible working hours with remote-friendly collaboration.\n- 25 days of annual paid time off (PTO) plus regional holidays.\n- Comprehensive medical and dental health coverage for employees and dependents.\n- Annual ₹50,000 learning and professional development stipend.\n- All products include a lifetime structural warranty and 30-day in-home return policy.',
    chunkCount: 2,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-world-2',
    worldId: 'world-company',
    personId: null,
    name: 'Product Catalog',
    description: 'Complete 2026 furniture product pricing and specifications.',
    type: 'document',
    source: 'Product Catalog.pdf',
    status: 'ready',
    size: 184000,
    mimeType: 'application/pdf',
    visibility: 'world',
    extractedText:
      'Parallel Furniture Co. - Official 2026 Product Catalog & Pricing Guide\n\n1. Premium Handmade Dining Table\n- Material: Grade-A Sustainable Solid Teakwood\n- Seating: 6 to 8 people\n- Dimensions: 78" L x 38" W x 30" H\n- Price: ₹24,999 (Includes free white-glove home delivery and assembly)\n- Warranty: 10-Year Master Craftsmanship Guarantee\n\n2. Ergonomic Hardwood Study Desk\n- Material: Solid Oak with Walnut stain and matte protective finish\n- Features: Integrated dual cable management tray and soft-close drawer\n- Price: ₹18,499\n\n3. Artisan Handcrafted Coffee Table\n- Material: Reclaimed Rosewood with solid brushed brass joinery\n- Price: ₹11,999',
    chunkCount: 3,
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-world-3',
    worldId: 'world-company',
    personId: null,
    name: 'Company Mission',
    description: 'Core purpose, values, and environmental commitment.',
    type: 'note',
    source: 'Company Mission Note',
    status: 'ready',
    visibility: 'world',
    extractedText:
      'Company Mission & Sustainability Promise:\n\nOur mission is to build affordable, heirloom-quality solid wood furniture that transforms everyday homes into inspiring spaces.\n\nEnvironmental Commitment:\nWe plant two native trees for every single tree harvested in our furniture crafting process.',
    chunkCount: 1,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-maya-1',
    worldId: 'world-company',
    personId: 'person-maya',
    name: 'Developer Guide',
    description: 'Technical architecture, frontend conventions, and deployment workflows.',
    type: 'document',
    source: 'Developer Guide.md',
    status: 'ready',
    size: 45000,
    mimeType: 'text/markdown',
    visibility: 'person',
    extractedText:
      "Maya's Engineering Guide - Frontend Architecture:\n\nThe web application uses React 18 with TypeScript, Vite, and Tailwind CSS.\nAll business logic resides in modular service layers rather than embedded in components.\nState persistence uses strongly typed repository abstractions compatible with backend sync.",
    chunkCount: 1,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-maya-2',
    worldId: 'world-company',
    personId: 'person-maya',
    name: 'Coding Standards',
    description: 'Quality guidelines and engineering rules followed by Maya.',
    type: 'note',
    source: 'Coding Standards Note',
    status: 'ready',
    visibility: 'person',
    extractedText:
      "Frontend Coding Standards:\n1. Strict TypeScript with zero 'any' types allowed.\n2. Accessible HTML5 semantics with descriptive ARIA labels.\n3. Comprehensive unit and visual integration verification before merging.\n4. Sub-second initial render targets with clean bundle splitting.",
    chunkCount: 1,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalStore(): KnowledgeSource[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read knowledge from localStorage:', e);
  }
  return [...INITIAL_FALLBACK_SOURCES];
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
