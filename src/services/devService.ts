import { API_BASE } from '../lib/apiConfig';

const STORAGE_KEYS = [
  'parallel_ai_worlds_v2',
  'parallel_ai_people_v2',
  'parallel_ai_tasks_v2',
  'parallel_ai_activities_v2',
  'parallel_ai_knowledge_notes_v2',
  'parallel_ai_memories_v2',
  'parallel_ai_knowledge_v1',
  'parallel_ai_notifications_v1',
  'parallel_ai_approvals_v1',
  'parallel_ai_chat_messages',
  'parallel_ai_conversations',
  'parallel_ai_world_experiences',
];

export const devService = {
  /**
   * Complete clean reset:
   * 1. Clears all browser localStorage keys for Parallel AI World
   * 2. Calls backend POST /api/dev/reset
   */
  async resetDevDatabase(): Promise<{ success: boolean; message: string }> {
    // 1. Clear LocalStorage
    try {
      STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      // Clear any keys starting with parallel_ai
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('parallel_ai')) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn('LocalStorage cleanup error:', e);
    }

    // 2. Call Backend Reset
    try {
      const res = await fetch(`${API_BASE}/dev/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message || 'Database and stores successfully reset.' };
      } else {
        const err = await res.json().catch(() => ({ detail: 'Backend reset failed' }));
        return { success: false, message: err.detail || 'Backend reset rejected.' };
      }
    } catch (e) {
      console.warn('Backend reset call failed (offline mode):', e);
      return { success: true, message: 'Client database reset. Backend was offline.' };
    }
  },
};
