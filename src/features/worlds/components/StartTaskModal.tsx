import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { taskService } from '../../../services/taskService';
import { TaskPriority, Person } from '../../../types';
import { cn } from '../../../lib/utils';

export interface StartTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName?: string;
  agents: Person[];
  onTaskStarted?: () => void;
}

export const StartTaskModal: React.FC<StartTaskModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName,
  agents,
  onTaskStarted,
}) => {
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('General');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedPersonId, setAssignedPersonId] = useState<string>('');
  const [dueDate, setDueDate] = useState('This week');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const assignedPerson = agents.find((a) => a.id === assignedPersonId);

      await taskService.createTask({
        worldId,
        worldName,
        projectName: projectName.trim() || 'General',
        title: title.trim(),
        description: description.trim() || 'Work on this task to completion.',
        priority,
        assignedPersonId: assignedPersonId || undefined,
        assignedPersonName: assignedPerson ? assignedPerson.name : undefined,
        assignedPersonEmoji: assignedPerson ? assignedPerson.avatarEmoji : '👤',
        dueDate,
      });

      setTitle('');
      setDescription('');
      setAssignedPersonId('');
      onClose();
      if (onTaskStarted) {
        onTaskStarted();
      }
    } catch (err) {
      console.error(err);
      setError('Could not create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities: { id: TaskPriority; label: string; color: string }[] = [
    { id: 'low', label: 'Low', color: 'border-border hover:border-slate-500' },
    { id: 'medium', label: 'Medium', color: 'border-amber-500/40 hover:border-amber-400' },
    { id: 'high', label: 'High Priority', color: 'border-rose-500/40 hover:border-rose-400' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new task"
      description="Assign responsibilities and keep your world's projects moving forward."
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
            leftIcon={CheckSquare}
          >
            Create Task
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

        <Input
          label="Task Title"
          placeholder="e.g. Design website homepage, Research competitors, Order groceries"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Project Name"
            placeholder="e.g. Website Launch, Home Chores"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Input
            label="Due By"
            placeholder="e.g. Today, Tomorrow, Friday"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Assign to a Person
          </label>
          <select
            value={assignedPersonId}
            onChange={(e) => setAssignedPersonId(e.target.value)}
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
          >
            <option value="">Anyone available</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.avatarEmoji} {a.name} — {a.role}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {priorities.map((p) => {
              const isSelected = priority === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    'p-2 rounded-xl text-xs font-medium border transition-all text-center',
                    isSelected
                      ? 'bg-brand-purple/20 border-brand-purple text-brand-purple-light font-semibold'
                      : 'bg-background-elevated text-text-secondary hover:text-text-primary',
                    p.color,
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Notes & Details</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any specific guidelines, links, or expectations..."
            className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans"
          />
        </div>
      </form>
    </Modal>
  );
};
