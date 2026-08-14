import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ActivityTimeline } from '../features/dashboard/components/ActivityTimeline';
import { LoadingState } from '../components/layout/LoadingState';
import { activityService } from '../services/activityService';
import { ActivityLog } from '../types';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    activityService
      .getAllActivities(30)
      .then(setActivities)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading activity stream..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="Activity"
        description="A real-time chronicle of what people are creating, researching, and completing across all your worlds."
      />

      <ActivityTimeline
        activities={activities}
        title="All Events & Updates"
      />
    </div>
  );
};
