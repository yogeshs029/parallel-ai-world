import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  Plus,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { worldService } from '../../services/worldService';
import { notificationService } from '../../services/notificationService';
import { runtimeService } from '../../services/runtimeService';
import { World } from '../../types';

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

    // Initialize real-time SSE stream
    runtimeService.connect();

    const handleUpdate = () => {
      notificationService.getUnreadCount().then(setUnreadCount);
    };

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
    <header className="sticky top-0 z-20 h-16 bg-background-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 flex items-center justify-between font-sans">
      {/* Mobile Brand (Shown only on small screens) */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-purple flex items-center justify-center font-bold text-white text-sm">
            P
          </div>
          <span className="font-extrabold text-sm tracking-tight font-sans text-text-primary">
            PARALLEL
          </span>
        </Link>
      </div>

      {/* Desktop Search / Quick Jump */}
      <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-background-elevated/70 border border-border hover:border-brand-purple/40 rounded-xl text-xs text-text-muted hover:text-text-secondary transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-purple transition-colors" />
            <span className="font-sans">Search worlds, people, tasks...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-background-deep border border-border rounded-md text-text-dim">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        {/* Quick World Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              worldService.getRecentWorlds(5).then(setRecentWorlds);
              setIsWorldMenuOpen(!isWorldMenuOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-background-elevated hover:bg-background-hover border border-border hover:border-brand-purple/40 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-all font-sans cursor-pointer"
          >
            <span>My Worlds</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {isWorldMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsWorldMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-background-surface border border-border rounded-2xl shadow-xl p-2 z-50 animate-slide-down">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-text-dim border-b border-border flex justify-between items-center">
                  <span>Switch World</span>
                  <Link
                    to="/worlds"
                    onClick={() => setIsWorldMenuOpen(false)}
                    className="text-brand-purple-light hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="py-1 space-y-1">
                  {recentWorlds.map((w) => {
                    const icon = w.icon || w.emoji || '✨';
                    const peopleCount = w.memberCount ?? w.peopleCount ?? 0;
                    const activeTasksCount = w.activeTaskCount ?? w.activeTasksCount ?? 0;

                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setIsWorldMenuOpen(false);
                          navigate(`/world/${w.id}`);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-elevated text-left transition-colors group cursor-pointer"
                      >
                        <span className="text-base">{icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-text-primary group-hover:text-brand-purple-light truncate">
                            {w.name}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            {peopleCount} people • {activeTasksCount} tasks
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {onCreateWorldClick && (
                  <div className="pt-1 border-t border-border mt-1">
                    <button
                      onClick={() => {
                        setIsWorldMenuOpen(false);
                        onCreateWorldClick();
                      }}
                      className="w-full text-center py-1.5 text-xs text-brand-purple-light hover:text-white hover:bg-brand-purple/20 rounded-xl font-medium transition-colors cursor-pointer"
                    >
                      + Create a World
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Global Notification Bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl bg-background-elevated hover:bg-background-hover border border-border hover:border-brand-purple/40 text-text-secondary hover:text-text-primary transition-all flex items-center justify-center cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-purple text-white text-[10px] font-bold flex items-center justify-center border-2 border-background-surface shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Primary CTA Shortcut */}
        {onCreateWorldClick && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={onCreateWorldClick}
            className="hidden sm:inline-flex"
          >
            Create World
          </Button>
        )}

        {/* User Profile */}
        <Link to="/settings" className="flex items-center gap-2 pl-1 group">
          <Avatar name="Alex" isUser size="sm" status="working" />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-text-primary group-hover:text-brand-purple-light transition-colors">
              You
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
