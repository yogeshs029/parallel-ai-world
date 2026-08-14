import React, { useState, useEffect } from 'react';
import { Brain, Check, Save, Sparkles, Sliders } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { peopleService } from '../../../services/peopleService';
import { Person, ThinkingStyle, CommunicationStyle, InitiativeLevel } from '../../../types';
import { cn } from '../../../lib/utils';

export interface ConfigureIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onUpdated?: (updated: Person) => void;
}

const THINKING_STYLES: { id: ThinkingStyle; label: string; desc: string }[] = [
  { id: 'Balanced', label: 'Balanced', desc: 'Well-rounded, pragmatic and adaptable.' },
  { id: 'Analytical', label: 'Analytical', desc: 'Systematic, evidence-based and methodical.' },
  { id: 'Creative', label: 'Creative', desc: 'Imaginative, innovative and unconventional.' },
  { id: 'Practical', label: 'Practical', desc: 'Action-oriented, simple and execution-focused.' },
  { id: 'Detailed', label: 'Detailed', desc: 'Rigorous, thorough with deep explanations.' },
];

const COMMUNICATION_STYLES: CommunicationStyle[] = [
  'Friendly',
  'Professional',
  'Direct',
  'Warm',
  'Concise',
  'Detailed',
  'Affectionate',
  'Flirty',
  'Romantic',
  'Explicit',
  'Loving',
];

const INITIATIVE_LEVELS: { id: InitiativeLevel; label: string; desc: string }[] = [
  { id: 'Wait for me', label: 'Wait for me', desc: 'Answer requests clearly without unsolicited suggestions.' },
  { id: 'Suggest things', label: 'Suggest things', desc: 'Offer useful ideas and recommendations when helpful.' },
  { id: 'Take initiative', label: 'Take initiative', desc: 'Actively propose next steps and anticipated tasks.' },
];

export const ConfigureIntelligenceModal: React.FC<ConfigureIntelligenceModalProps> = ({
  isOpen,
  onClose,
  person,
  onUpdated,
}) => {
  const toast = useToast();

  const [thinkingStyle, setThinkingStyle] = useState<ThinkingStyle>(
    person.intelligence?.thinkingStyle || 'Balanced',
  );
  const [selectedStyles, setSelectedStyles] = useState<CommunicationStyle[]>(
    person.intelligence?.communicationStyle ||
      person.personality?.communicationStyle || ['Friendly', 'Professional'],
  );
  const [initiativeLevel, setInitiativeLevel] = useState<InitiativeLevel>(
    person.intelligence?.initiativeLevel || 'Suggest things',
  );
  const [customInstructions, setCustomInstructions] = useState(
    person.intelligence?.customInstructions || '',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setThinkingStyle(person.intelligence?.thinkingStyle || 'Balanced');
    setSelectedStyles(
      person.intelligence?.communicationStyle ||
        person.personality?.communicationStyle || ['Friendly', 'Professional'],
    );
    setInitiativeLevel(person.intelligence?.initiativeLevel || 'Suggest things');
    setCustomInstructions(person.intelligence?.customInstructions || '');
  }, [person, isOpen]);

  const toggleStyle = (st: CommunicationStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(st)
        ? prev.filter((s) => s !== st)
        : [...prev, st],
    );
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const updated = await peopleService.updatePerson(person.worldId, person.id, {
        intelligence: {
          enabled: true,
          thinkingStyle,
          communicationStyle: selectedStyles.length > 0 ? selectedStyles : ['Friendly'],
          initiativeLevel,
          customInstructions: customInstructions.trim(),
        },
      });

      if (updated) {
        toast.success(
          `Updated ${person.name}'s Intelligence`,
          `Her thinking approach and conversation style have been saved.`,
        );
        if (onUpdated) {
          onUpdated(updated);
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Could not save intelligence settings', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${person.name}'s Intelligence`}
      description={`Shape how ${person.name} thinks, communicates and helps in your world.`}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSubmitting}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-5 font-sans max-h-[72vh] overflow-y-auto pr-1">
        {/* Section 1: Thinking Style */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-brand-purple-light" />
            How should {person.name} approach problems?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THINKING_STYLES.map((st) => {
              const isSelected = thinkingStyle === st.id;
              return (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setThinkingStyle(st.id)}
                  className={cn(
                    'p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1',
                    isSelected
                      ? 'bg-brand-purple/15 border-brand-purple ring-1 ring-brand-purple/40 shadow-sm'
                      : 'bg-background-elevated border-border hover:border-brand-purple/30',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{st.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-purple-light" />}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">{st.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Communication Style */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            How should {person.name} communicate?
          </label>
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
                      ? 'bg-brand-purple text-white border-brand-purple'
                      : 'bg-background-elevated text-text-secondary border-border hover:border-brand-purple/30',
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Initiative Level */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-amber" />
            How proactive should {person.name} be?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {INITIATIVE_LEVELS.map((init) => {
              const isSelected = initiativeLevel === init.id;
              return (
                <button
                  type="button"
                  key={init.id}
                  onClick={() => setInitiativeLevel(init.id)}
                  className={cn(
                    'p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1',
                    isSelected
                      ? 'bg-brand-purple/15 border-brand-purple ring-1 ring-brand-purple/40 shadow-sm'
                      : 'bg-background-elevated border-border hover:border-brand-purple/30',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{init.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-purple-light" />}
                  </div>
                  <p className="text-[10px] text-text-secondary leading-snug">{init.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Additional Custom Instructions */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary">
              Additional Instructions (Optional)
            </label>
            <span className="text-[10px] text-text-dim">Guidance for {person.name}</span>
          </div>
          <textarea
            rows={3}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder={`e.g. Always explain technical decisions in simple terms, and include React code snippets when designing components.`}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Section 5: Advanced Settings Placeholder */}
        <div className="p-3.5 rounded-2xl bg-background-surface/50 border border-dashed border-border/80 flex items-center justify-between text-xs text-text-muted">
          <div className="space-y-0.5">
            <div className="font-semibold text-text-secondary">Advanced Model Routing</div>
            <div className="text-[11px] text-text-dim">Model parameters & external tools</div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-background-elevated border border-border text-text-dim font-medium">
            Coming later (Module 4+)
          </span>
        </div>
      </div>
    </Modal>
  );
};
