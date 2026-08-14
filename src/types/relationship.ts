export type RelationshipType =
  | 'friend'
  | 'colleague'
  | 'manager'
  | 'reports_to'
  | 'partner'
  | 'family'
  | 'mentor'
  | 'mentee'
  | 'client'
  | 'customer'
  | 'supplier'
  | 'teammate'
  | 'collaborator'
  | 'rival'
  | 'custom';

export type RelationshipStrength = 'weak' | 'normal' | 'strong';

export type RelationshipStatus = 'active' | 'paused' | 'ended';

export interface Relationship {
  id: string;
  worldId: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  strength: RelationshipStrength;
  status: RelationshipStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
