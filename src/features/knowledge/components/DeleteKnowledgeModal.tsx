import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { knowledgeService } from '../../../services/knowledgeService';
import { KnowledgeSource } from '../../../types/knowledge';

export interface DeleteKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledge: KnowledgeSource;
  worldId: string;
  onDeleted?: () => void;
}

export const DeleteKnowledgeModal: React.FC<DeleteKnowledgeModalProps> = ({
  isOpen,
  onClose,
  knowledge,
  worldId,
  onDeleted,
}) => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await knowledgeService.deleteKnowledge(worldId, knowledge.id);
      toast.info('Knowledge removed', `"${knowledge.name}" was removed from the world library.`);
      onClose();
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error(err);
      toast.error('Could not remove knowledge', 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove this knowledge?"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            leftIcon={Trash2}
          >
            Remove Knowledge
          </Button>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-rose-subtle border border-brand-rose/20 text-text-primary">
          <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary">
              {knowledge.name}
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              This knowledge source and its parsed reference chunks will be permanently removed. People in this world will no longer be able to reference it.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
