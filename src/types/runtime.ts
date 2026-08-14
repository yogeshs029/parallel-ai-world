import { TaskStatus, TaskPriority } from './task';

export type { TaskStatus, TaskPriority };

export interface RuntimeTask {
  id: string;
  worldId: string;
  assignedPersonId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: string | null;
  createdBy?: string | null;
  permissionsRequired?: string[];
  retryCount?: number;
  maxRetries?: number;
  notifyOnCompletion?: boolean;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'task_completed'
  | 'person_message'
  | 'approval_required'
  | 'world_update'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  worldId: string;
  personId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PersonPermissions {
  personId: string;
  worldId: string;
  worldView: boolean;
  worldEdit: boolean;
  peopleView: boolean;
  peopleCreate: boolean;
  peopleEdit: boolean;
  taskCreate: boolean;
  taskEdit: boolean;
  knowledgeView: boolean;
  knowledgeCreate: boolean;
  knowledgeEdit: boolean;
  projectCreate: boolean;
  projectEdit: boolean;
  messageUser: boolean;
  updatedAt: string;
}

export type WorldActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'ADD_KNOWLEDGE'
  | 'UPDATE_KNOWLEDGE'
  | 'CREATE_PERSON'
  | 'UPDATE_PERSON'
  | 'UPDATE_WORLD'
  | 'MESSAGE_USER';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface ApprovalRequest {
  id: string;
  worldId: string;
  requesterPersonId: string;
  requesterName: string;
  requesterEmoji?: string;
  actionType: WorldActionType;
  target: string;
  title: string;
  reason: string;
  payload?: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionComment?: string | null;
}

export interface RuntimeStatus {
  isRunning: boolean;
  workerStatus: string;
  activeWorldsCount: number;
  pendingTasksCount: number;
  pendingEventsCount: number;
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
  lastHeartbeat: string;
  processedTasksCount: number;
  processedEventsCount: number;
}
