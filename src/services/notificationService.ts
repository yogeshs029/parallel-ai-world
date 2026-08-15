import { Notification } from '../types/runtime';
import { API_BASE } from '../lib/apiConfig';

const LOCAL_STORAGE_KEY = 'parallel_ai_notifications_v1';

function getLocalStore(): Notification[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read notifications from localStorage:', e);
  }
  return [];
}

function saveLocalStore(items: Notification[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save notifications to localStorage:', e);
  }
}

export const notificationService = {
  async getNotifications(options?: { unreadOnly?: boolean }): Promise<Notification[]> {
    try {
      let url = `${API_BASE}/notifications`;
      if (options?.unreadOnly) url += '?unread_only=true';
      const res = await fetch(url);
      if (res.ok) {
        const data: Notification[] = await res.json();
        saveLocalStore(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend notification API offline, using local repository:', e);
    }

    const store = getLocalStore();
    return options?.unreadOnly ? store.filter((n) => !n.read) : store;
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`);
      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
    } catch (e) {
      console.warn('Backend unread count API offline:', e);
    }

    const store = getLocalStore();
    return store.filter((n) => !n.read).length;
  },

  async markRead(notificationId: string): Promise<Notification | null> {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend markRead API offline:', e);
    }

    const store = getLocalStore();
    const item = store.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      saveLocalStore(store);
      return item;
    }
    return null;
  },

  async markAllRead(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
    } catch (e) {
      console.warn('Backend markAllRead API offline:', e);
    }

    const store = getLocalStore();
    let count = 0;
    store.forEach((n) => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });
    saveLocalStore(store);
    return count;
  },

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn('Backend delete notification API offline:', e);
    }

    const store = getLocalStore();
    const next = store.filter((n) => n.id !== notificationId);
    saveLocalStore(next);
    return true;
  },
};
