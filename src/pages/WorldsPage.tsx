import React, { useEffect, useState, useMemo } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WorldCard } from '../features/worlds/components/WorldCard';
import { CreateWorldModal } from '../features/worlds/components/CreateWorldModal';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { World } from '../types';

export const WorldsPage: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const createWorldDisclosure = useDisclosure(false);

  const loadWorlds = async () => {
    try {
      const data = await worldService.getAllWorlds();
      setWorlds(data);
    } catch (err) {
      console.error('Failed to load worlds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorlds();
  }, []);

  const typeFilters: { id: string; label: string }[] = [
    { id: 'all', label: 'All Worlds' },
    { id: 'home', label: '🏠 Home' },
    { id: 'family', label: '👨‍👩‍👧 Family' },
    { id: 'company', label: '🏢 Company' },
    { id: 'business', label: '💼 Business' },
    { id: 'study', label: '📚 Study' },
    { id: 'school', label: '🏫 School' },
    { id: 'game', label: '🎮 Game / Story' },
    { id: 'personal', label: '👤 Personal' },
  ];

  const filteredWorlds = useMemo(() => {
    return worlds.filter((world) => {
      const currentType = world.type || world.category;
      const matchesSearch =
        world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        world.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        world.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === 'all' || currentType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [worlds, searchQuery, selectedType]);

  if (isLoading) {
    return <LoadingState message="Loading your worlds..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="My Worlds"
        subtitle="Create places where people, ideas and intelligence can work together."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={createWorldDisclosure.onOpen}
          >
            Create World
          </Button>
        }
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="w-full sm:w-80">
          <Input
            isSearch
            placeholder="Search worlds by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Categories & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
            {typeFilters.map((flt) => (
              <button
                key={flt.id}
                onClick={() => setSelectedType(flt.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === flt.id
                    ? 'bg-brand-purple text-white shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-background-elevated text-brand-purple-light'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-background-elevated text-brand-purple-light'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* World Cards */}
      {filteredWorlds.length === 0 ? (
        <EmptyState
          title="No worlds found"
          description={
            searchQuery
              ? `No worlds matching "${searchQuery}". Try adjusting your search query.`
              : 'You haven\'t created any worlds in this category yet.'
          }
          actionLabel="Create a World"
          onAction={createWorldDisclosure.onOpen}
          actionIcon={Plus}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorlds.map((world) => (
            <WorldCard key={world.id} world={world} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorlds.map((world) => (
            <WorldCard key={world.id} world={world} viewMode="list" />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
        onWorldCreated={loadWorlds}
      />
    </div>
  );
};
