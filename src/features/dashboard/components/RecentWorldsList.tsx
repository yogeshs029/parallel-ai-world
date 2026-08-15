import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { World } from '../../../types';

export interface RecentWorldsListProps {
  worlds: World[];
  onCreateWorldClick?: () => void;
}

export const RecentWorldsList: React.FC<RecentWorldsListProps> = ({ worlds, onCreateWorldClick }) => {
  if (worlds.length === 0) {
    return (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-lg font-extrabold text-white tracking-tight font-sans">
            My Worlds
          </h2>
        </div>

        <Card variant="glass" className="p-8 text-center space-y-4 border-dashed border-white/[0.1]">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl mx-auto">
            🌐
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-white">You haven't created a World yet</h3>
            <p className="text-xs text-text-muted">
              Create a World that feels like your own place — for your company, home, studies, or ideas.
            </p>
          </div>
          {onCreateWorldClick && (
            <button
              type="button"
              onClick={onCreateWorldClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-purple-glow transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Your First World</span>
            </button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-lg font-extrabold text-white tracking-tight font-sans">
            My Worlds
          </h2>
        </div>
        <Link
          to="/worlds"
          className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-bold transition-colors"
        >
          View all ({worlds.length}) <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {worlds.slice(0, 4).map((world) => {
          const name = world.name;
          const description = world.description || 'Active AI World';
          const peopleCount = world.memberCount ?? world.peopleCount ?? 0;
          const icon = world.icon || world.emoji || '🌐';

          return (
            <Link key={world.id} to={`/world/${world.id}`} className="block group">
              <Card
                isInteractive
                variant="glass"
                className="h-full flex flex-col justify-between hover:border-purple-500/50 transition-all duration-200 overflow-hidden"
              >
                <div>
                  <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#1A1C30] to-[#0E1020] flex items-center justify-center p-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                      {icon}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <Badge variant="working" size="sm" dot>
                        Active
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-4 pt-3 pb-2">
                    <CardTitle className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                      {name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs text-text-secondary leading-relaxed font-sans mt-0.5">
                      {description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 pb-3">
                    <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
