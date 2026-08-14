import React from 'react';
import { CheckSquare, Plus, Check } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Task } from '../../../types';

export interface WorldTaskQueueProps {
  tasks: Task[];
  onStartTaskClick: () => void;
  onToggleTask?: (taskId: string) => void;
}

export const WorldTaskQueue: React.FC<WorldTaskQueueProps> = ({
  tasks,
  onStartTaskClick,
}) => {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks in this world yet"
        description="Create tasks to organize projects, assign responsibilities to people, and track progress."
        actionLabel="Create First Task"
        onAction={onStartTaskClick}
        actionIcon={Plus}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-brand-emerald" />
          <h3 className="text-sm font-bold text-text-primary font-sans">
            Tasks & Projects ({tasks.length})
          </h3>
        </div>
        <Button variant="outline" size="sm" leftIcon={Plus} onClick={onStartTaskClick}>
          Create Task
        </Button>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const isDone = task.status === 'completed';
          return (
            <Card
              key={task.id}
              className="p-4 hover:border-brand-purple/40 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-brand-emerald border-brand-emerald text-white'
                        : 'border-border bg-background-elevated'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-bold font-sans ${
                          isDone ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.projectName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-background-elevated text-text-secondary border border-border">
                          {task.projectName}
                        </span>
                      )}
                      <Badge
                        variant={
                          task.priority === 'high'
                            ? 'high'
                            : task.priority === 'medium'
                              ? 'medium'
                              : 'low'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                      {task.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted shrink-0 sm:self-center pl-8 sm:pl-0">
                  {task.assignedPersonName && (
                    <span className="flex items-center gap-1 font-medium text-text-primary">
                      <span>{task.assignedPersonEmoji || '👤'}</span>
                      <span>{task.assignedPersonName}</span>
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[11px] text-text-muted">Due {task.dueDate}</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
