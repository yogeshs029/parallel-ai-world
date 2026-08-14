import React, { useEffect, useState } from 'react';
import {
  Save,
  Globe,
  Users,
  CheckSquare,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { permissionService } from '../../../services/permissionService';
import { PersonPermissions } from '../../../types/runtime';

export interface ConfigurePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  personId: string;
  personName: string;
  onUpdated?: () => void;
}

export const ConfigurePermissionsModal: React.FC<ConfigurePermissionsModalProps> = ({
  isOpen,
  onClose,
  worldId,
  personId,
  personName,
  onUpdated,
}) => {
  const toast = useToast();
  const [perms, setPerms] = useState<PersonPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      permissionService
        .getPermissions(worldId, personId)
        .then((p) => {
          setPerms(p);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen, worldId, personId]);

  const toggle = (key: keyof PersonPermissions) => {
    if (!perms) return;
    setPerms({
      ...perms,
      [key]: !perms[key],
    });
  };

  const handleSave = async () => {
    if (!perms) return;
    try {
      setIsSaving(true);
      await permissionService.updatePermissions(worldId, personId, perms);
      toast.success('Permissions updated', `Updated capability permissions for ${personName}.`);
      onClose();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
      toast.error('Update failed', 'Could not save permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!perms && isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading permissions..." size="md">
        <div className="p-8 text-center text-xs text-text-muted">Loading...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permissions for ${personName}`}
      description="Define what actions this persona is permitted to perform inside this world."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={Save}
          >
            Save Permissions
          </Button>
        </>
      }
    >
      {perms && (
        <div className="space-y-4 font-sans max-h-[65vh] overflow-y-auto pr-1">
          {/* Section 1: World */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Globe className="w-4 h-4 text-brand-purple-light" />
              <span>World Actions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.worldView}
                  onChange={() => toggle('worldView')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">View World Context</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.worldEdit}
                  onChange={() => toggle('worldEdit')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <div>
                  <span className="text-text-primary font-medium block">Edit World Metadata</span>
                  <span className="text-[10px] text-text-dim">Escalates to approval if off</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: People */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Users className="w-4 h-4 text-brand-cyan" />
              <span>People & Team</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.peopleView}
                  onChange={() => toggle('peopleView')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">View People</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.peopleCreate}
                  onChange={() => toggle('peopleCreate')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Create People</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.peopleEdit}
                  onChange={() => toggle('peopleEdit')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Edit People</span>
              </label>
            </div>
          </div>

          {/* Section 3: Tasks */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <CheckSquare className="w-4 h-4 text-brand-emerald" />
              <span>Tasks & Projects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.taskCreate}
                  onChange={() => toggle('taskCreate')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Create Tasks</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.taskEdit}
                  onChange={() => toggle('taskEdit')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Edit & Finish Tasks</span>
              </label>
            </div>
          </div>

          {/* Section 4: Knowledge */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <BookOpen className="w-4 h-4 text-brand-amber" />
              <span>Knowledge Base</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.knowledgeView}
                  onChange={() => toggle('knowledgeView')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">View Knowledge</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.knowledgeCreate}
                  onChange={() => toggle('knowledgeCreate')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Add Notes / Docs</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={perms.knowledgeEdit}
                  onChange={() => toggle('knowledgeEdit')}
                  className="rounded text-brand-purple focus:ring-brand-purple"
                />
                <span className="text-text-primary font-medium">Edit / Delete Docs</span>
              </label>
            </div>
          </div>

          {/* Section 5: Messaging */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <MessageSquare className="w-4 h-4 text-brand-purple-light" />
              <span>Proactive Messaging</span>
            </div>
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background-surface border border-border/60 cursor-pointer hover:border-brand-purple/40 transition-colors text-xs">
              <input
                type="checkbox"
                checked={perms.messageUser}
                onChange={() => toggle('messageUser')}
                className="rounded text-brand-purple focus:ring-brand-purple"
              />
              <div>
                <span className="text-text-primary font-medium block">
                  Allow {personName} to initiate messages & task reports
                </span>
                <span className="text-[10px] text-text-dim">
                  Sends conversational updates into chat and creates in-app notifications
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
};
