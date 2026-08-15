import { ActivityLog, KnowledgeNote } from '../types';

const ACT_KEY = 'parallel_ai_activities_v2';
const KNOW_KEY = 'parallel_ai_knowledge_notes_v2';

function getStoredActivities(): ActivityLog[] {
  try {
    const saved = localStorage.getItem(ACT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function getStoredKnowledge(): KnowledgeNote[] {
  try {
    const saved = localStorage.getItem(KNOW_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

let activitiesStore: ActivityLog[] = getStoredActivities();
let knowledgeStore: KnowledgeNote[] = getStoredKnowledge();
const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

export const activityService = {
  async getAllActivities(limit = 20): Promise<ActivityLog[]> {
    await delay(40);
    return activitiesStore.slice(0, limit);
  },

  async getActivitiesByWorldId(worldId: string): Promise<ActivityLog[]> {
    await delay(40);
    return activitiesStore.filter((a) => a.worldId === worldId);
  },

  async getKnowledgeByWorldId(worldId: string): Promise<KnowledgeNote[]> {
    await delay(40);
    return knowledgeStore.filter((k) => k.worldId === worldId);
  },

  async addKnowledgeNote(payload: {
    worldId: string;
    title: string;
    content: string;
    category: KnowledgeNote['category'];
    authorName: string;
    tags?: string[];
  }): Promise<KnowledgeNote> {
    await delay(100);
    const newNote: KnowledgeNote = {
      id: `note-${Date.now()}`,
      worldId: payload.worldId,
      title: payload.title,
      content: payload.content,
      category: payload.category,
      authorName: payload.authorName,
      tags: payload.tags || ['General'],
      updatedAt: new Date().toISOString(),
    };
    knowledgeStore = [newNote, ...knowledgeStore];
    return newNote;
  },

  async logActivity(payload: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const entry: ActivityLog = {
      ...payload,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    activitiesStore = [entry, ...activitiesStore];
    return entry;
  },

  // Backwards compatibility aliases
  getRecentActivities: (limit = 10) => activityService.getAllActivities(limit),
  getMemoriesByWorldId: (worldId: string) => {
    return activityService.getKnowledgeByWorldId(worldId).then((notes) =>
      notes.map((n) => ({
        id: n.id,
        worldId: n.worldId,
        agentName: n.authorName,
        type: 'semantic' as const,
        content: `${n.title}: ${n.content}`,
        vectorDimensions: 1536,
        relevanceScore: 0.95,
        timestamp: n.updatedAt,
      })),
    );
  },
};
