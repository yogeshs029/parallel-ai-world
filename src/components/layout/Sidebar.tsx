import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Globe,
  Users,
  Target,
  CheckSquare,
  MessageSquare,
  Activity,
  Calendar,
  BookOpen,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { siteConfig } from '../../config/site';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCreateWorldClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onCreateWorldClick }) => {
  const getIcon = (iconName: string) => {
    const cls = 'w-4 h-4 shrink-0 transition-transform duration-200';
    switch (iconName) {
      case 'Home':          return <Home className={cls} />;
      case 'Globe':         return <Globe className={cls} />;
      case 'Users':         return <Users className={cls} />;
      case 'Target':        return <Target className={cls} />;
      case 'CheckSquare':   return <CheckSquare className={cls} />;
      case 'MessageSquare': return <MessageSquare className={cls} />;
      case 'Activity':      return <Activity className={cls} />;
      case 'Calendar':      return <Calendar className={cls} />;
      case 'BookOpen':      return <BookOpen className={cls} />;
      case 'Brain':         return <Brain className={cls} />;
      case 'Settings':      return <Settings className={cls} />;
      default:              return <Home className={cls} />;
    }
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-[#0D0E1A]/95 backdrop-blur-xl border-r border-white/[0.08] transition-all duration-300 ease-in-out select-none shadow-2xl shadow-black/50',
        isCollapsed ? 'w-[74px]' : 'w-64',
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'h-[64px] flex items-center justify-between px-4 border-b border-white/[0.06]',
          isCollapsed && 'justify-center px-3',
        )}
      >
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden min-w-0 group">
          {/* Planet Logo Icon */}
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-700 via-violet-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-purple-glow group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5 text-white animate-spin-slow" />
            <div className="absolute inset-0 rounded-2xl border border-white/30" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base text-white tracking-tight truncate font-sans">
                Parallel
              </span>
              <span className="text-[10px] font-semibold text-purple-400 tracking-wider uppercase truncate">
                AI World
              </span>
            </div>
          )}
        </NavLink>

        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Create World Button */}
      {onCreateWorldClick && (
        <div className={cn('px-3 pt-4 pb-2', isCollapsed && 'flex justify-center')}>
          {isCollapsed ? (
            <button
              onClick={onCreateWorldClick}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-purple-glow hover:scale-105 active:scale-95 transition-all cursor-pointer border border-purple-400/30"
              title="Create a World"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onCreateWorldClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white text-xs font-bold shadow-purple-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border border-purple-400/30"
            >
              <Plus className="w-4 h-4" />
              Create New World
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2.5 space-y-1 overflow-y-auto custom-scrollbar">
        {siteConfig.mainNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white shadow-md shadow-purple-950/50 border border-purple-500/30'
                  : 'text-text-secondary hover:text-white hover:bg-white/[0.06]',
                isCollapsed && 'justify-center px-2.5',
              )
            }
            title={isCollapsed ? item.title : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={cn('transition-colors', isActive ? 'text-white' : 'text-text-muted')}>
                  {getIcon(item.iconName)}
                </span>
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Parallel AI Pro Plan Card (matching Image 2 & 3) */}
      {!isCollapsed && (
        <div className="mx-3 my-2 p-3.5 rounded-2xl bg-gradient-to-b from-[#16182E] to-[#111224] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Parallel AI Pro</span>
            </div>
            <span className="text-[10px] font-mono text-purple-300">Active</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-text-muted mb-1.5 font-medium">
            <span>Plan usage</span>
            <span className="text-white font-bold">78%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.1] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-[78%]" />
          </div>
          <button className="w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-purple-600/30 border border-purple-500/20 text-white text-[11px] font-semibold transition-all cursor-pointer">
            Upgrade Plan
          </button>
        </div>
      )}

      {/* User Profile Widget (matching Image 2 & 3) */}
      <div className={cn('p-3 border-t border-white/[0.06]', isCollapsed && 'flex justify-center')}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/20">
                Y
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0D0E1A] rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">Yogesh</span>
                <span className="text-[10px] text-text-muted truncate">Owner</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
