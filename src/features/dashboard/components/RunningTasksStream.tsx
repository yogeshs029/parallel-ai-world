import React from 'react';
import { CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Task } from '../../../types';

export interface RunningTasksStreamProps {
  tasks: Task[];
}

export const RunningTasksStream: React.FC<RunningTasksStreamProps> = ({ tasks }) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-brand-emerald" />
          <CardTitle className="text-base font-bold">Tasks in Progress</CardTitle>
        </div>
        <Badge variant="working" size="sm" dot>
          {tasks.length} active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-2xl bg-background-elevated/80 border border-border hover:border-brand-purple/40 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    {task.description}
                  </p>
                </div>
                <Badge
                  variant={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}
                  size="sm"
                >
                  {task.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                  {task.assignedPersonName && (
                    <span>
                      {task.assignedPersonEmoji} {task.assignedPersonName}
                    </span>
                  )}
                  {task.projectName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-background-surface border border-border">
                      {task.projectName}
                    </span>
                  )}
                </div>
                {task.dueDate && (
                  <span className="text-[10px] text-text-muted">Due {task.dueDate}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
