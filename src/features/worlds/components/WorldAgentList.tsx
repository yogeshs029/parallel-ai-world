import React from 'react';
import { UserPlus, Users } from 'lucide-react';
import { PersonCard } from '../../people/components/PersonCard';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Person } from '../../../types';

export interface WorldAgentListProps {
  agents: Person[];
  onAddAgentClick: () => void;
  onEditPerson?: (person: Person) => void;
  onDuplicatePerson?: (person: Person) => void;
  onDeletePerson?: (person: Person) => void;
}

export const WorldAgentList: React.FC<WorldAgentListProps> = ({
  agents,
  onAddAgentClick,
  onEditPerson,
  onDuplicatePerson,
  onDeletePerson,
}) => {
  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No people in this world yet"
        description="Add intelligent people with specific roles, responsibilities, and personalities to bring this world to life."
        actionLabel="Add First Person"
        onAction={onAddAgentClick}
        actionIcon={UserPlus}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-purple-light" />
          <h3 className="text-sm font-bold text-text-primary">
            People in World ({agents.length})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={UserPlus}
          onClick={onAddAgentClick}
        >
          Add Person
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onEdit={onEditPerson}
            onDuplicate={onDuplicatePerson}
            onDelete={onDeletePerson}
          />
        ))}

        {/* Quick Add Person Card */}
        <button
          onClick={onAddAgentClick}
          className="rounded-2xl border border-dashed border-border hover:border-brand-purple/50 bg-background-surface/40 hover:bg-background-elevated/60 p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[180px]"
        >
          <div className="w-10 h-10 rounded-xl bg-background-elevated border border-border flex items-center justify-center text-text-muted group-hover:text-brand-purple-light group-hover:border-brand-purple/40 transition-colors mb-2">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary">
            + Add Person
          </span>
          <span className="text-[11px] text-text-muted max-w-xs mt-0.5 leading-snug">
            Add another character or helper to this world.
          </span>
        </button>
      </div>
    </div>
  );
};
