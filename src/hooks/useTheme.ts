import { useState, useEffect } from 'react';
import { themeService, ThemeMode } from '../services/themeService';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(themeService.getTheme());
  const [isDark, setIsDark] = useState<boolean>(themeService.isDark());

  useEffect(() => {
    return themeService.subscribe((newMode, isDarkMode) => {
      setMode(newMode);
      setIsDark(isDarkMode);
    });
  }, []);

  return {
    theme: mode,
    isDark,
    setTheme: (newMode: ThemeMode) => themeService.setTheme(newMode),
    toggleTheme: () => themeService.toggleTheme(),
  };
}
