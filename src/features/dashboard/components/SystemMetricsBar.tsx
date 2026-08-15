import React from 'react';
import { Globe, Users, CheckSquare, CheckCircle, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { UserStats } from '../../../types';

export interface SystemMetricsBarProps {
  telemetry?: unknown;
  stats?: UserStats;
}

export const SystemMetricsBar: React.FC<SystemMetricsBarProps> = ({ stats }) => {
  const worldsCount = stats?.totalWorlds ?? 0;
  const peopleCount = stats?.totalPeople ?? 0;
  const activeTasksCount = stats?.activeTasks ?? 0;
  const completedTasksCount = stats?.completedTasks ?? 0;

  const items = [
    {
      label: 'My Worlds',
      value: `${worldsCount}`,
      subtext: worldsCount === 0 ? 'No worlds yet' : `${worldsCount} created`,
      icon: Globe,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15 border-purple-500/30',
    },
    {
      label: 'People & Helpers',
      value: `${peopleCount}`,
      subtext: peopleCount === 0 ? 'No people yet' : `${peopleCount} active`,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15 border-indigo-500/30',
    },
    {
      label: 'Active Tasks',
      value: `${activeTasksCount}`,
      subtext: activeTasksCount === 0 ? 'No tasks running' : `${activeTasksCount} in progress`,
      icon: CheckSquare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15 border-cyan-500/30',
    },
    {
      label: 'Tasks Completed',
      value: `${completedTasksCount}`,
      subtext: completedTasksCount === 0 ? 'None yet' : `${completedTasksCount} finished`,
      icon: CheckCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30',
    },
    {
      label: 'World Health',
      value: worldsCount > 0 ? '100%' : '—',
      subtext: worldsCount > 0 ? 'Operational' : 'Ready to create',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} variant="glass" className="p-4 hover:border-purple-500/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary truncate">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl border ${item.bg} ${item.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-1">
              <span className="text-2xl font-extrabold text-white font-sans tracking-tight">
                {item.value}
              </span>
            </div>
            <p className="text-[11px] font-medium text-text-muted mt-1 truncate">
              {item.subtext}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
