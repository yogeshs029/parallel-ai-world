import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { HeroSection } from '../features/dashboard/components/HeroSection';
import { RecentWorldsList } from '../features/dashboard/components/RecentWorldsList';
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
    window.addEventListener('parallel:world_deleted', loadData);
    window.addEventListener('parallel:world_created', loadData);
    return () => {
      window.removeEventListener('parallel:world_deleted', loadData);
      window.removeEventListener('parallel:world_created', loadData);
    };
  }, []);

  if (isLoading) {
    return <LoadingState message="Opening Command Center..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in font-sans pb-12">
      {/* ── 1. Hero Command & Control Header ── */}
      <HeroSection onCreateWorldClick={createWorldDisclosure.onOpen} />

      {/* ── 2. System Stat Counters Bar (5 metrics) ── */}
      {stats && <SystemMetricsBar stats={stats} />}

      {/* ── 3. Modular 2-Column Command Center Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PRIMARY CANVAS (8 cols): Worlds, Goals & Initiatives ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Worlds Section */}
          <RecentWorldsList
            worlds={worlds}
            onCreateWorldClick={createWorldDisclosure.onOpen}
          />

          {/* People Initiatives & Goals Stream */}
          {people.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-extrabold text-white">
                    Active Agent Initiatives
                  </h3>
                </div>
                <Link to="/goals" className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1">
                  View Roadmap <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <PeopleInitiatives people={people} worlds={worlds} />
            </div>
          )}
        </div>

        {/* ── RIGHT COMMAND DECK (4 cols): Live Agent Deck, Tasks & Live Feed ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active AI Agent Live Deck */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121426] p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-extrabold text-white">Live Agents</h3>
              </div>
              <Link to="/people" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-0.5">
                Directory <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {people.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-text-muted space-y-1">
                  <p className="font-semibold text-text-secondary">No People created yet</p>
                  <p className="text-[11px]">People you create will appear here.</p>
                </div>
              ) : (
                people.slice(0, 4).map((person) => {
                  const emoji = person.avatar?.emoji || person.avatarEmoji || '👤';
                  const isOnline = person.status === 'available' || person.status === 'busy';
                  return (
                    <div
                      key={person.id}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-full bg-purple-600/30 border border-white/20 flex items-center justify-center text-base shrink-0">
                          <span>{emoji}</span>
                          {isOnline && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-[#121426]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{person.name}</span>
                            <span className="text-[10px] text-text-muted">({person.role})</span>
                          </div>
                          <p className="text-[10px] text-purple-300/80 truncate">{person.currentActivity || 'Active in World'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/world/${person.worldId}/people/${person.id}/chat`}
                          className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-purple-600/30 text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="Direct Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Running Tasks Stream */}
          <RunningTasksStream tasks={tasks} />

          {/* Live Activity Feed */}
          <ActivityTimeline activities={activities} title="Recent Activity" />
        </div>
      </div>

      {/* Creation Modal */}
      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
        onWorldCreated={loadData}
      />
    </div>
  );
};

export default DashboardPage;
