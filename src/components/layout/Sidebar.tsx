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
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out select-none shadow-sm shadow-slate-200/50',
        isCollapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        'h-[60px] flex items-center justify-between px-4 border-b border-slate-100',
        isCollapsed && 'justify-center px-3',
      )}>
        <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#007aff] flex items-center justify-center shrink-0 shadow-md shadow-[#007aff]/20">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 tracking-tight truncate">Parallel</span>
              <span className="text-[10px] text-slate-400 truncate">Your worlds & people</span>
            </div>
          )}
        </NavLink>

        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
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
              className="w-10 h-10 rounded-xl bg-[#007aff] flex items-center justify-center shadow-md shadow-[#007aff]/20 hover:bg-[#0066d6] transition-colors active:scale-95 cursor-pointer"
              title="Create a World"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={onCreateWorldClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#007aff] text-white text-xs font-semibold shadow-md shadow-[#007aff]/20 hover:bg-[#0066d6] transition-colors active:scale-[0.97] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create a World
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {siteConfig.mainNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#007aff]/10 text-[#007aff]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                isCollapsed && 'justify-center px-2',
              )
            }
            title={isCollapsed ? item.title : undefined}
          >
            {getIcon(item.iconName)}
            {!isCollapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapsed expand button */}
      {isCollapsed && (
        <div className="p-3 border-t border-slate-100 flex justify-center">
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
