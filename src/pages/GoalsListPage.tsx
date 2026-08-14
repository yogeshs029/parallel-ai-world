import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Target, CheckCircle2, Loader2, PauseCircle, AlertCircle } from 'lucide-react';
import { Goal, GoalStatus } from '../types/goal';
import { World, Person } from '../types';
import { GoalCard } from '../features/goals/components/GoalCard';
import { CreateGoalModal } from '../features/goals/components/CreateGoalModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { goalService } from '../services/goalService';

const STATUS_FILTERS: { value: GoalStatus | 'all'; label: string; icon?: React.FC<{ className?: string }> }[] = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active',    icon: Loader2 },
  { value: 'paused',    label: 'Paused',    icon: PauseCircle },
  { value: 'blocked',   label: 'Blocked',   icon: AlertCircle },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'draft',     label: 'Draft' },
];

export const GoalsListPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const createDisclosure = useDisclosure(false);

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');

  const loadData = useCallback(async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, p, g] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
        goalService.getGoals(worldId),
      ]);
      setWorld(w);
      setPeople(p);
      setGoals(g);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredGoals = filter === 'all' ? goals : goals.filter((g) => g.status === filter);

  const stats = {
    active:    goals.filter((g) => g.status === 'active').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    blocked:   goals.filter((g) => g.status === 'blocked').length,
  };

  if (isLoading) return <LoadingState message="Loading goals..." />;
  if (!world) return <div className="p-8 text-center text-slate-500">World not found.</div>;

  const icon = world.icon || world.emoji || '✨';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/worlds" className="hover:text-slate-700 transition-colors font-medium">My Worlds</Link>
        <span>/</span>
        <Link to={`/world/${world.id}`} className="hover:text-slate-700 transition-colors font-semibold flex items-center gap-1">
          <span>{icon}</span><span>{world.name}</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">Goals</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Goals</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#007aff]/10 text-[#007aff] font-bold">
              {goals.length}
            </span>
          </div>
          <p className="text-sm text-slate-500">Give <strong className="text-slate-700">{world.name}</strong> something meaningful to work toward.</p>
        </div>
        <Button variant="primary" size="md" leftIcon={Plus} onClick={createDisclosure.onOpen}>
          Create Goal
        </Button>
      </div>

      {/* Stats Pills */}
      {goals.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-[#007aff]/10 text-[#007aff] font-bold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#007aff] rounded-full animate-pulse" />
            {stats.active} Active
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {stats.completed} Completed
          </div>
          {stats.blocked > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {stats.blocked} Blocked
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {goals.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const count = f.value === 'all' ? goals.length : goals.filter((g) => g.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  filter === f.value
                    ? 'bg-[#007aff] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
                <span className={`text-[10px] ${filter === f.value ? 'text-white/80' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Goals Grid */}
      {filteredGoals.length === 0 && goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a goal to give your world a purpose. Assign it to a person and generate a structured plan."
          actionLabel="Create First Goal"
          onAction={createDisclosure.onOpen}
          actionIcon={Plus}
        />
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No goals match this filter.
          <button onClick={() => setFilter('all')} className="text-[#007aff] font-semibold ml-1 hover:underline">Clear filter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} worldId={world.id} />
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={createDisclosure.isOpen}
        onClose={createDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        availablePeople={people}
        onGoalCreated={loadData}
      />
    </div>
  );
};
