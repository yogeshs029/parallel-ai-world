export type MemoryScope = 'person' | 'world' | 'conversation';

export type MemoryType =
  | 'fact'
  | 'preference'
  | 'goal'
  | 'responsibility'
  | 'relationship'
  | 'event'
  | 'decision'
  | 'knowledge';

export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export type MemorySource = 'manual' | 'conversation' | 'event';

export interface Memory {
  id: string;
  worldId: string;
  personId?: string | null;
  scope: MemoryScope;
  type: MemoryType;
  title?: string;
  content: string;
  importance: MemoryImportance;
  confidence: number;
  source: MemorySource;
  isActive: boolean;
  supersededById?: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateMemoryInput {
  worldId: string;
  personId?: string | null;
  scope?: MemoryScope;
  type?: MemoryType;
  title?: string;
  content: string;
  importance?: MemoryImportance;
  confidence?: number;
  source?: MemorySource;
  metadata?: Record<string, unknown>;
}

export interface UpdateMemoryInput {
  title?: string;
  content?: string;
  scope?: MemoryScope;
  type?: MemoryType;
  importance?: MemoryImportance;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SearchMemoryQuery {
  query: string;
  scope?: MemoryScope;
  type?: MemoryType;
  limit?: number;
}
