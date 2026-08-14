import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { World } from '../../../types';
import { cn } from '../../../lib/utils';

export interface RecentWorldsListProps {
  worlds: World[];
  onCreateWorldClick?: () => void;
}

export const RecentWorldsList: React.FC<RecentWorldsListProps> = ({ worlds }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary tracking-tight font-sans">
          My Worlds
        </h2>
        <Link
          to="/worlds"
          className="text-xs text-brand-purple-light hover:underline flex items-center gap-1 font-semibold"
        >
          View all ({worlds.length}) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {worlds.map((world) => {
          const coverGradient =
            world.visualIdentity?.coverGradient || 'from-indigo-600/30 via-purple-600/20 to-transparent';
          const icon = world.icon || world.emoji || '✨';
          const peopleCount = world.memberCount ?? world.peopleCount ?? 0;
          const activeTasksCount = world.activeTaskCount ?? world.activeTasksCount ?? 0;
          const worldType = world.type || world.category || 'custom';

          return (
            <Link key={world.id} to={`/world/${world.id}`} className="block group">
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
                    <CardDescription className="line-clamp-2 mt-1 text-xs leading-relaxed text-text-secondary">
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

                <CardFooter className="p-5 pt-3 mt-1 border-t border-border/60 flex items-center justify-end text-xs font-semibold text-brand-purple-light group-hover:text-white transition-colors">
                  <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open World →
                  </span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
