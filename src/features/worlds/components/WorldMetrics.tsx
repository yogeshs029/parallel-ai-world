import React from 'react';
import { Users, CheckSquare, BookOpen, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { World } from '../../../types';
import { formatDateRelative } from '../../../lib/utils';

export interface WorldMetricsProps {
  metrics?: unknown;
  world?: World;
}

export const WorldMetrics: React.FC<WorldMetricsProps> = ({ world }) => {
  const items = [
    {
      label: 'People & Roles',
      value: world?.peopleCount || 0,
      icon: Users,
      color: 'text-brand-purple-light',
      bg: 'bg-brand-purple/10 border-brand-purple/20',
    },
    {
      label: 'Active Tasks',
      value: world?.activeTasksCount || 0,
      icon: CheckSquare,
      color: 'text-brand-emerald-light',
      bg: 'bg-brand-emerald/10 border-brand-emerald/20',
    },
    {
      label: 'Category',
      value: (world?.category || 'General').toUpperCase(),
      icon: BookOpen,
      color: 'text-brand-cyan-light',
      bg: 'bg-brand-cyan/10 border-brand-cyan/20',
      isText: true,
    },
    {
      label: 'Created',
      value: world ? formatDateRelative(world.createdAt) : 'Recently',
      icon: Calendar,
      color: 'text-text-muted',
      bg: 'bg-background-elevated border-border',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="p-4 hover:border-brand-purple/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${item.bg} ${item.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className={`font-bold text-text-primary ${item.isText ? 'text-sm sm:text-base' : 'text-2xl'}`}>
                {item.value}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
