import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { worldService } from '../../services/worldService';
import { notificationService } from '../../services/notificationService';
import { runtimeService } from '../../services/runtimeService';
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
  const navigate = useNavigate();

  useEffect(() => {
    worldService.getRecentWorlds(5).then(setRecentWorlds);
    notificationService.getUnreadCount().then(setUnreadCount);
    runtimeService.connect();

    const handleUpdate = () => notificationService.getUnreadCount().then(setUnreadCount);
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
    <header className="sticky top-0 z-20 h-[60px] bg-white/90 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 flex items-center justify-between gap-3 shadow-sm shadow-black/[0.02]">
      {/* Mobile Logo */}
      <div className="flex items-center gap-2.5 md:hidden shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#007aff] flex items-center justify-center shadow-md shadow-[#007aff]/20">
            <span className="font-bold text-white text-sm">P</span>
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-tight">Parallel</span>
        </Link>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-left cursor-pointer hover:bg-slate-100 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-[#007aff] transition-colors" />
          <span className="text-xs text-slate-400 flex-1">Search worlds, people...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* World Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              worldService.getRecentWorlds(5).then(setRecentWorlds);
              setIsWorldMenuOpen(!isWorldMenuOpen);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
              isWorldMenuOpen
                ? 'bg-[#007aff]/10 border-[#007aff]/30 text-[#007aff]'
                : 'bg-slate-100/80 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100',
            )}
          >
            <span>My Worlds</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', isWorldMenuOpen && 'rotate-180')} />
          </button>

          {isWorldMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsWorldMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200/80 shadow-lg p-2 z-50 animate-fade-up">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center mb-1">
                  <span>Switch World</span>
                  <Link
                    to="/worlds"
                    onClick={() => setIsWorldMenuOpen(false)}
                    className="text-[#007aff] hover:underline font-semibold normal-case text-xs transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="py-0.5 space-y-0.5">
                  {recentWorlds.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400">No recent worlds</div>
                  )}
                  {recentWorlds.map((world) => (
                    <button
                      key={world.id}
                      onClick={() => {
                        setIsWorldMenuOpen(false);
                        navigate(`/world/${world.id}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100/80 transition-colors group cursor-pointer"
                    >
                      <Avatar name={world.name} emoji={world.icon || '🌍'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#007aff]">
                          {world.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate capitalize">{world.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Action: Create World */}
        <button
          onClick={onCreateWorldClick}
          className="cosmos-btn cosmos-btn-primary text-xs px-3 py-1.5 gap-1 rounded-xl shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create World</span>
        </button>

        {/* Notifications */}
        <Link
          to="/activity"
          className="relative w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#007aff] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
