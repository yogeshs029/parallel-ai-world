import { Task, TaskPriority, TaskStatus } from '../types';
import { RuntimeTask } from '../types/runtime';
import { API_BASE } from '../lib/apiConfig';

const STORAGE_KEY = 'parallel_ai_tasks_v2';

function getStoredTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (t) =>
            t &&
            t.id &&
            !t.id.startsWith('task-comp-') &&
            !t.id.startsWith('task-home-') &&
            !t.worldId?.startsWith('world-company') &&
            !t.worldId?.startsWith('world-home'),
        );
        if (filtered.length !== parsed.length) {
          saveStoredTasks(filtered);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Could not read tasks from localStorage:', e);
  }
  return [];
}

function saveStoredTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Could not save tasks to localStorage:', e);
  }
}

export function deleteAllStoredTasks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('parallel_ai_tasks');
    localStorage.removeItem('parallel_tasks');
    tasksStore = [];
  } catch (e) {
    console.warn('Could not clear tasks:', e);
  }
}

let tasksStore: Task[] = getStoredTasks();

export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    return [...tasksStore];
  },

  async getTasksByWorldId(worldId: string): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/tasks`);
      if (res.ok) {
        const backendTasks: RuntimeTask[] = await res.json();
        if (Array.isArray(backendTasks) && backendTasks.length > 0) {
          const mapped: Task[] = backendTasks.map((bt) => ({
            id: bt.id,
            worldId: bt.worldId,
            title: bt.title,
            description: bt.description || '',
            priority: bt.priority || 'medium',
            status: bt.status === 'completed' ? 'completed' : 'in_progress',
            assignedPersonId: bt.assignedPersonId || undefined,
            assignedPersonName: bt.assignedPersonId === 'person-maya' ? 'Maya' : bt.assignedPersonId === 'person-priya' ? 'Priya' : 'Team',
            assignedPersonEmoji: bt.assignedPersonId === 'person-maya' ? '👩‍💻' : bt.assignedPersonId === 'person-priya' ? '📈' : '👤',
            createdAt: bt.createdAt,
            updatedAt: bt.completedAt || bt.createdAt,
          }));
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Backend task API offline, reading local store:', e);
    }
    return tasksStore.filter((t) => t.worldId === worldId);
  },

  async getActiveTasks(limit = 6): Promise<Task[]> {
    return tasksStore.filter((t) => t.status !== 'completed').slice(0, limit);
  },

  async createTask(payload: {
    worldId: string;
    worldName?: string;
    projectName?: string;
    title: string;
    description: string;
    priority: TaskPriority;
    assignedPersonId?: string;
    assignedPersonName?: string;
    assignedPersonEmoji?: string;
    dueDate?: string;
  }): Promise<Task> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${payload.worldId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId: payload.worldId,
          assignedPersonId: payload.assignedPersonId || null,
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          notifyOnCompletion: true,
        }),
      });
      if (res.ok) {
        const bt: RuntimeTask = await res.json();
        const newTask: Task = {
          id: bt.id,
          worldId: bt.worldId,
          worldName: payload.worldName,
          projectName: payload.projectName || 'General',
          title: bt.title,
          description: bt.description || payload.description,
          priority: bt.priority || payload.priority,
          assignedPersonId: bt.assignedPersonId || undefined,
          assignedPersonName: payload.assignedPersonName,
          assignedPersonEmoji: payload.assignedPersonEmoji || '👤',
          status: 'in_progress',
          dueDate: payload.dueDate || 'Soon',
          createdAt: bt.createdAt,
          updatedAt: bt.createdAt,
        };
        tasksStore = [newTask, ...tasksStore];
        saveStoredTasks(tasksStore);
        return newTask;
      }
    } catch (e) {
      console.warn('Backend task API offline, creating task locally:', e);
    }

    const id = `task-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: Task = {
      id,
      worldId: payload.worldId,
      worldName: payload.worldName,
      projectName: payload.projectName || 'General',
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      assignedPersonId: payload.assignedPersonId,
      assignedPersonName: payload.assignedPersonName,
      assignedPersonEmoji: payload.assignedPersonEmoji || '👤',
      status: 'in_progress',
      dueDate: payload.dueDate || 'Soon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasksStore = [newTask, ...tasksStore];
    saveStoredTasks(tasksStore);
    return newTask;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
    const idx = tasksStore.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasksStore[idx] = {
        ...tasksStore[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      saveStoredTasks(tasksStore);
      return { ...tasksStore[idx] };
    }
    return null;
  },

  getRunningTasks: (limit = 6) => taskService.getActiveTasks(limit),
};
