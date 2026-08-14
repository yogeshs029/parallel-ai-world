export type KnowledgeType = 'document' | 'text' | 'url' | 'note';

export type KnowledgeStatus = 'processing' | 'ready' | 'failed';

export type KnowledgeVisibility = 'world' | 'person';

export interface KnowledgeChunk {
  id: string;
  knowledgeSourceId: string;
  worldId: string;
  personId?: string | null;
  visibility: KnowledgeVisibility;
  sourceName: string;
  sourceType: KnowledgeType;
  content: string;
  chunkIndex: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeSource {
  id: string;
  worldId: string;
  personId?: string | null;
  name: string;
  description?: string | null;
  type: KnowledgeType;
  source: string;
  status: KnowledgeStatus;
  size?: number | null;
  mimeType?: string | null;
  visibility: KnowledgeVisibility;
  extractedText?: string | null;
  chunkCount: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNoteInput {
  worldId: string;
  personId?: string | null;
  title: string;
  content: string;
  description?: string;
  visibility?: KnowledgeVisibility;
}

export interface CreateUrlInput {
  worldId: string;
  personId?: string | null;
  url: string;
  name?: string;
  description?: string;
  visibility?: KnowledgeVisibility;
}

export interface UpdateKnowledgeInput {
  name?: string;
  description?: string;
  visibility?: KnowledgeVisibility;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface RetrievedKnowledgeChunk {
  chunkId: string;
  sourceId: string;
  sourceName: string;
  sourceType: KnowledgeType;
  visibility: KnowledgeVisibility;
  content: string;
  score: number;
}
