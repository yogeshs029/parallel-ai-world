import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Person } from '../../../types/person';
import { RelationshipType, RelationshipStrength } from '../../../types/relationship';
import { relationshipService } from '../../../services/relationshipService';
import { useToast } from '../../../hooks/useToast';

export interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  fromPerson: Person;
  allPeople: Person[];
  onRelationshipAdded?: () => void;
}

const RELATIONSHIP_OPTIONS: { type: RelationshipType; label: string }[] = [
  { type: 'colleague', label: 'Works with' },
  { type: 'reports_to', label: 'Reports to' },
  { type: 'manager', label: 'Manages' },
  { type: 'collaborator', label: 'Collaborates with' },
  { type: 'friend', label: 'Friends with' },
  { type: 'mentor', label: 'Mentors' },
  { type: 'mentee', label: 'Mentored by' },
  { type: 'family', label: 'Family member' },
  { type: 'teammate', label: 'Teammate' },
  { type: 'rival', label: 'Rival / Competitor' },
  { type: 'custom', label: 'Other connection' },
];

export const AddRelationshipModal: React.FC<AddRelationshipModalProps> = ({
  isOpen,
  onClose,
  worldId,
  fromPerson,
  allPeople,
  onRelationshipAdded,
}) => {
  const toast = useToast();
  const candidatePeople = allPeople.filter((p) => p.id !== fromPerson.id);

  const [toPersonId, setToPersonId] = useState<string>(candidatePeople[0]?.id || '');
  const [relType, setRelType] = useState<RelationshipType>('colleague');
  const [strength, setStrength] = useState<RelationshipStrength>('normal');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toPersonId) {
      toast.error('Missing Person', 'Please select a person to connect with.');
      return;
    }

    try {
      setIsSubmitting(true);
      await relationshipService.createRelationship(worldId, {
        worldId,
        fromPersonId: fromPerson.id,
        toPersonId,
        type: relType,
        strength,
        status: 'active',
        description: description.trim() || undefined,
      });

      toast.success('Relationship Created', 'Connection added successfully.');
      if (onRelationshipAdded) onRelationshipAdded();
      onClose();
    } catch (err) {
      console.error('Failed to create relationship:', err);
      toast.error('Creation Failed', 'Could not save relationship.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How are they connected?" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 font-sans pt-1">
        {/* From Person indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/80 border border-slate-200/80">
          <span className="text-xl">{fromPerson.avatar?.emoji || fromPerson.avatarEmoji || '👤'}</span>
          <div>
            <div className="text-xs font-bold text-slate-900">{fromPerson.name}</div>
            <div className="text-[11px] text-slate-500">{fromPerson.role}</div>
          </div>
        </div>

        {/* Target Person Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Connected With</label>
          <select
            value={toPersonId}
            onChange={(e) => setToPersonId(e.target.value)}
            className="w-full px-3 py-2 cosmos-input text-xs"
            required
          >
            {candidatePeople.length === 0 && (
              <option value="">No other people available in this world</option>
            )}
            {candidatePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        </div>

        {/* Relationship Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Relationship</label>
          <select
            value={relType}
            onChange={(e) => setRelType(e.target.value as RelationshipType)}
            className="w-full px-3 py-2 cosmos-input text-xs"
          >
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Relationship Strength */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Connection Strength</label>
          <div className="grid grid-cols-3 gap-2">
            {(['weak', 'normal', 'strong'] as RelationshipStrength[]).map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStrength(st)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  strength === st
                    ? 'bg-[#007aff]/10 border-[#007aff] text-[#007aff]'
                    : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Context / Note (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Maya and Priya work closely on website & marketing initiatives."
            className="w-full px-3 py-2 cosmos-input text-xs resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Connection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
