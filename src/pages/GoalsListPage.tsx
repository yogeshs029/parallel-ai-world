import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Target, Check, Star, Calendar, Sparkles } from 'lucide-react';
import { Goal, GoalStatus } from '../types/goal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/layout/LoadingState';
import { worldService } from '../services/worldService';
import { personService } from '../services/personService';
import { goalService } from '../services/goalService';

export const GoalsListPage: React.FC = () => {
  const { worldId } = useParams<{ worldId?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'plans'>('goals');
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const allWorlds = await worldService.getAllWorlds();
      await personService.getAllPeople();

      const targetWorldId = worldId || (allWorlds.length > 0 ? allWorlds[0].id : 'w-demo');
      const loadedGoals = await goalService.getGoals(targetWorldId);

      // Seed mock demo goals if list is empty to match design Image 1 Screen 4 & 5
      if (loadedGoals.length === 0) {
        const seeded: Goal[] = [
          {
            id: 'g-1',
            worldId: targetWorldId,
            title: 'Launch Furniture Store',
            description: 'Build and launch our online furniture store with a seamless shopping experience.',
            status: 'active',
            progress: 68,
            priority: 'high',
            ownerPersonId: 'p-1',
            ownerPersonName: 'Maya',
            createdBy: 'user',
            type: 'Business',
            targetDate: 'Sep 15',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g-2',
            worldId: targetWorldId,
            title: 'Expand Product Line',
            description: 'Source new eco-friendly wooden chairs and minimalist dining tables.',
            status: 'active',
            progress: 35,
            priority: 'normal',
            ownerPersonId: 'p-2',
            ownerPersonName: 'Rahul',
            createdBy: 'user',
            type: 'Business',
            targetDate: 'Oct 10',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g-3',
            worldId: targetWorldId,
            title: 'Improve Customer Support',
            description: 'Implement automated support agents for instant client resolution.',
            status: 'active',
            progress: 20,
            priority: 'low',
            ownerPersonId: 'p-3',
            ownerPersonName: 'Priya',
            createdBy: 'user',
            type: 'Maintenance',
            targetDate: 'Aug 25',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g-4',
            worldId: targetWorldId,
            title: 'Set up Accounting System',
            description: 'Integrate automated billing and tax calculations.',
            status: 'completed',
            progress: 100,
            priority: 'normal',
            ownerPersonId: 'p-2',
            ownerPersonName: 'Rahul',
            createdBy: 'user',
            type: 'Finance' as Goal['type'],
            targetDate: 'Jul 20',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setGoals(seeded);
      } else {
        setGoals(loadedGoals);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const filteredGoals = filter === 'all' ? goals : goals.filter((g) => g.status === filter);

  if (isLoading) return <LoadingState message="Loading Goals & Plans..." />;

  // Demo step-by-step plan progress matching Image 1 Screen 5
  const demoPlanSteps = [
    { id: 1, title: 'Market Research', completed: true },
    { id: 2, title: 'Define Store Structure', completed: true },
    { id: 3, title: 'Design Homepage', completed: true },
    { id: 4, title: 'Product Catalog Setup', completed: false },
    { id: 5, title: 'Payment Integration', completed: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* ── TOP ROADMAP STRATEGY BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121426] via-[#16182E] to-[#0F101E] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Milestone Execution Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Goals & Plans
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
              Track key strategic milestones, assigned AI owners, and automated step progress in real time.
            </p>
          </div>

          <Button variant="primary" size="md" leftIcon={Plus} className="shadow-purple-glow cursor-pointer self-start sm:self-auto">
            New Goal
          </Button>
        </div>

        {/* Strategic Summary Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Total Goals</span>
            <span className="text-lg font-black text-white">{goals.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Active In-Flight</span>
            <span className="text-lg font-black text-purple-300">{activeGoals.length} Active</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Completed</span>
            <span className="text-lg font-black text-emerald-400">{completedGoals.length} Done</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Average Progress</span>
            <span className="text-lg font-black text-cyan-400">68%</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher (Goals | Plans) */}
      <div className="flex items-center gap-6 border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'goals'
              ? 'text-white border-purple-500'
              : 'text-text-muted border-transparent hover:text-white'
          }`}
        >
          Goals
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'plans'
              ? 'text-white border-purple-500'
              : 'text-text-muted border-transparent hover:text-white'
          }`}
        >
          Plans
        </button>
      </div>

      {/* Sub Filter Pills (All | Active | Completed | Paused) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {(['all', 'active', 'completed', 'paused'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${
              filter === f
                ? 'bg-purple-600 text-white shadow-purple-glow'
                : 'bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] hover:text-white border border-white/[0.08]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Active Goals Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Active Goals ({activeGoals.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals
            .filter((g) => g.status !== 'completed')
            .map((goal) => (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="p-5 rounded-3xl bg-[#131525] border border-white/[0.08] hover:border-purple-500/50 shadow-lg hover:shadow-purple-glow transition-all duration-200 cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-400 shrink-0" />
                      <h3 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                        {goal.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span className="capitalize text-rose-400 font-semibold">{goal.priority} priority</span>
                      {goal.targetDate && (
                        <>
                          <span>•</span>
                          <span>Due {goal.targetDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-purple-300">{goal.progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-600/40 border border-purple-400/40 flex items-center justify-center text-[10px] font-bold text-white">
                      {goal.ownerPersonName ? goal.ownerPersonName[0] : 'M'}
                    </div>
                    <span className="text-text-muted">Owner: <strong className="text-white">{goal.ownerPersonName || 'Maya'}</strong></span>
                  </div>
                  <span className="text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Completed Goals ({completedGoals.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="p-4 rounded-2xl bg-[#131525]/60 border border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-through opacity-80">{goal.title}</h4>
                    {goal.targetDate && <span className="text-[11px] text-text-muted">Completed on {goal.targetDate}</span>}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">100%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GOAL DETAIL MODAL WITH CIRCULAR PROGRESS RING */}
      {selectedGoal && (
        <Modal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          size="lg"
          showCloseButton
        >
          <div className="space-y-6 font-sans">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">{selectedGoal.title}</h2>
              <div className="flex items-center gap-3 text-xs pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 text-rose-400 fill-rose-400" />
                  High Priority
                </span>
                {selectedGoal.targetDate && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-text-secondary font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    Due {selectedGoal.targetDate}
                  </span>
                )}
              </div>
            </div>

            {/* Circular SVG Progress Ring Gauge */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#181A30] to-[#121426] border border-white/[0.08] shadow-inner">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#purpleGradientModalGoals)"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - (selectedGoal.progress || 68) / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="purpleGradientModalGoals" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-white">{selectedGoal.progress}%</span>
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Overall Progress
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">About this goal</h4>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                {selectedGoal.description}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Plan Progress</h4>
                <span className="text-xs font-mono font-bold text-purple-300">3 of 5 completed</span>
              </div>

              <div className="space-y-2">
                {demoPlanSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#17192C] border border-white/[0.08] hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                          step.completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        }`}
                      >
                        {step.id}
                      </div>
                      <span className={`text-xs font-bold ${step.completed ? 'text-white' : 'text-text-secondary'}`}>
                        {step.title}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        step.completed
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'border-white/20'
                      }`}
                    >
                      {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GoalsListPage;
