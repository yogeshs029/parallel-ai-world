import React from 'react';
import { UserPlus, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { World } from '../../../types';
import { cn } from '../../../lib/utils';

export interface WorldHeaderProps {
  world: World;
  onAddAgentClick: () => void;
  onStartTaskClick: () => void;
  onEditWorldClick?: () => void;
  onDeleteWorldClick?: () => void;
}

export const WorldHeader: React.FC<WorldHeaderProps> = ({
  world,
  onAddAgentClick,
  onStartTaskClick,
  onEditWorldClick,
  onDeleteWorldClick,
}) => {
  const coverGradient =
    world.visualIdentity?.coverGradient || 'from-indigo-600/30 via-purple-600/20 to-transparent';
  const icon = world.icon || world.emoji || '✨';
  const worldType = world.type || world.category || 'custom';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-background-surface shadow-card-subtle font-sans">
      {/* Visual Accent Banner */}
      <div className={cn('h-24 w-full bg-gradient-to-r p-6 flex items-end justify-between relative', coverGradient)}>
        <div className="w-16 h-16 rounded-2xl bg-background-surface border border-white/10 flex items-center justify-center text-4xl shadow-md translate-y-6">
          {icon}
        </div>

        {/* Quick Edit / Delete Controls in Banner */}
        <div className="flex items-center gap-1.5">
          {onEditWorldClick && (
            <button
              onClick={onEditWorldClick}
              className="px-3 py-1.5 rounded-xl bg-background-surface/80 hover:bg-background-surface text-text-secondary hover:text-text-primary text-xs font-medium border border-border backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Edit World Settings"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit World</span>
            </button>
          )}
          {onDeleteWorldClick && (
            <button
              onClick={onDeleteWorldClick}
              className="p-1.5 rounded-xl bg-background-surface/80 hover:bg-rose-500/20 text-text-muted hover:text-rose-400 border border-border backdrop-blur-md transition-colors cursor-pointer shadow-sm"
              title="Delete World"
              aria-label="Delete World"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Info */}
      <div className="p-6 pt-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              {world.name}
            </h1>
            <Badge variant="primary" size="sm" className="capitalize">
              {worldType}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
            {world.purpose || world.description}
          </p>

          {/* Tags */}
          {world.tags && world.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {world.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-background-elevated border border-border text-text-secondary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            leftIcon={UserPlus}
            onClick={onAddAgentClick}
          >
            Add Person
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={onStartTaskClick}
          >
            Create Task
          </Button>
        </div>
      </div>
    </div>
  );
};
