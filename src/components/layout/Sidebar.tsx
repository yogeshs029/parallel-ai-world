import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Globe,
  Users,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { siteConfig } from '../../config/site';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCreateWorldClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  onCreateWorldClick,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-4.5 h-4.5 shrink-0" />;
      case 'Globe':
        return <Globe className="w-4.5 h-4.5 shrink-0" />;
      case 'Users':
        return <Users className="w-4.5 h-4.5 shrink-0" />;
      case 'Activity':
        return <Activity className="w-4.5 h-4.5 shrink-0" />;
      case 'Settings':
        return <Settings className="w-4.5 h-4.5 shrink-0" />;
      default:
        return <Home className="w-4.5 h-4.5 shrink-0" />;
    }
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-background-surface border-r border-border transition-all duration-250 ease-in-out select-none',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-600 p-[1px] shadow-sm shrink-0">
            <div className="w-full h-full bg-background-deep rounded-[11px] flex items-center justify-center font-bold text-base text-brand-purple-light">
              P
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight font-sans text-text-primary">
                {siteConfig.name}
              </span>
              <span className="text-[10px] text-text-muted font-sans tracking-normal">
                Your worlds & people
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors',
            isCollapsed && 'hidden',
          )}
          title="Collapse Sidebar"
          aria-label="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action */}
      {!isCollapsed && onCreateWorldClick && (
        <div className="p-4 pb-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-start text-xs font-semibold"
            leftIcon={Plus}
            onClick={onCreateWorldClick}
          >
            Create a World
          </Button>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {siteConfig.mainNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative font-sans',
                isActive
                  ? 'bg-brand-purple/15 text-brand-purple-light font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-elevated',
                isCollapsed && 'justify-center px-2',
              )
            }
            title={isCollapsed ? item.title : undefined}
          >
            {getIcon(item.iconName)}
            {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}
            {!isCollapsed && item.badge && (
              <Badge variant="primary" size="sm">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </div>

      {/* Friendly Footer */}
      <div className="p-4 border-t border-border bg-background-deep/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All worlds active
            </span>
            <span className="text-[10px] text-text-dim">v0.1</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggle}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-background-elevated"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
