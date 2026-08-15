import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  BookOpen,
  Brain,
  Activity,
  SlidersHorizontal,
  Home,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { WorldExperience, WorldNavigationItem } from '../../../types/experience';
import { cn } from '../../../lib/utils';

export interface WorldNavigationProps {
  worldId: string;
  experience: WorldExperience;
  isMobile?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  BookOpen,
  Brain,
  Activity,
  SlidersHorizontal,
  Home,
  GraduationCap,
  Sparkles,
};

export const WorldNavigation: React.FC<WorldNavigationProps> = ({
  worldId,
  experience,
  isMobile = false,
}) => {
  const items = [...(experience.navigation || [])]
    .filter((item) => item.visible !== false)
    .sort((a, b) => a.order - b.order);

  const getLabelWithTerminology = (item: WorldNavigationItem) => {
    const terms = experience.terminology;
    if (item.id === 'people') return terms.peopleLabel || item.label;
    if (item.id === 'goals') return terms.goalsLabel || item.label;
    if (item.id === 'tasks') return terms.tasksLabel || item.label;
    if (item.id === 'projects') return terms.projectsLabel || item.label;
    if (item.id === 'knowledge') return terms.knowledgeLabel || item.label;
    if (item.id === 'activity') return terms.activityLabel || item.label;
    return item.label;
  };

  if (isMobile) {
    return (
      <nav className="h-16 border-t border-white/[0.08] bg-[#0C0E1A]/95 backdrop-blur-md px-2 flex items-center justify-around shrink-0 font-sans z-30">
        {items.slice(0, 5).map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const label = getLabelWithTerminology(item);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === `/world/${worldId}`}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all min-w-[54px]',
                  isActive
                    ? 'text-purple-300 bg-purple-600/20'
                    : 'text-text-muted hover:text-white',
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[64px]">{label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="w-60 border-r border-white/[0.08] bg-[#0A0B16]/95 backdrop-blur-md p-4 flex flex-col justify-between shrink-0 font-sans z-20">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
          Navigation
        </div>

        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const label = getLabelWithTerminology(item);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === `/world/${worldId}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/30 shadow-purple-glow'
                    : 'text-text-secondary hover:text-white hover:bg-white/[0.04] border border-transparent',
                )
              }
            >
              <Icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-text-muted space-y-1">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Living Environment</span>
        </div>
        <p className="text-[10px] text-text-muted">
          Theme: <span className="capitalize font-semibold text-purple-300">{experience.theme.preset}</span>
        </p>
      </div>
    </aside>
  );
};
