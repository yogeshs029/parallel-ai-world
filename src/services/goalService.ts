import { Goal, GoalStatus } from '../types/goal';
import { Plan } from '../types/plan';
import { API_BASE } from '../lib/apiConfig';

const GOAL_STORAGE_KEY = 'parallel_ai_goals_v1';
const PLAN_STORAGE_KEY = 'parallel_ai_plans_v1';

function getStoredGoals(worldId: string): Goal[] {
  try {
    const raw = localStorage.getItem(`${GOAL_STORAGE_KEY}:${worldId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading goals from localStorage:', e);
  }
  return [];
}

function saveStoredGoals(worldId: string, list: Goal[]): void {
  try {
    localStorage.setItem(`${GOAL_STORAGE_KEY}:${worldId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving goals to localStorage:', e);
  }
}

function getStoredPlan(goalId: string): Plan | null {
  try {
    const raw = localStorage.getItem(`${PLAN_STORAGE_KEY}:${goalId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading plan from localStorage:', e);
  }
  return null;
}

export function saveStoredPlan(goalId: string, plan: Plan): void {
  try {
    localStorage.setItem(`${PLAN_STORAGE_KEY}:${goalId}`, JSON.stringify(plan));
  } catch (e) {
    console.warn('Error saving plan to localStorage:', e);
  }
}

export const goalService = {
  async getGoals(worldId: string): Promise<Goal[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/goals`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend goals API offline, reading local store:', e);
    }
    return getStoredGoals(worldId);
  },

  async getGoalById(worldId: string, goalId: string): Promise<Goal | null> {
    const goals = await this.getGoals(worldId);
    return goals.find((g) => g.id === goalId) || null;
  },

  async getPlanForGoal(worldId: string, goalId: string): Promise<Plan | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/goals/${goalId}/plan`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend plan API offline, reading local store:', e);
    }
    return getStoredPlan(goalId);
  },

  async createGoal(worldId: string, data: Partial<Goal>): Promise<Goal> {
    const newGoal: Goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      worldId,
      ownerPersonId: data.ownerPersonId || 'unassigned',
      ownerPersonName: data.ownerPersonName,
      ownerPersonEmoji: data.ownerPersonEmoji,
      createdBy: data.createdBy || 'user',
      title: data.title || 'New Goal',
      description: data.description || '',
      type: data.type || 'Project',
      status: data.status || 'draft',
      priority: data.priority || 'normal',
      progress: 0,
      targetDate: data.targetDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: data.metadata || {},
    };

    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend goal creation API offline, saving locally:', e);
    }

    const current = getStoredGoals(worldId);
    const updated = [newGoal, ...current];
    saveStoredGoals(worldId, updated);
    return newGoal;
  },

  async updateGoal(worldId: string, goalId: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend updateGoal API offline, updating locally:', e);
    }

    const current = getStoredGoals(worldId);
    let updatedItem: Goal | null = null;
    const list = current.map((g) => {
      if (g.id === goalId) {
        updatedItem = {
          ...g,
          ...updates,
          updatedAt: new Date().toISOString(),
          completedAt: updates.status === 'completed' ? new Date().toISOString() : g.completedAt,
        };
        return updatedItem;
      }
      return g;
    });

    if (updatedItem) {
      saveStoredGoals(worldId, list);
      return updatedItem;
    }
    throw new Error('Goal not found');
  },

  async recalculateGoalProgress(worldId: string, goalId: string): Promise<number> {
    const plan = await this.getPlanForGoal(worldId, goalId);
    if (!plan || !plan.steps || plan.steps.length === 0) return 0;

    const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
    const progress = Math.round((completedSteps / plan.steps.length) * 100);

    const goalStatus: GoalStatus =
      progress === 100 ? 'completed' : plan.steps.some((s) => s.status === 'blocked' || s.status === 'failed') ? 'blocked' : 'active';

    await this.updateGoal(worldId, goalId, { progress, status: goalStatus });
    return progress;
  },
};
