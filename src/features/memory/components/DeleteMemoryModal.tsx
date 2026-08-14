import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { memoryService } from '../../../services/memoryService';
import { Memory } from '../../../types/memory';

export interface DeleteMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  onMemoryDeleted?: () => void;
}

export const DeleteMemoryModal: React.FC<DeleteMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onMemoryDeleted,
}) => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await memoryService.deleteMemory(memory.worldId, memory.id);
      toast.info('Memory forgotten', 'The memory was removed from persistent storage.');
      onClose();
      if (onMemoryDeleted) {
        onMemoryDeleted();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not remove memory', 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forget this memory?"
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
            Forget Memory
          </Button>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-rose-subtle border border-brand-rose/20 text-text-primary">
          <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              "{memory.content}"
            </p>
            <p className="text-[11px] text-text-muted">
              This memory will be permanently removed and no longer recalled during conversations.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
