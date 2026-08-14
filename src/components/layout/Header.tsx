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
    <header className="sticky top-0 z-20 h-[60px] cosmos-surface border-b border-border px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Mobile Logo */}
      <div className="flex items-center gap-2.5 md:hidden shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c9bf7] to-[#7c4af7] flex items-center justify-center shadow-cosmos-glow-sm">
            <span className="font-bold text-white text-sm">P</span>
          </div>
          <span className="font-bold text-sm text-text-primary tracking-tight">Parallel</span>
        </Link>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 cosmos-input text-left cursor-pointer hover:border-border-focus transition-all group"
          style={{ background: 'rgba(15,22,38,0.5)' }}
        >
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0 group-hover:text-[#7c9bf7] transition-colors" />
          <span className="text-xs text-text-dim flex-1">Search worlds, people...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background-deep border border-border rounded text-text-dim">
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
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              isWorldMenuOpen
                ? 'bg-[#7c9bf7]/15 border-[#7c9bf7]/30 text-[#a5bef9]'
                : 'bg-background-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-accent',
            )}
          >
            <span>My Worlds</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', isWorldMenuOpen && 'rotate-180')} />
          </button>

          {isWorldMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsWorldMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 cosmos-card rounded-2xl shadow-cosmos-lg p-2 z-50 animate-fade-up">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-text-dim border-b border-border flex justify-between items-center mb-1">
                  <span>Switch World</span>
                  <Link
                    to="/worlds"
                    onClick={() => setIsWorldMenuOpen(false)}
                    className="text-[#7c9bf7] hover:text-[#a5bef9] font-medium normal-case text-xs transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="py-0.5 space-y-0.5">
                  {recentWorlds.length === 0 && (
                    <p className="text-center text-xs text-text-dim py-3">No worlds yet</p>
                  )}
                  {recentWorlds.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => { setIsWorldMenuOpen(false); navigate(`/world/${w.id}`); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-elevated text-left transition-all cursor-pointer group"
                    >
                      <span className="text-lg shrink-0">{w.icon || w.emoji || '🌍'}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-text-primary group-hover:text-[#a5bef9] truncate transition-colors">
                          {w.name}
                        </div>
                        <div className="text-[10px] text-text-dim">
                          {(w.memberCount ?? w.peopleCount ?? 0)} people
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {onCreateWorldClick && (
                  <div className="pt-1.5 border-t border-border mt-1.5">
                    <button
                      onClick={() => { setIsWorldMenuOpen(false); onCreateWorldClick(); }}
                      className="w-full text-center py-2 text-xs text-[#7c9bf7] hover:bg-[#7c9bf7]/10 rounded-xl font-medium transition-all cursor-pointer"
                    >
                      + Create a World
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="relative w-9 h-9 cosmos-btn-icon flex items-center justify-center rounded-xl"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#7c9bf7] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Create World CTA */}
        {onCreateWorldClick && (
          <button
            onClick={onCreateWorldClick}
            className="hidden sm:flex cosmos-btn cosmos-btn-primary gap-1.5 px-3 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create World</span>
          </button>
        )}

        {/* User Avatar */}
        <Link to="/settings" className="shrink-0">
          <Avatar name="You" isUser size="sm" status="working" />
        </Link>
      </div>
    </header>
  );
};
