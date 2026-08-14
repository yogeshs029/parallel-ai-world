import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Person } from '../../../types';

export interface ActiveAgentsOverviewProps {
  agents: Person[];
}

export const ActiveAgentsOverview: React.FC<ActiveAgentsOverviewProps> = ({ agents }) => {
  return (
    <Card className="h-full font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-purple-light" />
          <CardTitle className="text-base font-bold">People Across Your Worlds</CardTitle>
        </div>
        <Link
          to="/people"
          className="text-xs text-brand-purple-light hover:underline flex items-center gap-1 font-semibold"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
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
                className="p-3 rounded-2xl bg-background-elevated/80 border border-border hover:border-brand-purple/40 transition-all space-y-2 block group cursor-pointer"
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
                      <div className="text-xs font-bold text-text-primary group-hover:text-brand-purple-light transition-colors">
                        {person.name}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {person.role}
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusVariant} size="sm" dot>
                    {statusLabel}
                  </Badge>
                </div>

                {/* Current Activity in Plain English */}
                {person.description && (
                  <div className="text-[11px] text-text-secondary bg-background-surface/80 p-2 rounded-xl border border-border/60 font-sans leading-snug line-clamp-2">
                    {person.description}
                  </div>
                )}

                {person.worldName && (
                  <div className="text-[10px] text-text-muted font-medium pt-0.5 flex justify-between items-center">
                    <span>World: {person.worldName}</span>
                    <span className="text-brand-purple-light group-hover:translate-x-0.5 transition-transform">
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
