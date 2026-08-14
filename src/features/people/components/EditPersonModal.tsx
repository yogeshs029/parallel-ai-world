import React, { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { peopleService } from '../../../services/peopleService';
import { Person, CommunicationStyle, PersonStatus } from '../../../types';
import { cn } from '../../../lib/utils';

export interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onPersonUpdated?: (updated: Person) => void;
}

const COMMUNICATION_STYLES: CommunicationStyle[] = [
  'Friendly',
  'Professional',
  'Direct',
  'Calm',
  'Energetic',
  'Analytical',
  'Creative',
];

const STATUS_OPTIONS: { id: PersonStatus; label: string }[] = [
  { id: 'available', label: '🟢 Available' },
  { id: 'busy', label: '🟡 Busy' },
  { id: 'away', label: '🟠 Away' },
  { id: 'offline', label: '⚪ Offline' },
];

const AVATAR_EMOJIS = ['👩‍💻', '👨‍💼', '📈', '🎨', '👩‍🍳', '👨‍🔧', '👧', '🧑‍🏫', '🧠', '🔬', '🌿', '🚀', '💡', '🎵', '🕵️‍♂️', '⚖️'];

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  isOpen,
  onClose,
  person,
  onPersonUpdated,
}) => {
  const toast = useToast();

  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role);
  const [description, setDescription] = useState(person.description || '');
  const [avatarEmoji, setAvatarEmoji] = useState(person.avatar?.emoji || person.avatarEmoji || '👤');
  const [status, setStatus] = useState<PersonStatus>(person.status || 'available');

  const [selectedStyles, setSelectedStyles] = useState<CommunicationStyle[]>(
    person.personality?.communicationStyle || ['Friendly'],
  );
  const [personalityDesc, setPersonalityDesc] = useState(
    person.personality?.description || '',
  );

  const [responsibilities, setResponsibilities] = useState<string[]>(
    person.responsibilities || [],
  );
  const [currentResp, setCurrentResp] = useState('');

  const [skills, setSkills] = useState<string[]>(person.skills || []);
  const [currentSkill, setCurrentSkill] = useState('');

  const [interests, setInterests] = useState<string[]>(person.interests || []);
  const [currentInterest, setCurrentInterest] = useState('');

  const [goals, setGoals] = useState<string[]>(person.goals || []);
  const [currentGoal, setCurrentGoal] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(person.name);
    setRole(person.role);
    setDescription(person.description || '');
    setAvatarEmoji(person.avatar?.emoji || person.avatarEmoji || '👤');
    setStatus(person.status || 'available');
    setSelectedStyles(person.personality?.communicationStyle || ['Friendly']);
    setPersonalityDesc(person.personality?.description || '');
    setResponsibilities(person.responsibilities || []);
    setSkills(person.skills || []);
    setInterests(person.interests || []);
    setGoals(person.goals || []);
    setError(null);
  }, [person, isOpen]);

  const toggleStyle = (st: CommunicationStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st],
    );
  };

  const addResponsibility = () => {
    if (!currentResp.trim()) return;
    setResponsibilities((prev) => [...prev, currentResp.trim()]);
    setCurrentResp('');
  };

  const removeResponsibility = (idx: number) => {
    setResponsibilities((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSkill = () => {
    if (!currentSkill.trim()) return;
    setSkills((prev) => [...prev, currentSkill.trim()]);
    setCurrentSkill('');
  };

  const removeSkill = (idx: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const addInterest = () => {
    if (!currentInterest.trim()) return;
    setInterests((prev) => [...prev, currentInterest.trim()]);
    setCurrentInterest('');
  };

  const removeInterest = (idx: number) => {
    setInterests((prev) => prev.filter((_, i) => i !== idx));
  };

  const addGoal = () => {
    if (!currentGoal.trim()) return;
    setGoals((prev) => [...prev, currentGoal.trim()]);
    setCurrentGoal('');
  };

  const removeGoal = (idx: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setError('Name and role are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updated = await peopleService.updatePerson(person.worldId, person.id, {
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        avatar: {
          emoji: avatarEmoji,
          gradientBg: person.avatar?.gradientBg || 'from-purple-600 to-indigo-700',
        },
        personality: {
          traits: selectedStyles,
          description: personalityDesc.trim(),
          communicationStyle: selectedStyles,
        },
        responsibilities,
        skills,
        interests,
        goals,
        status,
      });

      if (updated) {
        toast.success(`Updated ${updated.name}`, 'Changes saved to profile.');
        if (onPersonUpdated) {
          onPersonUpdated(updated);
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update person. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${person.name}`}
      description="Update identity, personality, responsibilities, and status."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-brand-rose-subtle border border-brand-rose/30 rounded-xl text-xs text-brand-rose font-medium">
            {error}
          </div>
        )}

        {/* Identity & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Role / Title"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PersonStatus)}
              className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3 py-2.5 focus:outline-none focus:border-brand-purple"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Short Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 focus:outline-none focus:border-brand-purple resize-none font-sans"
          />
        </div>

        {/* Avatar Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Avatar Emoji</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setAvatarEmoji(em)}
                className={cn(
                  'w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer',
                  avatarEmoji === em
                    ? 'bg-brand-purple/20 border-brand-purple scale-105'
                    : 'bg-background-elevated border-border hover:border-brand-purple/40',
                )}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Communication Styles */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-text-secondary">Communication Style</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNICATION_STYLES.map((st) => {
              const isSelected = selectedStyles.includes(st);
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => toggleStyle(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-brand-purple text-white border-brand-purple'
                      : 'bg-background-elevated text-text-secondary border-border hover:border-brand-purple/40',
                  )}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personality Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Personality Description</label>
          <textarea
            rows={2}
            value={personalityDesc}
            onChange={(e) => setPersonalityDesc(e.target.value)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 focus:outline-none focus:border-brand-purple resize-none font-sans"
          />
        </div>

        {/* Responsibilities */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Responsibilities</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add responsibility..."
              value={currentResp}
              onChange={(e) => setCurrentResp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addResponsibility();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addResponsibility} leftIcon={Plus}>
              Add
            </Button>
          </div>
          {responsibilities.length > 0 && (
            <div className="space-y-1">
              {responsibilities.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-background-elevated text-xs border border-border">
                  <span className="text-text-primary">{r}</span>
                  <button onClick={() => removeResponsibility(i)} className="text-text-muted hover:text-brand-rose cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Skills</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add skill..."
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addSkill} leftIcon={Plus}>
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((sk, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-background-elevated border border-border text-xs text-text-primary">
                  {sk}
                  <button onClick={() => removeSkill(i)} className="text-text-muted hover:text-brand-rose cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Goals</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add goal..."
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addGoal();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addGoal} leftIcon={Plus}>
              Add
            </Button>
          </div>
          {goals.length > 0 && (
            <div className="space-y-1">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-background-elevated text-xs border border-border">
                  <span className="text-text-primary">🎯 {g}</span>
                  <button onClick={() => removeGoal(i)} className="text-text-muted hover:text-brand-rose cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Interests</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add interest..."
              value={currentInterest}
              onChange={(e) => setCurrentInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addInterest} leftIcon={Plus}>
              Add
            </Button>
          </div>
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((it, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-background-deep border border-border text-xs text-text-muted">
                  {it}
                  <button onClick={() => removeInterest(i)} className="text-text-muted hover:text-brand-rose cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
