import React from 'react';
import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { ActivityLog } from '../../../types';
import { formatDateRelative } from '../../../lib/utils';

export interface ActivityTimelineProps {
  activities: ActivityLog[];
  title?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  title = 'Recent Activity',
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-cyan" />
          <CardTitle className="text-base font-bold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-2xl bg-background-elevated/70 border border-border hover:border-border-bright transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-background-surface border border-border flex items-center justify-center text-base shrink-0">
                {act.personEmoji || '👤'}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-text-primary">
                    {act.personName || 'Someone'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {formatDateRelative(act.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {act.sentence}
                </p>
                {act.worldName && (
                  <div className="text-[10px] text-text-dim pt-0.5">
                    in <span className="text-text-muted font-medium">{act.worldName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
