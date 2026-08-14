import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { peopleService } from '../../../services/peopleService';
import { Person } from '../../../types';

export interface DeletePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onPersonDeleted?: () => void;
}

export const DeletePersonModal: React.FC<DeletePersonModalProps> = ({
  isOpen,
  onClose,
  person,
  onPersonDeleted,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await peopleService.deletePerson(person.worldId, person.id);
      toast.info('Person removed', `${person.name} was removed from this world.`);
      onClose();
      if (onPersonDeleted) {
        onPersonDeleted();
      }
      navigate(`/world/${person.worldId}/people`);
    } catch (err) {
      console.error(err);
      toast.error('Could not remove person', 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Remove ${person.name} from this world?`}
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
            Remove Person
          </Button>
        </>
      }
    >
      <div className="space-y-3 font-sans">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-rose-subtle border border-brand-rose/20 text-text-primary">
          <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">{person.name} ({person.role})</strong> will be removed from this world.
            </p>
            <p className="text-[11px] text-text-muted">
              Any assigned tasks will remain in the world but become unassigned.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
