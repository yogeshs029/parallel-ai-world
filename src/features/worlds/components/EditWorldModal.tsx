import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { worldService } from '../../../services/worldService';
import { World, WorldType } from '../../../types';
import { cn } from '../../../lib/utils';

export interface EditWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: World;
  onWorldUpdated?: (updated: World) => void;
}

const WORLD_TYPES: { id: WorldType; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'school', label: 'School', icon: '🏫' },
  { id: 'company', label: 'Company', icon: '🏢' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'study', label: 'Study', icon: '📚' },
  { id: 'game', label: 'Game / Story', icon: '🎮' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'custom', label: 'Custom', icon: '✨' },
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

export const EditWorldModal: React.FC<EditWorldModalProps> = ({
  isOpen,
  onClose,
  world,
  onWorldUpdated,
}) => {
  const toast = useToast();
  const [name, setName] = useState(world.name);
  const [description, setDescription] = useState(world.description);
  const [type, setType] = useState<WorldType>(world.type || world.category);
  const [icon, setIcon] = useState(world.icon || world.emoji);
  const [accentColor, setAccentColor] = useState(world.visualIdentity?.accentColor || 'indigo');
  const [coverGradient, setCoverGradient] = useState(world.visualIdentity?.coverGradient || 'from-indigo-600/30 via-purple-600/20 to-transparent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(world.name);
    setDescription(world.description);
    setType(world.type || world.category);
    setIcon(world.icon || world.emoji);
    setAccentColor(world.visualIdentity?.accentColor || 'indigo');
    setCoverGradient(world.visualIdentity?.coverGradient || 'from-indigo-600/30 via-purple-600/20 to-transparent');
    setError(null);
  }, [world, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('World name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updated = await worldService.updateWorld(world.id, {
        name: name.trim(),
        description: description.trim(),
        type,
        icon,
        visualIdentity: {
          accentColor,
          coverGradient,
          badgeText: type.charAt(0).toUpperCase() + type.slice(1),
        },
        purpose: description.trim() || name.trim(),
      });

      if (updated) {
        toast.success('World updated', `Changes to '${updated.name}' have been saved.`);
        if (onWorldUpdated) {
          onWorldUpdated(updated);
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update world. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit World Settings"
      description="Update your world's name, purpose, and visual theme."
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
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="p-3 bg-brand-rose-subtle border border-brand-rose/30 rounded-xl text-xs text-brand-rose font-medium">
            {error}
          </div>
        )}

        {/* Icon & Name */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
            <Input
              label="Icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="text-center text-lg"
              maxLength={4}
            />
          </div>
          <div className="col-span-3">
            <Input
              label="World Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* World Type */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">World Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WorldType)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
          >
            {WORLD_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Description / Purpose</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans"
          />
        </div>

        {/* Quick Icon Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Icon Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_PRESETS.map((ic) => (
              <button
                type="button"
                key={ic}
                onClick={() => setIcon(ic)}
                className={cn(
                  'w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all cursor-pointer',
                  icon === ic
                    ? 'bg-brand-purple/20 border-brand-purple scale-105'
                    : 'bg-background-elevated border-border hover:border-brand-purple/40',
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Accent */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-text-secondary">Accent Color Theme</label>
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
                    'p-2 rounded-xl border flex items-center gap-2 transition-all text-left cursor-pointer',
                    isSelected
                      ? 'bg-background-elevated border-brand-purple ring-1 ring-brand-purple'
                      : 'bg-background-elevated/60 border-border hover:border-brand-purple/40',
                  )}
                >
                  <span className={cn('w-3 h-3 rounded-full shrink-0', acc.bg)} />
                  <span className="text-[11px] text-text-primary font-medium">{acc.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};
