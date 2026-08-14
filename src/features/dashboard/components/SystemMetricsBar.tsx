import React from 'react';
import { Globe, Users, CheckSquare, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { UserStats } from '../../../types';

export interface SystemMetricsBarProps {
  telemetry?: unknown;
  stats?: UserStats;
}

export const SystemMetricsBar: React.FC<SystemMetricsBarProps> = ({ stats }) => {
  const defaultStats: UserStats = {
    totalWorlds: 4,
    totalPeople: 11,
    activeTasks: 7,
    completedTasks: 38,
  };

  const currentStats = stats || defaultStats;

  const items = [
    {
      label: 'My Worlds',
      value: currentStats.totalWorlds,
      icon: Globe,
      color: 'text-brand-purple-light',
      bg: 'bg-brand-purple/10 border-brand-purple/20',
    },
    {
      label: 'People & Helpers',
      value: currentStats.totalPeople,
      icon: Users,
      color: 'text-brand-cyan-light',
      bg: 'bg-brand-cyan/10 border-brand-cyan/20',
    },
    {
      label: 'Active Tasks',
      value: currentStats.activeTasks,
      icon: CheckSquare,
      color: 'text-brand-amber-light',
      bg: 'bg-brand-amber/10 border-brand-amber/20',
    },
    {
      label: 'Tasks Completed',
      value: currentStats.completedTasks,
      icon: CheckCircle,
      color: 'text-brand-emerald-light',
      bg: 'bg-brand-emerald/10 border-brand-emerald/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="p-4 hover:border-brand-purple/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl border ${item.bg} ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary font-sans">
              {item.value}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
