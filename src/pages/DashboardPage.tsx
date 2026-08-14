import React, { useEffect, useState } from 'react';
import { HeroSection } from '../features/dashboard/components/HeroSection';
import { RecentWorldsList } from '../features/dashboard/components/RecentWorldsList';
import { ActiveAgentsOverview } from '../features/dashboard/components/ActiveAgentsOverview';
import { RunningTasksStream } from '../features/dashboard/components/RunningTasksStream';
import { ActivityTimeline } from '../features/dashboard/components/ActivityTimeline';
import { SystemMetricsBar } from '../features/dashboard/components/SystemMetricsBar';
import { PeopleInitiatives } from '../features/dashboard/components/PeopleInitiatives';
import { CreateWorldModal } from '../features/worlds/components/CreateWorldModal';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { personService } from '../services/personService';
import { taskService } from '../services/taskService';
import { activityService } from '../services/activityService';
import { World, Person, Task, ActivityLog, UserStats } from '../types';
import { LoadingState } from '../components/layout/LoadingState';

export const DashboardPage: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createWorldDisclosure = useDisclosure(false);

  const loadData = async () => {
    try {
      const [w, p, t, a, s] = await Promise.all([
        worldService.getAllWorlds(),
        personService.getAllPeople(),
        taskService.getActiveTasks(5),
        activityService.getAllActivities(8),
        worldService.getUserStats(),
      ]);
      setWorlds(w);
      setPeople(p);
      setTasks(t);
      setActivities(a);
      setStats(s);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Opening Parallel..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans">
      {/* Hero Welcome / Creation Callout */}
      <HeroSection onCreateWorldClick={createWorldDisclosure.onOpen} />

      {/* Simple Human Stats Counters */}
      {stats && <SystemMetricsBar stats={stats} />}

      {/* Main Worlds Roster */}
      <RecentWorldsList
        worlds={worlds}
        onCreateWorldClick={createWorldDisclosure.onOpen}
      />

      {/* People and Tasks Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveAgentsOverview agents={people} />
        <RunningTasksStream tasks={tasks} />
      </div>

      {/* ── People Initiatives ── People proactively reach out */}
      {people.length > 0 && (
        <PeopleInitiatives people={people} worlds={worlds} />
      )}

      {/* Natural Activity Feed */}
      <ActivityTimeline activities={activities} title="Recent Activity Across Worlds" />


      {/* Creation Modal */}
      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
        onWorldCreated={loadData}
      />
    </div>
  );
};
