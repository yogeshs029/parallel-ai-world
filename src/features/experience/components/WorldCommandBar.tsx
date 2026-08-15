import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { WorldChangeProposal } from '../../../types/experience';
import { experienceService } from '../../../services/experienceService';

export interface WorldCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName: string;
  onProposalGenerated: (proposal: WorldChangeProposal) => void;
}

const EXAMPLE_PROMPTS = [
  'Make this world feel like a modern luxury furniture company',
  'Change theme to warm amber with spacious layout',
  'Move People to the top of navigation and hide Activity',
  'Rename Goals to Objectives',
  'Switch to professional deep blue with compact density',
  'Make this world playful and colorful',
];

export const WorldCommandBar: React.FC<WorldCommandBarProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName,
  onProposalGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (textToSubmit?: string) => {
    const query = (textToSubmit || prompt).trim();
    if (!query || isLoading) return;

    try {
      setIsLoading(true);
      const proposal = await experienceService.processCommand(worldId, query);
      onClose();
      setPrompt('');
      onProposalGenerated(proposal);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="World Command Bar"
      description={`Customise and transform ${worldName} using natural language prompts.`}
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Command Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <div className="relative flex items-center">
            <Sparkles className="w-5 h-5 text-purple-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Make it a luxury brand, put People first, hide Activity'..."
              className="w-full bg-[#141628] border-2 border-purple-500/40 focus:border-purple-400 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-text-muted outline-none shadow-purple-glow transition-all"
              autoFocus
            />
            <div className="absolute right-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                rightIcon={ArrowRight}
                className="cursor-pointer text-xs"
              >
                Propose
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Example Pills */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Example Customization Prompts</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSubmit(ex)}
                disabled={isLoading}
                className="p-2 px-3 rounded-xl bg-white/[0.03] hover:bg-purple-600/20 border border-white/[0.06] hover:border-purple-500/30 text-left text-text-secondary hover:text-white transition-all cursor-pointer text-xs"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
