import React from 'react';
import { WorldCard } from './WorldCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { World } from '../../../types';
import { Globe, Plus } from 'lucide-react';

export interface WorldGridProps {
  worlds: World[];
  viewMode?: 'grid' | 'list';
  onCreateWorldClick?: () => void;
}

export const WorldGrid: React.FC<WorldGridProps> = ({
  worlds,
  viewMode = 'grid',
  onCreateWorldClick,
}) => {
  if (worlds.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="No AI Worlds Found"
        description="No worlds match your current filter parameters. Deploy a new world to begin multi-agent orchestration."
        actionLabel="Initialize New World"
        onAction={onCreateWorldClick}
        actionIcon={Plus}
      />
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-3'
      }
    >
      {worlds.map((world) => (
        <WorldCard key={world.id} world={world} viewMode={viewMode} />
      ))}
    </div>
  );
};
