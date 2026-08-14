export interface ActivityLog {
  id: string;
  worldId?: string;
  worldName?: string;
  personId?: string;
  personName?: string;
  personEmoji?: string;
  action: string;
  sentence: string;
  timestamp: string;
  category: 'task' | 'person' | 'world' | 'note' | 'conversation';
}

export interface KnowledgeNote {
  id: string;
  worldId: string;
  title: string;
  content: string;
  category: 'guideline' | 'note' | 'document' | 'idea' | 'memory';
  authorName: string;
  tags: string[];
  updatedAt: string;
}
