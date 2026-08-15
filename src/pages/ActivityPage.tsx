import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Bot, CheckCircle2, MessageSquare, Shield, Clock } from 'lucide-react';
import { ActivityTimeline } from '../features/dashboard/components/ActivityTimeline';
import { LoadingState } from '../components/layout/LoadingState';
import { Input } from '../components/ui/Input';
import { activityService } from '../services/activityService';
import { ActivityLog } from '../types';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    activityService
      .getAllActivities(40)
      .then(setActivities)
      .finally(() => setIsLoading(false));
  }, []);

  const categoryFilters = [
    { id: 'all', label: 'All Events', icon: Sparkles },
    { id: 'task', label: 'Tasks & Milestones', icon: CheckCircle2 },
    { id: 'person', label: 'Agent Actions', icon: Bot },
    { id: 'conversation', label: 'Conversations', icon: MessageSquare },
    { id: 'world', label: 'World Updates', icon: Shield },
  ];

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const text = `${act.sentence || ''} ${act.action || ''}`.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        text.includes(searchQuery.toLowerCase()) ||
        (act.worldName && act.worldName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.personName && act.personName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || act.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [activities, searchQuery, selectedCategory]);

  if (isLoading) {
    return <LoadingState message="Loading activity stream..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* ── TOP HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121426] via-[#16182E] to-[#0F101E] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Real-Time Audit & Event Stream</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Activity Chronicle
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
              A real-time chronicle of what AI people are executing, researching, and completing across all your worlds.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="w-full sm:w-80">
          <Input
            isSearch
            placeholder="Search activity events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#121426] p-1 rounded-2xl border border-white/[0.08]">
          {categoryFilters.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-purple-glow'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <ActivityTimeline
        activities={filteredActivities}
        title="Live Events Stream"
      />
    </div>
  );
};

export default ActivityPage;
