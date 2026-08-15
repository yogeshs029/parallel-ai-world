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
    <Card variant="glass" className="h-full font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-base font-extrabold text-white">Active Tasks</CardTitle>
        </div>
        <Badge variant="working" size="sm" dot>
          {tasks.length} in progress
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted space-y-1">
            <p className="font-semibold text-text-secondary">No active tasks</p>
            <p className="text-[11px]">Tasks will appear as your People start working.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-[#17192C]/80 border border-white/[0.08] hover:border-purple-500/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">
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

                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                    {task.assignedPersonName && (
                      <span>
                        {task.assignedPersonEmoji} {task.assignedPersonName}
                      </span>
                    )}
                    {task.projectName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#121424] border border-white/[0.08] text-purple-300">
                        {task.projectName}
                      </span>
                    )}
                  </div>
                  {task.dueDate && (
                    <span className="text-[10px] text-text-muted font-medium">Due {task.dueDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
