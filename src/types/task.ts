export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  worldId: string;
  worldName?: string;
  projectName?: string;
  title: string;
  description: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  assignedPersonEmoji?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
