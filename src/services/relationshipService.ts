import { Relationship } from '../types/relationship';
import { API_BASE } from '../lib/apiConfig';

const LOCAL_STORAGE_KEY = 'parallel_ai_relationships_v1';

function getStoredRelationships(worldId: string): Relationship[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}:${worldId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading relationships from localStorage:', e);
  }
  return [];
}

function saveStoredRelationships(worldId: string, list: Relationship[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}:${worldId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving relationships to localStorage:', e);
  }
}

export const relationshipService = {
  async getRelationships(worldId: string): Promise<Relationship[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/relationships`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend relationship API offline, using local store:', e);
    }
    return getStoredRelationships(worldId);
  },

  async getPersonRelationships(worldId: string, personId: string): Promise<Relationship[]> {
    const all = await this.getRelationships(worldId);
    return all.filter(
      (r) => (r.fromPersonId === personId || r.toPersonId === personId) && r.status !== 'ended',
    );
  },

  async createRelationship(
    worldId: string,
    data: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Relationship> {
    const newRel: Relationship = {
      ...data,
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      worldId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRel),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend relationship API offline, saving locally:', e);
    }

    const current = getStoredRelationships(worldId);
    const updated = [newRel, ...current];
    saveStoredRelationships(worldId, updated);
    return newRel;
  },

  async updateRelationship(
    worldId: string,
    relationshipId: string,
    updates: Partial<Relationship>,
  ): Promise<Relationship> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/relationships/${relationshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend relationship API offline, updating locally:', e);
    }

    const current = getStoredRelationships(worldId);
    let updatedItem: Relationship | null = null;
    const list = current.map((r) => {
      if (r.id === relationshipId) {
        updatedItem = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return r;
    });

    if (updatedItem) {
      saveStoredRelationships(worldId, list);
      return updatedItem;
    }
    throw new Error('Relationship not found');
  },

  async deleteRelationship(worldId: string, relationshipId: string): Promise<void> {
    await this.updateRelationship(worldId, relationshipId, { status: 'ended' });
  },
};
