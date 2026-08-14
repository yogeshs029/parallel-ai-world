export interface AudioQueueItem {
  id: string;
  url: string;
  text?: string;
}

export type PlayStateListener = (isPlaying: boolean, currentText?: string) => void;

class AudioQueuePlayer {
  private queue: AudioQueueItem[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private currentItem: AudioQueueItem | null = null;
  private isProcessing = false;
  private listeners: Set<PlayStateListener> = new Set();

  public subscribe(listener: PlayStateListener): () => void {
    this.listeners.add(listener);
    // Notify immediate state
    listener(this.isPlaying(), this.currentItem?.text);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const active = this.isPlaying();
    const text = this.currentItem?.text;
    this.listeners.forEach((fn) => fn(active, text));
  }

  public enqueue(url: string, text?: string): string {
    const id = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: AudioQueueItem = { id, url, text };
    this.queue.push(item);

    if (!this.isProcessing) {
      this.playNext();
    }
    return id;
  }

  private playNext() {
    if (this.queue.length === 0) {
      this.currentItem = null;
      this.currentAudio = null;
      this.isProcessing = false;
      this.notify();
      return;
    }

    this.isProcessing = true;
    const nextItem = this.queue.shift()!;
    this.currentItem = nextItem;

    try {
      const audio = new Audio(nextItem.url);
      this.currentAudio = audio;

      audio.onplay = () => {
        this.notify();
      };

      audio.onended = () => {
        this.currentAudio = null;
        this.playNext();
      };

      audio.onerror = (e) => {
        console.warn('Audio queue playback error:', e);
        this.currentAudio = null;
        this.playNext();
      };

      audio.play().catch((err) => {
        console.warn('Audio autoplay prevented or interrupted:', err);
        this.currentAudio = null;
        this.playNext();
      });
    } catch (e) {
      console.error('Failed to initialize audio element:', e);
      this.playNext();
    }
  }

  public stop() {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentItem = null;
    this.isProcessing = false;
    this.notify();
  }

  public isPlaying(): boolean {
    return this.isProcessing && this.currentAudio !== null && !this.currentAudio.paused;
  }

  public getCurrentText(): string | undefined {
    return this.currentItem?.text;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const audioQueuePlayer = new AudioQueuePlayer();
