import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Globe, Users, Activity, Settings, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { siteConfig } from '../../config/site';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCreateWorldClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onCreateWorldClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':     return <Home className="w-4 h-4 shrink-0" />;
      case 'Globe':    return <Globe className="w-4 h-4 shrink-0" />;
      case 'Users':    return <Users className="w-4 h-4 shrink-0" />;
      case 'Activity': return <Activity className="w-4 h-4 shrink-0" />;
      case 'Settings': return <Settings className="w-4 h-4 shrink-0" />;
      default:         return <Home className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 cosmos-surface transition-all duration-300 ease-in-out select-none',
        isCollapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        'h-[60px] flex items-center justify-between px-4 border-b border-border',
        isCollapsed && 'justify-center px-3',
      )}>
        <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden min-w-0">
          {/* Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c9bf7] to-[#7c4af7] flex items-center justify-center shrink-0 shadow-cosmos-glow-sm">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-text-primary tracking-tight truncate">Parallel</span>
              <span className="text-[10px] text-text-muted truncate">Your worlds & people</span>
            </div>
          )}
        </NavLink>

        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="cosmos-btn-icon w-7 h-7 shrink-0"
            title="Collapse"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Create World Button */}
      {onCreateWorldClick && (
        <div className={cn('px-3 pt-3', isCollapsed && 'flex justify-center')}>
          {isCollapsed ? (
            <button
              onClick={onCreateWorldClick}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c9bf7] to-[#7c4af7] flex items-center justify-center shadow-cosmos-glow-sm hover:opacity-90 transition-opacity active:scale-95"
              title="Create a World"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={onCreateWorldClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#4a6cf7] to-[#7c4af7] text-white text-xs font-semibold shadow-cosmos-glow-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              Create a World
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {siteConfig.mainNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'cosmos-nav-item',
                isActive && 'active',
                isCollapsed && 'justify-center px-2',
              )
            }
            title={isCollapsed ? item.title : undefined}
          >
            {getIcon(item.iconName)}
            {!isCollapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('p-3 border-t border-border', isCollapsed && 'flex justify-center')}>
        {isCollapsed ? (
          <button
            onClick={onToggle}
            className="cosmos-btn-icon w-8 h-8"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
              Worlds active
            </div>
            <span className="text-[10px] text-text-dim">v0.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};
