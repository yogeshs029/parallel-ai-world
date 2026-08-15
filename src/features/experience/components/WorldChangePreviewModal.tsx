import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Palette,
  Tag,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { WorldChangeProposal, WorldTheme } from '../../../types/experience';
import { experienceService } from '../../../services/experienceService';
import { useToast } from '../../../hooks/useToast';

export interface WorldChangePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: WorldChangeProposal | null;
  onApplied: () => void;
}

export const WorldChangePreviewModal: React.FC<WorldChangePreviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onApplied,
}) => {
  const toast = useToast();
  const [isApplying, setIsApplying] = useState(false);

  if (!proposal) return null;

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await experienceService.applyProposal(proposal.worldId, proposal.id);
      toast.success('Experience Updated', 'Your World transformation has been applied.');
      onApplied();
      onClose();
    } catch (e) {
      toast.error('Application Failed', 'Could not apply change proposal.');
    } finally {
      setIsApplying(false);
    }
  };

  const themePreview = proposal.changes?.theme as WorldTheme | undefined;
  const terminologyPreview = proposal.changes?.terminology as Record<string, string> | undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review World Changes"
      description="The AI has translated your natural language prompt into structured changes."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
            leftIcon={X}
            className="text-text-muted hover:text-white cursor-pointer text-xs"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            isLoading={isApplying}
            leftIcon={Check}
            className="shadow-purple-glow cursor-pointer text-xs font-bold"
          >
            Apply Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs">
        {/* User Prompt Echo */}
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
          <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
            Original Prompt
          </div>
          <p className="text-xs text-white font-medium italic">"{proposal.prompt}"</p>
        </div>

        {/* Change Summary Badge */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-extrabold text-white">Proposed Modifications</h4>
          </div>

          <div className="space-y-2">
            {proposal.summary.split(' • ').map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Theme Color Palette Preview */}
        {themePreview && (
          <div className="p-3.5 rounded-2xl bg-[#141628] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Color & Style Preview
              </span>
              <span className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {themePreview.preset}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-xl border border-white/[0.06] text-center space-y-1" style={{ backgroundColor: themePreview.surfaceColor }}>
                <div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: themePreview.primaryColor }} />
                <span className="text-[9px] text-text-muted block">Primary</span>
              </div>
              <div className="p-2 rounded-xl border border-white/[0.06] text-center space-y-1" style={{ backgroundColor: themePreview.surfaceColor }}>
                <div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: themePreview.secondaryColor }} />
                <span className="text-[9px] text-text-muted block">Secondary</span>
              </div>
              <div className="p-2 rounded-xl border border-white/[0.06] text-center space-y-1" style={{ backgroundColor: themePreview.surfaceColor }}>
                <div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: themePreview.accentColor }} />
                <span className="text-[9px] text-text-muted block">Accent</span>
              </div>
              <div className="p-2 rounded-xl border border-white/[0.06] text-center space-y-1" style={{ backgroundColor: themePreview.surfaceColor }}>
                <div className="w-4 h-4 rounded-full mx-auto border border-white/20" style={{ backgroundColor: themePreview.backgroundColor }} />
                <span className="text-[9px] text-text-muted block">Background</span>
              </div>
            </div>
          </div>
        )}

        {/* Terminology Preview */}
        {terminologyPreview && Object.keys(terminologyPreview).length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#141628] border border-white/[0.08] space-y-2">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Terminology Renames
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(terminologyPreview).map(([k, v]) => (
                <div key={k} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <span className="text-text-muted capitalize">{k.replace('Label', '')}:</span>
                  <span className="font-bold text-purple-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
