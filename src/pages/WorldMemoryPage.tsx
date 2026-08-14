import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Brain, Plus, Search, ArrowUpDown } from 'lucide-react';
import { MemoryCard } from '../features/memory/components/MemoryCard';
import { AddMemoryModal } from '../features/memory/components/AddMemoryModal';
import { EditMemoryModal } from '../features/memory/components/EditMemoryModal';
import { DeleteMemoryModal } from '../features/memory/components/DeleteMemoryModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { memoryService } from '../services/memoryService';
import { World } from '../types';
import { Memory } from '../types/memory';
import { cn } from '../lib/utils';

type SortOption = 'recent' | 'importance' | 'type';

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fact', label: 'Facts' },
  { id: 'goal', label: 'Goals' },
  { id: 'decision', label: 'Decisions' },
  { id: 'event', label: 'Events' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'responsibility', label: 'Responsibilities' },
  { id: 'preference', label: 'Preferences' },
];

export const WorldMemoryPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedForEdit, setSelectedForEdit] = useState<Memory | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Memory | null>(null);

  const addDisclosure = useDisclosure(false);
  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, mems] = await Promise.all([
        worldService.getWorldById(worldId),
        memoryService.getWorldMemories(worldId),
      ]);
      setWorld(w);
      setMemories(mems);
    } catch (err) {
      console.error('Failed to load world memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (memory: Memory) => {
    setSelectedForEdit(memory);
    editDisclosure.onOpen();
  };

  const handleDelete = (memory: Memory) => {
    setSelectedForDelete(memory);
    deleteDisclosure.onOpen();
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = memories.filter((m) => {
      const matchesSearch =
        !q ||
        m.content.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        m.type.toLowerCase().includes(q);

      const matchesType = selectedType === 'all' || m.type === selectedType;

      return matchesSearch && matchesType;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'importance') {
        const impOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return impOrder[b.importance] - impOrder[a.importance];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [memories, searchQuery, selectedType, sortBy]);

  if (isLoading) {
    return <LoadingState message="Loading world knowledge..." />;
  }

  if (!world) {
    return (
      <div className="text-center p-8 space-y-4 font-sans">
        <h2 className="text-xl font-bold">World Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md">
            Return to My Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const worldIcon = world.icon || world.emoji || '✨';

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/worlds" className="hover:text-text-primary transition-colors font-medium">
          My Worlds
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}`}
          className="hover:text-text-primary transition-colors font-semibold flex items-center gap-1"
        >
          <span>{worldIcon}</span>
          <span>{world.name}</span>
        </Link>
        <span>/</span>
        <span className="text-text-primary font-bold">World Knowledge & Memory</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              World Knowledge & Memory
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light font-bold">
              {memories.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary">
            Shared knowledge, facts, and milestones that belong to everyone in <strong className="text-text-primary">{world.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={addDisclosure.onOpen}
          >
            Add Memory
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              isSearch
              placeholder="Search facts, goals, decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-surface border border-border text-xs text-text-secondary">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-background-surface">Recently Created</option>
                <option value="importance" className="bg-background-surface">Importance</option>
                <option value="type" className="bg-background-surface">Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedType(tf.id)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap',
                selectedType === tf.id
                  ? 'bg-brand-purple text-white shadow-xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Grid / Empty State */}
      {memories.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No world knowledge recorded yet."
          description="Add key business facts, project goals, or company principles to remember forever."
          actionLabel="Add First Memory"
          onAction={addDisclosure.onOpen}
          actionIcon={Plus}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No memories found"
          description={`No memories matching "${searchQuery}". Try a different keyword or filter.`}
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedType('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddMemoryModal
        isOpen={addDisclosure.isOpen}
        onClose={addDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        onMemoryCreated={loadData}
      />

      {selectedForEdit && (
        <EditMemoryModal
          isOpen={editDisclosure.isOpen}
          onClose={() => {
            editDisclosure.onClose();
            setSelectedForEdit(null);
          }}
          memory={selectedForEdit}
          onMemoryUpdated={loadData}
        />
      )}

      {selectedForDelete && (
        <DeleteMemoryModal
          isOpen={deleteDisclosure.isOpen}
          onClose={() => {
            deleteDisclosure.onClose();
            setSelectedForDelete(null);
          }}
          memory={selectedForDelete}
          onMemoryDeleted={loadData}
        />
      )}
    </div>
  );
};
