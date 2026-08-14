import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, X, UserCheck } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useToast } from '../../../hooks/useToast';
import { peopleService } from '../../../services/peopleService';
import { CommunicationStyle, PersonStatus } from '../../../types';
import { cn } from '../../../lib/utils';

export interface CreatePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName?: string;
  initialRole?: string;
  onPersonCreated?: () => void;
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

const AVATAR_EMOJIS = ['👩‍💻', '👨‍💼', '📈', '🎨', '👩‍🍳', '👨‍🔧', '👧', '🧑‍🏫', '🧠', '🔬', '🌿', '🚀', '💡', '🎵', '🕵️‍♂️', '⚖️'];

export const CreatePersonModal: React.FC<CreatePersonModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName = 'Your World',
  initialRole = '',
  onPersonCreated,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [description, setDescription] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('👩‍💻');
  const [avatarGradient, setAvatarGradient] = useState('from-purple-600 to-pink-600');

  const [selectedStyles, setSelectedStyles] = useState<CommunicationStyle[]>(['Friendly', 'Professional']);
  const [personalityDesc, setPersonalityDesc] = useState('');

  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [currentResp, setCurrentResp] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const [interests, setInterests] = useState<string[]>([]);
  const [currentInterest, setCurrentInterest] = useState('');

  const [goals, setGoals] = useState<string[]>([]);
  const [currentGoal, setCurrentGoal] = useState('');

  const [status] = useState<PersonStatus>('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setName('');
    setRole(initialRole);
    setDescription('');
    setAvatarEmoji('👩‍💻');
    setAvatarGradient('from-purple-600 to-pink-600');
    setSelectedStyles(['Friendly', 'Professional']);
    setPersonalityDesc('');
    setResponsibilities([]);
    setCurrentResp('');
    setSkills([]);
    setCurrentSkill('');
    setInterests([]);
    setCurrentInterest('');
    setGoals([]);
    setCurrentGoal('');
    setError(null);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError('Please provide a name for this person.');
        return;
      }
      if (!role.trim()) {
        setError('Please provide a role or title.');
        return;
      }
    }
    setError(null);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const toggleStyle = (style: CommunicationStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
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

  const handleCreate = async () => {
    if (!name.trim() || !role.trim()) {
      setStep(1);
      setError('Name and role are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await peopleService.createPerson(worldId, {
        name: name.trim(),
        role: role.trim(),
        description: description.trim() || `${name.trim()} takes care of ${role.trim()} in ${worldName}.`,
        avatar: {
          emoji: avatarEmoji,
          gradientBg: avatarGradient,
          initials: name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'P',
        },
        personality: {
          traits: selectedStyles.length > 0 ? selectedStyles : ['Friendly'],
          description:
            personalityDesc.trim() ||
            `${name} is a dedicated ${role} who communicates in a ${selectedStyles.join(', ').toLowerCase()} style.`,
          communicationStyle: selectedStyles,
        },
        responsibilities:
          responsibilities.length > 0
            ? responsibilities
            : [`Help with ${role.toLowerCase()} projects and tasks.`],
        skills: skills.length > 0 ? skills : [role],
        interests: interests,
        goals: goals,
        status: status,
      });

      toast.success(
        `Added ${created.name} to ${worldName}!`,
        `${created.name} is now a member of your world.`,
      );
      resetForm();
      onClose();
      if (onPersonCreated) {
        onPersonCreated();
      }
      navigate(`/world/${worldId}/people/${created.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to add person. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Person"
      description={`Create someone to help bring ${worldName} to life.`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={ArrowLeft}
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                onClick={handleNext}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={UserCheck}
                onClick={handleCreate}
                isLoading={isSubmitting}
              >
                Create Person
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 font-sans">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-2 border-b border-border/70">
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  step === s
                    ? 'w-7 bg-brand-purple'
                    : step > s
                      ? 'w-3.5 bg-brand-purple/50'
                      : 'w-3.5 bg-background-elevated',
                )}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-text-muted">
            Step {step} of 5
          </span>
        </div>

        {error && (
          <div className="p-3 bg-brand-rose-subtle border border-brand-rose/30 rounded-xl text-xs text-brand-rose font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* STEP 1: Identity */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Who are you creating?
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Set their name, role, and choose a personal avatar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                placeholder="e.g. Maya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <Input
                label="Role / Title"
                placeholder="e.g. Lead Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Short Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Builds and maintains our websites and internal tools."
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans"
              />
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-text-secondary">Avatar Emoji</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => setAvatarEmoji(em)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer',
                      avatarEmoji === em
                        ? 'bg-brand-purple/20 border-brand-purple ring-2 ring-brand-purple/40 scale-105'
                        : 'bg-background-elevated border-border hover:border-brand-purple/40',
                    )}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personality */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Give them a personality
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Personality shapes how they communicate and approach problems in your world.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary">Communication Style (Select one or more)</label>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATION_STYLES.map((st) => {
                  const isSelected = selectedStyles.includes(st);
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => toggleStyle(st)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer',
                        isSelected
                          ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                          : 'bg-background-elevated text-text-secondary border-border hover:border-brand-purple/40',
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-text-secondary">
                Personality Description
              </label>
              <textarea
                rows={3}
                value={personalityDesc}
                onChange={(e) => setPersonalityDesc(e.target.value)}
                placeholder="e.g. Maya is curious, practical and proactive. She prefers solving problems herself before asking for help."
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Responsibilities & Skills */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                What should they take care of?
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Add responsibilities, skills, and areas of interest.
              </p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary">Key Responsibilities</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Build the company website"
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
                <div className="space-y-1.5 pt-1">
                  {responsibilities.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-background-elevated text-xs border border-border"
                    >
                      <span className="text-text-primary">{r}</span>
                      <button
                        onClick={() => removeResponsibility(idx)}
                        className="text-text-muted hover:text-brand-rose p-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <label className="text-xs font-semibold text-text-secondary">Skills & Expertise</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. React, TypeScript, UI Design"
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
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-elevated border border-border text-xs text-text-primary"
                    >
                      {sk}
                      <button
                        onClick={() => removeSkill(idx)}
                        className="text-text-muted hover:text-brand-rose cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Goals */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Goals & Milestones (Optional)
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Define what this person is working toward achieving in your world.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary">Add a Goal</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Launch our new website"
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
                <div className="space-y-1.5 pt-1">
                  {goals.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-background-elevated text-xs border border-border"
                    >
                      <span className="text-text-primary font-medium">🎯 {g}</span>
                      <button
                        onClick={() => removeGoal(idx)}
                        className="text-text-muted hover:text-brand-rose p-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Interests */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <label className="text-xs font-semibold text-text-secondary">Personal Interests (Optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Open source, Photography, Design"
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
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {interests.map((it, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-deep border border-border text-xs text-text-muted"
                    >
                      {it}
                      <button
                        onClick={() => removeInterest(idx)}
                        className="text-text-muted hover:text-brand-rose cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Preview & Confirm */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Preview your person
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Review this character profile before bringing them into {worldName}.
              </p>
            </div>

            {/* Live Character Card Preview */}
            <div className="p-5 rounded-2xl bg-background-surface border border-border space-y-4 shadow-card-subtle">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <Avatar name={name} emoji={avatarEmoji} size="xl" status="available" />
                  <div>
                    <h3 className="text-lg font-bold text-text-primary font-sans">{name}</h3>
                    <p className="text-xs font-semibold text-brand-purple-light">{role}</p>
                    <p className="text-xs text-text-secondary mt-1 max-w-sm">{description || 'No description provided.'}</p>
                  </div>
                </div>
                <Badge variant="available" size="sm" dot>
                  Available
                </Badge>
              </div>

              {/* Personality Preview */}
              <div className="p-3 rounded-xl bg-background-elevated border border-border text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider block">
                  Personality & Communication:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStyles.map((st) => (
                    <span key={st} className="px-2 py-0.5 rounded-md bg-brand-purple/20 text-brand-purple-light text-[11px] font-medium">
                      {st}
                    </span>
                  ))}
                </div>
                {personalityDesc && (
                  <p className="text-text-secondary italic text-[11px] pt-1">"{personalityDesc}"</p>
                )}
              </div>

              {/* Responsibilities Preview */}
              {responsibilities.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">Responsibilities:</span>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="truncate">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
