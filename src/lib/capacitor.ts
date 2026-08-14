export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return typeof win.Capacitor?.isNativePlatform === 'function'
    ? win.Capacitor.isNativePlatform()
    : false;
}

export function getCapacitorPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const win = window as unknown as { Capacitor?: { getPlatform?: () => string } };
  if (typeof win.Capacitor?.getPlatform === 'function') {
    const p = win.Capacitor.getPlatform();
    if (p === 'ios' || p === 'android') return p;
  }
  return 'web';
}
