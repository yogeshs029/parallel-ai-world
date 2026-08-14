import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { worldService } from '../../../services/worldService';
import { World } from '../../../types';

export interface DeleteWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: World;
  onWorldDeleted?: () => void;
}

export const DeleteWorldModal: React.FC<DeleteWorldModalProps> = ({
  isOpen,
  onClose,
  world,
  onWorldDeleted,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await worldService.deleteWorld(world.id);
      toast.info('World deleted', `'${world.name}' was removed from your session.`);
      onClose();
      if (onWorldDeleted) {
        onWorldDeleted();
      }
      navigate('/worlds');
    } catch (err) {
      console.error(err);
      toast.error('Could not delete world', 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete this world?"
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
            Delete World
          </Button>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-rose-subtle border border-brand-rose/20 text-text-primary">
          <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              This will remove <strong className="text-text-primary">"{world.name}"</strong> from your current session.
            </p>
            <p className="text-[11px] text-text-muted">
              Any associated people, tasks, and notes in this world will also be removed.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
