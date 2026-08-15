import React, { useEffect, useState } from 'react';
import {
  History,
  RotateCcw,
  X,
} from 'lucide-react';
import { WorldExperienceVersion, WorldExperience } from '../../../types/experience';
import { experienceService } from '../../../services/experienceService';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';

export interface WorldVersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  onRestored: (exp: WorldExperience) => void;
}

export const WorldVersionHistoryDrawer: React.FC<WorldVersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  worldId,
  onRestored,
}) => {
  const toast = useToast();
  const [versions, setVersions] = useState<WorldExperienceVersion[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isOpen || !worldId) return;
      try {
        const list = await experienceService.listVersions(worldId);
        setVersions(list);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [isOpen, worldId]);

  if (!isOpen) return null;

  const handleUndo = async () => {
    try {
      setIsUndoing(true);
      const restored = await experienceService.undo(worldId);
      onRestored(restored);
      toast.success('Version Restored', 'Reverted World experience to previous revision.');
      onClose();
    } catch (e) {
      toast.error('Undo Failed', 'Could not revert to previous revision.');
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[#0C0E1A] border-l border-white/[0.08] shadow-2xl p-5 flex flex-col justify-between h-full z-10 animate-slide-left">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-black text-white">Experience Revisions</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <span className="text-xs text-purple-200">Revert last change</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              isLoading={isUndoing}
              leftIcon={RotateCcw}
              className="border-purple-500/40 text-purple-300 hover:text-white cursor-pointer text-xs"
            >
              Undo
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1">
            {versions.length === 0 ? (
              <p className="text-xs text-text-muted italic py-4 text-center">
                No past revisions found.
              </p>
            ) : (
              versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="p-3 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Version #{ver.versionNumber}</span>
                    <span className="text-[10px] text-text-muted">{idx === 0 ? 'Current' : 'Snapshot'}</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    {ver.reason}
                  </p>
                  <div className="text-[10px] text-text-muted pt-1">
                    {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
