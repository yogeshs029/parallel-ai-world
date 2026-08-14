export type PersonStatus = 'available' | 'busy' | 'away' | 'offline';

export type CommunicationStyle =
  | 'Friendly'
  | 'Professional'
  | 'Direct'
  | 'Calm'
  | 'Energetic'
  | 'Analytical'
  | 'Creative'
  | 'Warm'
  | 'Concise'
  | 'Detailed';

export type ThinkingStyle =
  | 'Balanced'
  | 'Analytical'
  | 'Creative'
  | 'Practical'
  | 'Detailed';

export type InitiativeLevel =
  | 'Wait for me'
  | 'Suggest things'
  | 'Take initiative';

export interface PersonAvatar {
  emoji: string;
  gradientBg: string;
  initials?: string;
}

export interface PersonPersonality {
  traits: string[];
  description: string;
  communicationStyle: CommunicationStyle[];
}

export interface PersonIntelligence {
  enabled: boolean;
  thinkingStyle: ThinkingStyle;
  communicationStyle: CommunicationStyle[];
  initiativeLevel: InitiativeLevel;
  customInstructions?: string;
}

export interface Person {
  id: string;
  worldId: string;
  worldName?: string;
  name: string;
  role: string;
  description: string;
  avatar: PersonAvatar;
  // Backward compatibility aliases
  avatarEmoji?: string;
  avatarBg?: string;
  personality: PersonPersonality;
  intelligence?: PersonIntelligence;
  responsibilities: string[];
  skills: string[];
  interests: string[];
  goals: string[];
  status: PersonStatus;
  currentActivity?: string;
  tasksAssignedCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Backward compatibility alias
export type Agent = Person;

export interface CreatePersonInput {
  name: string;
  role: string;
  description?: string;
  avatar?: Partial<PersonAvatar>;
  personality?: Partial<PersonPersonality>;
  intelligence?: Partial<PersonIntelligence>;
  responsibilities?: string[];
  skills?: string[];
  interests?: string[];
  goals?: string[];
  status?: PersonStatus;
}

export interface UpdatePersonInput {
  name?: string;
  role?: string;
  description?: string;
  avatar?: Partial<PersonAvatar>;
  personality?: Partial<PersonPersonality>;
  intelligence?: Partial<PersonIntelligence>;
  responsibilities?: string[];
  skills?: string[];
  interests?: string[];
  goals?: string[];
  status?: PersonStatus;
}
