import React from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckSquare, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { World } from '../../../types';
import { formatDateRelative, cn } from '../../../lib/utils';

export interface WorldCardProps {
  world: World;
  viewMode?: 'grid' | 'list';
}

export const WorldCard: React.FC<WorldCardProps> = ({ world, viewMode = 'grid' }) => {
  const coverGradient =
    world.visualIdentity?.coverGradient || 'from-indigo-600/30 via-purple-600/20 to-transparent';
  const icon = world.icon || world.emoji || '✨';
  const peopleCount = world.memberCount ?? world.peopleCount ?? 0;
  const activeTasksCount = world.activeTaskCount ?? world.activeTasksCount ?? 0;
  const worldType = world.type || world.category || 'custom';

  if (viewMode === 'list') {
    return (
      <Link to={`/world/${world.id}`} className="block group font-sans">
        <Card
          isInteractive
          className="p-4 hover:border-brand-purple/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 max-w-xl">
            <div className="w-11 h-11 rounded-xl bg-background-elevated border border-border flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              {icon}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base group-hover:text-brand-purple-light transition-colors">
                  {world.name}
                </CardTitle>
                <Badge variant="primary" size="sm" className="capitalize">
                  {worldType}
                </Badge>
              </div>
              <CardDescription className="line-clamp-1">{world.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-text-muted shrink-0">
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Users className="w-3.5 h-3.5 text-brand-purple-light" />
              {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <CheckSquare className="w-3.5 h-3.5 text-brand-emerald" />
              {activeTasksCount} active {activeTasksCount === 1 ? 'task' : 'tasks'}
            </span>
            <span className="text-[11px] text-text-dim">
              Updated {formatDateRelative(world.updatedAt || world.createdAt)}
            </span>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-purple-light transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/world/${world.id}`} className="block group font-sans">
      <Card
        isInteractive
        className="h-full flex flex-col justify-between hover:border-brand-purple/40 overflow-hidden"
      >
        <div>
          {/* Visual Accent Banner */}
          <div className={cn('h-14 w-full bg-gradient-to-r p-3.5 flex items-end justify-between', coverGradient)}>
            <div className="w-11 h-11 rounded-2xl bg-background-surface border border-white/10 flex items-center justify-center text-2xl shadow-sm translate-y-3.5 group-hover:scale-105 transition-transform">
              {icon}
            </div>
            <Badge variant="primary" size="sm" className="capitalize text-[10px]">
              {worldType}
            </Badge>
          </div>

          <CardHeader className="p-5 pt-7 pb-2">
            <CardTitle className="text-base font-bold group-hover:text-brand-purple-light transition-colors">
              {world.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1.5 text-xs leading-relaxed text-text-secondary">
              {world.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-1 pb-3">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <Users className="w-3.5 h-3.5 text-brand-purple-light" />
                {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <CheckSquare className="w-3.5 h-3.5 text-brand-emerald" />
                {activeTasksCount} active {activeTasksCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          </CardContent>
        </div>

        <CardFooter className="p-5 pt-3 mt-1 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
          <span className="text-[11px]">
            {formatDateRelative(world.updatedAt || world.createdAt)}
          </span>
          <span className="text-brand-purple-light font-semibold group-hover:text-white transition-colors flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Open World →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};
