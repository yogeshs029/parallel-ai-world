import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Plus } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../hooks/useToast';
import { worldService } from '../../../services/worldService';
import { WorldType } from '../../../types';
import { cn } from '../../../lib/utils';

export interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated?: () => void;
}

interface WorldTypeOption {
  id: WorldType;
  icon: string;
  name: string;
  shortDesc: string;
  defaultName: string;
  defaultDesc: string;
  defaultPrompt: string;
  accent: string;
  gradient: string;
}

const WORLD_TYPES: WorldTypeOption[] = [
  {
    id: 'home',
    icon: '🏠',
    name: 'Home',
    shortDesc: 'A place for my family, everyday life and household plans.',
    defaultName: 'My Home',
    defaultDesc: 'Manage household tasks, grocery lists, home repairs, and family plans.',
    defaultPrompt: 'I want a home world to organize weekly meal plans, family chores, and home maintenance.',
    accent: 'amber',
    gradient: 'from-amber-600/30 via-orange-600/20 to-transparent',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    name: 'Family',
    shortDesc: 'Keep family members connected, supported and organized.',
    defaultName: 'Our Family Space',
    defaultDesc: 'Coordinate family schedules, children tutoring, and special events.',
    defaultPrompt: 'Keep our family connected with shared calendars, tutoring for kids, and trip planning.',
    accent: 'rose',
    gradient: 'from-rose-600/30 via-pink-600/20 to-transparent',
  },
  {
    id: 'company',
    icon: '🏢',
    name: 'Company',
    shortDesc: 'Build a team, manage projects and grow your business.',
    defaultName: 'My Company',
    defaultDesc: 'Build and grow our customer-focused business with product, engineering, and marketing.',
    defaultPrompt: 'I want a small company that sells handmade furniture. I need people for marketing, design and development.',
    accent: 'indigo',
    gradient: 'from-indigo-600/30 via-purple-600/20 to-transparent',
  },
  {
    id: 'business',
    icon: '💼',
    name: 'Business',
    shortDesc: 'Manage clients, sales, operations and daily workflows.',
    defaultName: 'Client Advisory Hub',
    defaultDesc: 'Deliver strategic advisory services, client deliverables, and proposals.',
    defaultPrompt: 'Manage client accounts, generate proposals, and coordinate project deadlines.',
    accent: 'emerald',
    gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent',
  },
  {
    id: 'study',
    icon: '📚',
    name: 'Study',
    shortDesc: 'Master new subjects, practice skills and organize research.',
    defaultName: 'My Study World',
    defaultDesc: 'Learn new subjects faster with patient mentors and smart study partners.',
    defaultPrompt: 'A quiet study environment for learning software engineering, practice problems, and flashcards.',
    accent: 'blue',
    gradient: 'from-blue-600/30 via-cyan-600/20 to-transparent',
  },
  {
    id: 'school',
    icon: '🏫',
    name: 'School',
    shortDesc: 'Organize courses, projects, study groups and homework.',
    defaultName: 'Semester Classroom',
    defaultDesc: 'Collaborative space for class coursework, group assignments, and tutoring.',
    defaultPrompt: 'Organize our semester courses, study notes, group homework projects, and exam prep.',
    accent: 'cyan',
    gradient: 'from-cyan-600/30 via-blue-600/20 to-transparent',
  },
  {
    id: 'game',
    icon: '🎮',
    name: 'Game / Story',
    shortDesc: 'Craft a rich fictional universe with characters and quests.',
    defaultName: 'Elysium Chronicles',
    defaultDesc: 'Creative storytelling universe with memorable characters and adventure questlines.',
    defaultPrompt: 'A fantasy story world with magical kingdoms, heroic quests, and historical chronicles.',
    accent: 'purple',
    gradient: 'from-purple-600/30 via-pink-600/20 to-transparent',
  },
  {
    id: 'personal',
    icon: '👤',
    name: 'Personal',
    shortDesc: 'A private assistant and thinking space for your goals.',
    defaultName: 'Personal Assistant World',
    defaultDesc: 'Daily productivity, wellness goals, personal reading lists, and ideas.',
    defaultPrompt: 'A personal productivity world to organize my daily habits, fitness routines, and book notes.',
    accent: 'purple',
    gradient: 'from-purple-600/30 via-indigo-600/20 to-transparent',
  },
  {
    id: 'custom',
    icon: '✨',
    name: 'Something else',
    shortDesc: 'Start from a blank canvas tailored to your own vision.',
    defaultName: 'My Custom World',
    defaultDesc: 'A custom space for my unique ideas, helpers, and projects.',
    defaultPrompt: 'A flexible custom workspace tailored to my specific projects.',
    accent: 'emerald',
    gradient: 'from-emerald-600/30 via-cyan-600/20 to-transparent',
  },
];

