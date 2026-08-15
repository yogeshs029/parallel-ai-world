export type ThemeMode = 'dark' | 'light' | 'system';

class ThemeService {
  private currentMode: ThemeMode = 'dark';
  private listeners: Set<(mode: ThemeMode, isDark: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('parallel_theme') as ThemeMode | null;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        this.currentMode = saved;
      } else {
        this.currentMode = 'dark';
      }
    } catch {
      this.currentMode = 'dark';
    }
    this.apply();

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.currentMode === 'system') {
          this.apply();
        }
      });
    }
  }

  public getTheme(): ThemeMode {
    return this.currentMode;
  }

  public isDark(): boolean {
    if (this.currentMode === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return this.currentMode === 'dark';
  }

  public setTheme(mode: ThemeMode) {
    this.currentMode = mode;
    try {
      localStorage.setItem('parallel_theme', mode);
    } catch {}
    this.apply();
  }

  public toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }

  private apply() {
    if (typeof document === 'undefined') return;
    const isDark = this.isDark();
    const root = document.documentElement;

    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    this.listeners.forEach((listener) => listener(this.currentMode, isDark));
    window.dispatchEvent(new CustomEvent('parallel:theme-change', { detail: { mode: this.currentMode, isDark } }));
  }

  public subscribe(callback: (mode: ThemeMode, isDark: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentMode, this.isDark());
    return () => this.listeners.delete(callback);
  }
}

export const themeService = new ThemeService();
