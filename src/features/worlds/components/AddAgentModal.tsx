import React, { useState } from 'react';
import { UserPlus, Sparkles } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { peopleService } from '../../../services/peopleService';

export interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName?: string;
  onAgentAdded?: () => void;
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName,
  onAgentAdded,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [emoji, setEmoji] = useState('👩‍💻');
  const [responsibilities, setResponsibilities] = useState('');
  const [personality, setPersonality] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emojiOptions = ['👩‍💻', '👨‍💼', '📈', '🎨', '🧑‍🏫', '🧠', '👩‍🍳', '👨‍🔧', '👧', '🧙', '🤖', '✨'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for this person.');
      return;
    }
    if (!role.trim()) {
      setError('Please enter a role or title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const skillsList = skillsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await peopleService.createPerson(worldId, {
        name: name.trim(),
        role: role.trim(),
        description: responsibilities.trim() || `Responsible for ${role.trim()} in ${worldName || 'this world'}.`,
        avatar: {
          emoji: emoji,
        },
        responsibilities: responsibilities.trim()
          ? [responsibilities.trim()]
          : [`Handle key responsibilities as ${role.trim()}.`],
        personality: {
          traits: ['Friendly', 'Helpful'],
          description: personality.trim() || 'Friendly, proactive and helpful.',
          communicationStyle: ['Friendly', 'Professional'],
        },
        skills: skillsList.length > 0 ? skillsList : [role.trim()],
      });

      setName('');
      setRole('');
      setResponsibilities('');
      setPersonality('');
      setSkillsInput('');
      onClose();
      if (onAgentAdded) {
        onAgentAdded();
      }
    } catch (err) {
      console.error(err);
      setError('Could not add person. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a person to your world"
      description="Define their role, responsibilities, and personality to help in this world."
      size="md"
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
            leftIcon={UserPlus}
          >
            Add Person
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="p-3 bg-brand-rose-subtle border border-brand-rose/30 rounded-xl text-xs text-brand-rose font-medium">
            {error}
          </div>
        )}

        {/* Emoji Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Choose an Avatar</label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setEmoji(em)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                  emoji === em
                    ? 'bg-brand-purple/20 border-brand-purple ring-2 ring-brand-purple/50 scale-105'
                    : 'bg-background-elevated border-border hover:border-brand-purple/40'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Name and Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Name"
            placeholder="e.g. Maya, Rahul, Priya, Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Role / Title"
            placeholder="e.g. Developer, Marketing, Tutor"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>

        {/* Responsibilities */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Key Responsibilities
          </label>
          <textarea
            rows={2}
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="e.g. Build and maintain our customer website homepage."
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans"
          />
        </div>

        {/* Personality */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Personality & Tone</label>
          <input
            type="text"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="e.g. Friendly, analytical, proactive, detail-oriented"
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
          />
        </div>

        {/* Skills */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">
              Skills & Expertise (comma-separated)
            </label>
            <span className="text-[11px] text-text-dim flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-purple-light" /> Optional
            </span>
          </div>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, UI Design, Marketing, Nutrition"
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
          />
        </div>
      </form>
    </Modal>
  );
};
