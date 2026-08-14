import { GoalPriority } from './goal';

export type StepStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocks';
}

export interface PlanStep {
  id: string;
  planId: string;
  goalId: string;
  title: string;
  description: string;
  ownerPersonId: string;
  ownerPersonName?: string;
  ownerPersonEmoji?: string;
  status: StepStatus;
  priority: GoalPriority;
  dependencies: string[]; // array of step IDs that must be completed first
  order: number;
  taskId?: string; // linked Module 6 task ID
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Plan {
  id: string;
  goalId: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanRevision {
  id: string;
  planId: string;
  reason: string;
  changes: Record<string, unknown>;
  createdByPersonId: string;
  status: 'proposed' | 'approved' | 'rejected' | 'applied';
  createdAt: string;
}
