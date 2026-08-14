import React, { useState } from 'react';
import { Brain, Sparkles, Save, Target, ShieldCheck, Calendar, BookOpen, HelpCircle, Compass } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { memoryService } from '../../../services/memoryService';
import { MemoryType, MemoryScope, MemoryImportance } from '../../../types/memory';
import { cn } from '../../../lib/utils';

export interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName?: string;
  personId?: string | null;
  personName?: string;
  onMemoryCreated?: () => void;
}

const MEMORY_TYPES: { id: MemoryType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'fact', label: 'Fact', icon: Brain },
  { id: 'preference', label: 'Preference', icon: Sparkles },
  { id: 'goal', label: 'Goal', icon: Target },
  { id: 'responsibility', label: 'Responsibility', icon: ShieldCheck },
  { id: 'event', label: 'Event', icon: Calendar },
  { id: 'decision', label: 'Decision', icon: BookOpen },
  { id: 'knowledge', label: 'Knowledge', icon: HelpCircle },
  { id: 'relationship', label: 'Relationship', icon: Compass },
];

const IMPORTANCE_LEVELS: { id: MemoryImportance; label: string; desc: string }[] = [
  { id: 'critical', label: 'Critical', desc: 'Always recall when possible' },
  { id: 'high', label: 'High', desc: 'Frequently relevant' },
  { id: 'medium', label: 'Medium', desc: 'Standard importance' },
  { id: 'low', label: 'Low', desc: 'Only when strongly relevant' },
];

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName = 'this world',
  personId,
  personName,
  onMemoryCreated,
}) => {
  const toast = useToast();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MemoryType>('fact');
  const [scope, setScope] = useState<MemoryScope>(personId ? 'person' : 'world');
  const [importance, setImportance] = useState<MemoryImportance>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setContent('');
    setTitle('');
    setType('fact');
    setScope(personId ? 'person' : 'world');
    setImportance('medium');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write what should be remembered.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await memoryService.createMemory(worldId, {
        worldId,
        personId: scope === 'person' ? personId : null,
        scope,
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        importance,
        source: 'manual',
      });

      const recipient = scope === 'person' && personName ? personName : `Everyone in ${worldName}`;
      toast.success('Memory saved', `Added to ${recipient}'s persistent knowledge.`);
      resetForm();
      onClose();
      if (onMemoryCreated) {
        onMemoryCreated();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add something to remember"
      description="Create a persistent memory that won't be forgotten across conversations."
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={Save}
          >
            Save Memory
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

        {/* Content Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            What should be remembered?
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Our company website launches on September 15 with our new handcrafted dining tables."
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
            autoFocus
            required
          />
        </div>

        {/* Title Field */}
        <Input
          label="Short Summary Title (Optional)"
          placeholder="e.g. Website Launch Date"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Memory Scope (Who should remember it?) */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">
            Who should remember this?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('world')}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer space-y-0.5',
                scope === 'world'
                  ? 'bg-brand-purple/20 border-brand-purple text-white'
                  : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
              )}
            >
              <div className="font-bold text-text-primary">🌍 Everyone in this world</div>
              <div className="text-[11px] text-text-muted">Shared world knowledge</div>
            </button>

            {personId && personName && (
              <button
                type="button"
                onClick={() => setScope('person')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer space-y-0.5',
                  scope === 'person'
                    ? 'bg-brand-purple/20 border-brand-purple text-white'
                    : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
                )}
              >
                <div className="font-bold text-text-primary">👤 {personName} only</div>
                <div className="text-[11px] text-text-muted">Private personal memory</div>
              </button>
            )}
          </div>
        </div>

        {/* Memory Type */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Type of Memory</label>
          <div className="flex flex-wrap gap-1.5">
            {MEMORY_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer',
                    isSelected
                      ? 'bg-brand-purple text-white border-brand-purple'
                      : 'bg-background-elevated text-text-secondary border-border hover:border-brand-purple/30',
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Importance Rating */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Importance</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IMPORTANCE_LEVELS.map((imp) => {
              const isSelected = importance === imp.id;
              return (
                <button
                  type="button"
                  key={imp.id}
                  onClick={() => setImportance(imp.id)}
                  className={cn(
                    'p-2 rounded-xl border text-xs text-center transition-all cursor-pointer space-y-0.5',
                    isSelected
                      ? 'bg-brand-purple/20 border-brand-purple font-bold text-text-primary'
                      : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
                  )}
                >
                  <div className="capitalize">{imp.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};
