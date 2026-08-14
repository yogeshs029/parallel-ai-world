export type GoalStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type GoalPriority = 'low' | 'normal' | 'high' | 'critical';

export type GoalType =
  | 'Project'
  | 'Personal'
  | 'Business'
  | 'Research'
  | 'Learning'
  | 'Maintenance'
  | 'Custom';

export interface Goal {
  id: string;
  worldId: string;
  ownerPersonId: string;
  ownerPersonName?: string;
  ownerPersonEmoji?: string;
  createdBy: string; // 'user' or personId
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number; // 0-100 derived from steps
  targetDate?: string;
  activePlanId?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
