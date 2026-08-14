import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Goal, GoalStatus } from '../../../types/goal';

interface GoalCardProps {
  goal: Goal;
  worldId: string;
}

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Draft',      color: 'text-slate-400',  dot: 'bg-slate-300' },
  active:    { label: 'Active',     color: 'text-[#007aff]',  dot: 'bg-[#007aff]' },
  paused:    { label: 'Paused',     color: 'text-amber-500',  dot: 'bg-amber-400' },
  blocked:   { label: 'Blocked',    color: 'text-rose-500',   dot: 'bg-rose-400' },
  completed: { label: 'Completed',  color: 'text-emerald-500',dot: 'bg-emerald-400' },
  failed:    { label: 'Failed',     color: 'text-rose-600',   dot: 'bg-rose-500' },
  cancelled: { label: 'Cancelled',  color: 'text-slate-400',  dot: 'bg-slate-300' },
};

const PRIORITY_BADGE: Record<string, string> = {
  low:      'bg-slate-100 text-slate-500',
  normal:   'bg-blue-50 text-blue-600',
  high:     'bg-amber-50 text-amber-600',
  critical: 'bg-rose-50 text-rose-600',
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, worldId }) => {
  const sc = STATUS_CONFIG[goal.status] || STATUS_CONFIG.draft;
  const isCompleted = goal.status === 'completed';

  return (
    <Link
      to={`/world/${worldId}/goals/${goal.id}`}
      className="group block bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-md hover:border-[#007aff]/30 transition-all duration-200 overflow-hidden"
    >
      {/* Top stripe for completed */}
      {isCompleted && (
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400 w-full" />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${sc.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${goal.status === 'active' ? 'animate-pulse' : ''}`} />
                {sc.label}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_BADGE[goal.priority] || PRIORITY_BADGE.normal}`}>
                {goal.priority}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-[#007aff] transition-colors line-clamp-2">
              {goal.title}
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#007aff] transition-colors shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {goal.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Progress</span>
            <span className={`text-[11px] font-bold ${isCompleted ? 'text-emerald-500' : 'text-[#007aff]'}`}>
              {goal.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : goal.status === 'blocked'
                  ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                  : 'bg-gradient-to-r from-[#007aff] to-blue-400'
              }`}
              style={{ width: `${Math.max(goal.progress, 0)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Owner */}
            {goal.ownerPersonEmoji && (
              <span className="text-base leading-none">{goal.ownerPersonEmoji}</span>
            )}
            {goal.ownerPersonName && (
              <span className="text-xs font-semibold text-slate-600">{goal.ownerPersonName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Target date */}
            {goal.targetDate && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <CalendarDays className="w-3 h-3" />
                {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {/* Status icon */}
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : goal.status === 'active' ? (
              <Loader2 className="w-4 h-4 text-[#007aff] animate-spin" />
            ) : (
              <Circle className="w-4 h-4 text-slate-200" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
