import { RuntimeStatus } from '../types/runtime';
import { API_BASE } from '../lib/apiConfig';

type EventCallback = (data: Record<string, unknown>) => void;

class RealtimeRuntimeService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;

  public connect() {
    if (this.eventSource || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.eventSource = new EventSource(`${API_BASE}/runtime/stream`);

      this.eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('notification', data);
          window.dispatchEvent(new CustomEvent('parallel:notification', { detail: data }));
        } catch (e) {
          console.warn('Error parsing notification SSE:', e);
        }
      });

      this.eventSource.addEventListener('task_completed', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('task_completed', data);
          window.dispatchEvent(new CustomEvent('parallel:task_completed', { detail: data }));
        } catch (e) {
          console.warn('Error parsing task_completed SSE:', e);
        }
      });

      this.eventSource.addEventListener('approval_requested', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('approval_requested', data);
          window.dispatchEvent(new CustomEvent('parallel:approval_requested', { detail: data }));
        } catch (e) {
          console.warn('Error parsing approval_requested SSE:', e);
        }
      });

      this.eventSource.onopen = () => {
        this.isConnecting = false;
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        // Clean retry
        this.disconnect();
        setTimeout(() => this.connect(), 5000);
      };
    } catch (err) {
      console.warn('Could not establish SSE runtime stream:', err);
      this.isConnecting = false;
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  private emit(event: string, data: Record<string, unknown>) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(data));
    }
  }

  public async getStatus(): Promise<RuntimeStatus | null> {
    try {
      const res = await fetch(`${API_BASE}/runtime/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch runtime diagnostic status:', e);
    }
    return null;
  }
}

export const runtimeService = new RealtimeRuntimeService();
