import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Person } from '../../../types';

export interface ActiveAgentsOverviewProps {
  agents: Person[];
}

export const ActiveAgentsOverview: React.FC<ActiveAgentsOverviewProps> = ({ agents }) => {
  return (
    <Card variant="glass" className="h-full font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <CardTitle className="text-base font-extrabold text-white">People Across Your Worlds</CardTitle>
        </div>
        <Link
          to="/people"
          className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-bold transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.slice(0, 6).map((person) => {
            const emoji = person.avatar?.emoji || person.avatarEmoji || '👤';
            const statusVariant =
              person.status === 'available'
                ? 'available'
                : person.status === 'busy'
                  ? 'working'
                  : person.status === 'away'
                    ? 'thinking'
                    : 'offline';

            const statusLabel =
              person.status === 'available'
                ? 'Available'
                : person.status === 'busy'
                  ? 'Busy'
                  : person.status === 'away'
                    ? 'Away'
                    : 'Offline';

            return (
              <Link
                key={person.id}
                to={`/world/${person.worldId}/people/${person.id}`}
                className="p-3.5 rounded-2xl bg-[#17192C]/80 border border-white/[0.08] hover:border-purple-500/50 transition-all space-y-2.5 block group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={person.name}
                      emoji={emoji}
                      size="md"
                      status={person.status === 'busy' ? 'working' : person.status === 'away' ? 'thinking' : person.status}
                    />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {person.name}
                      </div>
                      <div className="text-[11px] font-medium text-text-secondary">
                        {person.role}
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusVariant} size="sm" dot>
                    {statusLabel}
                  </Badge>
                </div>

                {person.description && (
                  <div className="text-[11px] text-text-secondary bg-[#121424] p-2.5 rounded-xl border border-white/[0.06] font-sans leading-snug line-clamp-2">
                    {person.description}
                  </div>
                )}

                {person.worldName && (
                  <div className="text-[10px] text-text-muted font-semibold pt-0.5 flex justify-between items-center">
                    <span>World: {person.worldName}</span>
                    <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">
                      Profile →
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
