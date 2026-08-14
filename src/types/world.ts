export type WorldType =
  | 'home'
  | 'family'
  | 'school'
  | 'company'
  | 'business'
  | 'study'
  | 'game'
  | 'personal'
  | 'romantic'
  | 'dating'
  | 'custom';

// Backward compatibility alias
export type WorldCategory = WorldType;

export interface WorldVisualIdentity {
  accentColor: string; // e.g. 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan'
  coverGradient: string; // Tailwind gradient class
  badgeText?: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  type: WorldType;
  // Backward compatibility alias
  category: WorldType;
  icon: string; // Emoji or icon identifier
  // Backward compatibility alias
  emoji: string;
  visualIdentity: WorldVisualIdentity;
  purpose: string;
  promptDescription?: string;
  memberCount: number;
  // Backward compatibility alias
  peopleCount: number;
  activeTaskCount: number;
  // Backward compatibility alias
  activeTasksCount: number;
  status: 'active' | 'archived';
  settings?: WorldSettings;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorldSettings {
  allowInterPersonCommunication: boolean;
  allowRelationshipFormation: boolean;
  allowAutoConversationInitiation: boolean;
}

export interface CreateWorldInput {
  name: string;
  description: string;
  type: WorldType;
  icon?: string;
  visualIdentity?: Partial<WorldVisualIdentity>;
  purpose?: string;
  promptDescription?: string;
  tags?: string[];
}

export interface UpdateWorldInput {
  name?: string;
  description?: string;
  type?: WorldType;
  icon?: string;
  visualIdentity?: Partial<WorldVisualIdentity>;
  purpose?: string;
  status?: 'active' | 'archived';
  tags?: string[];
}
