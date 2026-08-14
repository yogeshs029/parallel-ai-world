import React, { useState } from 'react';
import {
  Brain,
  Target,
  Sparkles,
  ShieldCheck,
  Calendar,
  BookOpen,
  HelpCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Compass,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Memory, MemoryType, MemoryImportance } from '../../../types/memory';
import { formatDateRelative } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

export interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  showScope?: boolean;
}

const TYPE_CONFIG: Record<
  MemoryType,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  fact: { label: 'Fact', icon: Brain, color: 'text-brand-purple-light' },
  preference: { label: 'Preference', icon: Sparkles, color: 'text-brand-amber' },
  goal: { label: 'Goal', icon: Target, color: 'text-brand-cyan' },
  responsibility: { label: 'Responsibility', icon: ShieldCheck, color: 'text-brand-emerald' },
  relationship: { label: 'Relationship', icon: Compass, color: 'text-rose-400' },
  event: { label: 'Event', icon: Calendar, color: 'text-blue-400' },
  decision: { label: 'Decision', icon: BookOpen, color: 'text-purple-400' },
  knowledge: { label: 'Knowledge', icon: HelpCircle, color: 'text-indigo-400' },
};

const IMPORTANCE_BADGES: Record<
  MemoryImportance,
  { label: string; variant: 'high' | 'medium' | 'low' }
> = {
  critical: { label: 'Critical', variant: 'high' },
  high: { label: 'High', variant: 'high' },
  medium: { label: 'Medium', variant: 'medium' },
  low: { label: 'Low', variant: 'low' },
};

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onEdit,
  onDelete,
  showScope = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const typeConfig = TYPE_CONFIG[memory.type] || TYPE_CONFIG.fact;
  const TypeIcon = typeConfig.icon;
  const importanceInfo = IMPORTANCE_BADGES[memory.importance] || IMPORTANCE_BADGES.medium;

  const sourceLabel =
    memory.source === 'conversation'
      ? 'Remembered from conversation'
      : memory.source === 'event'
        ? 'Captured milestone'
        : 'Recorded manually';

  return (
    <Card className="p-4 sm:p-5 hover:border-brand-purple/40 relative group font-sans flex flex-col justify-between h-full bg-background-surface transition-all">
      <div className="space-y-2.5">
        {/* Card Header: Type & Importance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'p-1.5 rounded-xl bg-background-elevated border border-border flex items-center justify-center',
                typeConfig.color,
              )}
            >
              <TypeIcon className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary">
                {typeConfig.label}
              </span>
              {showScope && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-background-deep border border-border text-text-muted capitalize">
                  {memory.scope}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={importanceInfo.variant} size="sm">
              {importanceInfo.label}
            </Badge>

            {/* Actions Menu */}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
                  title="Memory options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-36 bg-background-surface border border-border rounded-xl shadow-xl p-1 z-50 animate-slide-down text-xs">
                      {onEdit && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onEdit(memory);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-elevated text-left text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onDelete(memory);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-brand-rose/20 text-left text-brand-rose transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Forget
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title if present */}
        {memory.title && (
          <h4 className="text-xs font-bold text-text-primary pt-0.5">
            {memory.title}
          </h4>
        )}

        {/* Memory Content */}
        <p className="text-xs text-text-secondary leading-relaxed font-sans">
          "{memory.content}"
        </p>
      </div>

      {/* Card Footer: Source & Timestamp */}
      <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-text-dim">
        <span className="truncate max-w-[65%]">{sourceLabel}</span>
        <span className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {formatDateRelative(memory.createdAt)}
        </span>
      </div>
    </Card>
  );
};
