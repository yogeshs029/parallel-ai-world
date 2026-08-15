import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Bell, Moon, Sun, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { worldService } from '../../services/worldService';
import { notificationService } from '../../services/notificationService';
import { runtimeService } from '../../services/runtimeService';
import { useTheme } from '../../hooks/useTheme';
import { World } from '../../types';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  onSearchOpen?: () => void;
  onCreateWorldClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchOpen, onCreateWorldClick }) => {
  const [recentWorlds, setRecentWorlds] = useState<World[]>([]);
  const [isWorldMenuOpen, setIsWorldMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    worldService.getRecentWorlds(5).then((w) => setRecentWorlds(w));
    notificationService.getUnreadCount().then((cnt) => setUnreadCount(cnt || 0));
    runtimeService.connect();

    const handleUpdate = () => notificationService.getUnreadCount().then((cnt) => setUnreadCount(cnt || 0));
    window.addEventListener('parallel:notification', handleUpdate);
    window.addEventListener('parallel:task_completed', handleUpdate);
    window.addEventListener('parallel:approval_requested', handleUpdate);
    return () => {
      window.removeEventListener('parallel:notification', handleUpdate);
      window.removeEventListener('parallel:task_completed', handleUpdate);
      window.removeEventListener('parallel:approval_requested', handleUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 h-[64px] bg-[#0D0E1A]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-3 shadow-md shadow-black/40">
      {/* Mobile Brand Logo Header */}
      <div className="flex items-center gap-3 md:hidden shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center shadow-purple-glow">
            <Globe className="w-4.5 h-4.5 text-white animate-spin-slow" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight font-sans">Parallel</span>
        </Link>
      </div>

      {/* Desktop Search Bar (Matching Image 3: "Search worlds, people, tasks... ⌘K") */}
      <div className="hidden md:flex flex-1 max-w-md">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-4 py-2 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-left cursor-pointer hover:bg-white/[0.1] hover:border-purple-500/40 transition-all group shadow-inner"
        >
          <Search className="w-4 h-4 text-text-muted shrink-0 group-hover:text-purple-400 transition-colors" />
          <span className="text-xs text-text-muted flex-1 font-medium">Search worlds, people, tasks...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-white/[0.08] border border-white/[0.12] rounded-lg text-purple-300 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* World Switcher Dropdown */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => {
              worldService.getRecentWorlds(5).then(setRecentWorlds);
              setIsWorldMenuOpen(!isWorldMenuOpen);
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
              isWorldMenuOpen
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                : 'bg-white/[0.06] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.1]',
            )}
          >
            <span>My Worlds</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', isWorldMenuOpen && 'rotate-180')} />
          </button>

          {isWorldMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsWorldMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-[#131525] rounded-2xl border border-white/[0.12] shadow-2xl p-2 z-50 animate-fade-up">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-white/[0.08] flex justify-between items-center mb-1">
                  <span>Switch World</span>
                  <Link
                    to="/worlds"
                    onClick={() => setIsWorldMenuOpen(false)}
                    className="text-purple-400 hover:underline font-semibold normal-case text-xs transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="py-1 space-y-1">
                  {recentWorlds.map((world) => (
                    <button
                      key={world.id}
                      onClick={() => {
                        setIsWorldMenuOpen(false);
                        navigate(`/world/${world.id}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.08] transition-colors group cursor-pointer"
                    >
                      <Avatar name={world.name} emoji={world.icon || '🌍'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate group-hover:text-purple-300">
                          {world.name}
                        </div>
                        <div className="text-[10px] text-text-muted truncate capitalize">{world.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Action: Create World Button (Hidden on small mobile screens to prevent crowding) */}
        <button
          onClick={onCreateWorldClick}
          className="hidden sm:inline-flex cosmos-btn cosmos-btn-primary text-xs px-3.5 py-1.5 gap-1.5 rounded-xl shadow-purple-glow cursor-pointer border border-purple-400/30 items-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="font-bold">Create World</span>
        </button>

        {/* Theme Toggle Button (Sun/Moon toggle between Dark & Light) */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-white transition-colors cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
        </button>

        {/* Notification Bell (Matching Image 3: bell + active badge 4) */}
        <Link
          to="/activity"
          className="relative w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#0D0E1A] shadow-purple-glow">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Avatar Pill (Matching Image 3 top right: Yogesh Owner) */}
        <div className="hidden sm:flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs border border-white/20">
            Y
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">Yogesh</span>
            <span className="text-[10px] text-text-muted leading-none">Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
};
