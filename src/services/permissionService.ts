import { PersonPermissions } from '../types/runtime';
import { API_BASE } from '../lib/apiConfig';

const LOCAL_STORAGE_KEY = 'parallel_ai_permissions_v1';

function getDefaultPermissions(worldId: string, personId: string): PersonPermissions {
  return {
    personId,
    worldId,
    worldView: true,
    worldEdit: false,
    peopleView: true,
    peopleCreate: false,
    peopleEdit: false,
    taskCreate: true,
    taskEdit: true,
    knowledgeView: true,
    knowledgeCreate: true,
    knowledgeEdit: false,
    projectCreate: true,
    projectEdit: false,
    messageUser: true,
    updatedAt: new Date().toISOString(),
  };
}

export const permissionService = {
  async getPermissions(worldId: string, personId: string): Promise<PersonPermissions> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/permissions`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend permission API offline, using local store:', e);
    }

    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}:${worldId}:${personId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading permissions from localStorage:', e);
    }

    return getDefaultPermissions(worldId, personId);
  },

  async updatePermissions(
    worldId: string,
    personId: string,
    updates: Partial<PersonPermissions>,
  ): Promise<PersonPermissions> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend permission API offline, saving locally:', e);
    }

    const current = await this.getPermissions(worldId, personId);
    const updated: PersonPermissions = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}:${worldId}:${personId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving permissions to localStorage:', e);
    }
    return updated;
  },
};