const ACCENT_STYLES = [
  { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-500', gradient: 'from-indigo-600/30 via-purple-600/20 to-transparent' },
  { id: 'purple', name: 'Radiant Purple', bg: 'bg-purple-500', gradient: 'from-purple-600/30 via-pink-600/20 to-transparent' },
  { id: 'blue', name: 'Calm Blue', bg: 'bg-blue-500', gradient: 'from-blue-600/30 via-cyan-600/20 to-transparent' },
  { id: 'emerald', name: 'Emerald Mint', bg: 'bg-emerald-500', gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent' },
  { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-500', gradient: 'from-amber-600/30 via-orange-600/20 to-transparent' },
  { id: 'rose', name: 'Rose Quartz', bg: 'bg-rose-500', gradient: 'from-rose-600/30 via-pink-600/20 to-transparent' },
  { id: 'cyan', name: 'Cyan Sky', bg: 'bg-cyan-500', gradient: 'from-cyan-600/30 via-blue-600/20 to-transparent' },
];

const ICON_PRESETS = ['🏢', '🏠', '👨‍👩‍👧', '📚', '🏫', '💼', '🎮', '👤', '✨', '🌿', '🚀', '🎨', '🍳', '🔬', '💡', '🎵'];

export const CreateWorldModal: React.FC<CreateWorldModalProps> = ({
  isOpen,
  onClose,
  onWorldCreated,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<WorldType>('company');
  const [name, setName] = useState('My Company');
  const [description, setDescription] = useState('Build and grow my business.');
  const [promptDescription, setPromptDescription] = useState('');
  const [icon, setIcon] = useState('🏢');
  const [accentColor, setAccentColor] = useState('indigo');
  const [coverGradient, setCoverGradient] = useState('from-indigo-600/30 via-purple-600/20 to-transparent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setSelectedType('company');
    setName('My Company');
    setDescription('Build and grow my business.');
    setPromptDescription('');
    setIcon('🏢');
    setAccentColor('indigo');
    setCoverGradient('from-indigo-600/30 via-purple-600/20 to-transparent');
    setError(null);
  };

  const handleSelectType = (opt: WorldTypeOption) => {
    setSelectedType(opt.id);
    setName(opt.defaultName);
    setDescription(opt.defaultDesc);
    setPromptDescription(opt.defaultPrompt);
    setIcon(opt.icon);
    setAccentColor(opt.accent);
    setCoverGradient(opt.gradient);
    setError(null);
  };

  const handleNext = () => {
    if (step === 2 && !name.trim()) {
      setError('Please give your world a name.');
      return;
    }
    setError(null);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please give your world a name.');
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const newWorld = await worldService.createWorld({
        name: name.trim(),
        description: description.trim() || 'A friendly world for intelligent helpers.',
        type: selectedType,
        icon: icon.trim() || '✨',
        visualIdentity: {
          accentColor,
          coverGradient,
          badgeText: selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
        },
        purpose: description.trim() || name.trim(),
        promptDescription: promptDescription.trim() || undefined,
      });

      toast.success(`World '${newWorld.name}' created!`, 'Entering your new world container.');
      resetForm();
      onClose();
      if (onWorldCreated) {
        onWorldCreated();
      }
      navigate(`/world/${newWorld.id}`);
    } catch (err) {
      console.error(err);
      setError('Could not create world. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTypeMeta = WORLD_TYPES.find((t) => t.id === selectedType) || WORLD_TYPES[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create your world"
      description="Build a place for people, ideas and intelligent helpers to work together."
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
                leftIcon={Plus}
                onClick={handleCreate}
                isLoading={isSubmitting}
              >
                Create World
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

        {/* STEP 1: Choose World Type */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                What kind of world are you creating?
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Choose a world type to set initial templates, roles, and visual styles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {WORLD_TYPES.map((opt) => {
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleSelectType(opt)}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer group',
                      isSelected
                        ? 'bg-brand-purple/15 border-brand-purple shadow-sm ring-1 ring-brand-purple'
                        : 'bg-background-elevated/70 border-border hover:border-brand-purple/40 hover:bg-background-elevated',
                    )}
                  >
                    <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      {opt.icon}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-text-primary">{opt.name}</h5>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-purple-light" />}
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug line-clamp-2">
                        {opt.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Name Your World */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Give your world a name
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Choose a clear, recognizable name for this space.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated/60 border border-border flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-background-surface border border-border">
                {icon}
              </span>
              <div className="flex-1">
                <Input
                  label="World Name"
                  placeholder={`e.g. ${currentTypeMeta.defaultName}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Description & Natural Language Prompt */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                What is this world about?
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Tell us what you want to use this world for.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Short Purpose / Summary
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what you want to use this world for..."
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Describe your world in your own words (Optional)
                </label>
                <span className="text-[11px] text-text-dim flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-purple-light" /> Idea note
                </span>
              </div>
              <textarea
                rows={3}
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="e.g. I want a small company that sells handmade furniture. I need people for marketing, design and development."
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Make It Yours (Icon, Style, Banner) */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Make it yours
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Personalize your world's icon and color theme.
              </p>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary">Choose an Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_PRESETS.map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer',
                      icon === ic
                        ? 'bg-brand-purple/20 border-brand-purple ring-2 ring-brand-purple/40 scale-105'
                        : 'bg-background-elevated border-border hover:border-brand-purple/40',
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-text-secondary">Visual Accent Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACCENT_STYLES.map((acc) => {
                  const isSelected = accentColor === acc.id;
                  return (
                    <button
                      type="button"
                      key={acc.id}
                      onClick={() => {
                        setAccentColor(acc.id);
                        setCoverGradient(acc.gradient);
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer',
                        isSelected
                          ? 'bg-background-elevated border-brand-purple ring-1 ring-brand-purple'
                          : 'bg-background-elevated/60 border-border hover:border-brand-purple/40',
                      )}
                    >
                      <span className={cn('w-3.5 h-3.5 rounded-full shrink-0', acc.bg)} />
                      <span className="text-xs text-text-primary font-medium">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Preview & Confirmation */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Review your world
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Here is a preview of your new world card before creating.
              </p>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-2xl border border-border bg-background-surface overflow-hidden shadow-card-subtle">
              <div className={cn('h-16 w-full bg-gradient-to-r p-4 flex items-end', coverGradient)}>
                <div className="w-12 h-12 rounded-2xl bg-background-elevated border border-white/10 flex items-center justify-center text-2xl shadow-md translate-y-3">
                  {icon}
                </div>
              </div>

              <div className="p-5 pt-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-text-primary font-sans">{name}</h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <Badge variant="primary" size="sm" className="capitalize">
                    {selectedType}
                  </Badge>
                </div>

                {promptDescription && (
                  <div className="p-3 rounded-xl bg-background-elevated text-xs text-text-muted border border-border/60">
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-0.5">
                      Your Initial Vision:
                    </span>
                    "{promptDescription}"
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/60">
                  <span>0 people • 0 active tasks</span>
                  <span className="text-brand-purple-light font-semibold">Ready to enter →</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
