import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { memoryService } from '../../../services/memoryService';
import { Memory, MemoryType, MemoryImportance } from '../../../types/memory';
import { cn } from '../../../lib/utils';

export interface EditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  onMemoryUpdated?: () => void;
}

const MEMORY_TYPES: MemoryType[] = [
  'fact',
  'preference',
  'goal',
  'responsibility',
  'event',
  'decision',
  'knowledge',
  'relationship',
];

const IMPORTANCE_LEVELS: MemoryImportance[] = ['low', 'medium', 'high', 'critical'];

export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onMemoryUpdated,
}) => {
  const toast = useToast();

  const [title, setTitle] = useState(memory.title || '');
  const [content, setContent] = useState(memory.content);
  const [type, setType] = useState<MemoryType>(memory.type);
  const [importance, setImportance] = useState<MemoryImportance>(memory.importance);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(memory.title || '');
    setContent(memory.content);
    setType(memory.type);
    setImportance(memory.importance);
    setError(null);
  }, [memory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Memory content cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await memoryService.updateMemory(memory.worldId, memory.id, {
        title: title.trim() || undefined,
        content: content.trim(),
        type,
        importance,
      });

      toast.success('Memory updated', 'Changes have been saved.');
      onClose();
      if (onMemoryUpdated) {
        onMemoryUpdated();
      }
    } catch (err) {
      console.error(err);
      setError('Could not update memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Memory"
      description="Update remembered facts, goals, or preferences."
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

        <Input
          label="Summary Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Website Launch Date"
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Memory Content</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
            required
          />
        </div>

        {/* Type Selection */}
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {MEMORY_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-xs font-medium border capitalize transition-all cursor-pointer',
                  type === t
                    ? 'bg-brand-purple text-white border-brand-purple'
                    : 'bg-background-elevated text-text-secondary border-border hover:border-brand-purple/30',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Importance Selection */}
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">Importance</label>
          <div className="grid grid-cols-4 gap-2">
            {IMPORTANCE_LEVELS.map((imp) => (
              <button
                type="button"
                key={imp}
                onClick={() => setImportance(imp)}
                className={cn(
                  'p-2 rounded-xl border text-xs text-center capitalize transition-all cursor-pointer',
                  importance === imp
                    ? 'bg-brand-purple/20 border-brand-purple font-bold text-text-primary'
                    : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
                )}
              >
                {imp}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
