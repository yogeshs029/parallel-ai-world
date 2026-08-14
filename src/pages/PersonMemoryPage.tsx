import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Brain, Plus, Search, ArrowUpDown, User, Globe } from 'lucide-react';
import { MemoryCard } from '../features/memory/components/MemoryCard';
import { AddMemoryModal } from '../features/memory/components/AddMemoryModal';
import { EditMemoryModal } from '../features/memory/components/EditMemoryModal';
import { DeleteMemoryModal } from '../features/memory/components/DeleteMemoryModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { memoryService } from '../services/memoryService';
import { World, Person } from '../types';
import { Memory } from '../types/memory';
import { cn } from '../lib/utils';

type SortOption = 'recent' | 'importance' | 'type';

export const PersonMemoryPage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'person' | 'world'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedForEdit, setSelectedForEdit] = useState<Memory | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Memory | null>(null);

  const addDisclosure = useDisclosure(false);
  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p, mems] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
        memoryService.getMemories(worldId, { personId }),
      ]);
      setWorld(w);
      setPerson(p);
      setMemories(mems);
    } catch (err) {
      console.error('Failed to load person memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

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

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'person' && m.scope === 'person') ||
        (scopeFilter === 'world' && m.scope === 'world');

      return matchesSearch && matchesScope;
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
  }, [memories, searchQuery, scopeFilter, sortBy]);

  if (isLoading) {
    return <LoadingState message="Loading character memories..." />;
  }

  if (!world || !person) {
    return (
      <div className="text-center p-8 space-y-4 font-sans">
        <h2 className="text-xl font-bold">Person Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md">
            Return to Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const worldIcon = world.icon || world.emoji || '✨';
  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';

  const personCount = memories.filter((m) => m.scope === 'person').length;
  const worldCount = memories.filter((m) => m.scope === 'world').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
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
        <Link
          to={`/world/${world.id}/people`}
          className="hover:text-text-primary transition-colors font-medium"
        >
          People
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}/people/${person.id}`}
          className="hover:text-text-primary transition-colors font-semibold"
        >
          {person.name}
        </Link>
        <span>/</span>
        <span className="text-text-primary font-bold">Memory</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3.5">
          <Avatar name={person.name} emoji={personEmoji} size="lg" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
                {person.name}'s Memory
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light font-bold">
                {memories.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">
              Everything <strong className="text-text-primary">{person.name}</strong> remembers about your world, projects, and preferences.
            </p>
          </div>
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
              placeholder={`Search ${person.name}'s memories...`}
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

        {/* Scope Filter Pills */}
        <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setScopeFilter('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer',
              scopeFilter === 'all'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            All Knowledge ({memories.length})
          </button>
          <button
            onClick={() => setScopeFilter('person')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              scopeFilter === 'person'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <User className="w-3 h-3 text-brand-purple-light" />
            <span>Personal Memories ({personCount})</span>
          </button>
          <button
            onClick={() => setScopeFilter('world')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              scopeFilter === 'world'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Globe className="w-3 h-3 text-brand-cyan" />
            <span>World Knowledge ({worldCount})</span>
          </button>
        </div>
      </div>

      {/* Memory Grid / Empty State */}
      {memories.length === 0 ? (
        <EmptyState
          icon={Brain}
          title={`${person.name} has no saved memories yet.`}
          description="Things you discuss in conversation or add manually will be remembered here."
          actionLabel="Add Memory"
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
            setScopeFilter('all');
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
              showScope={scopeFilter === 'all'}
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
        personId={person.id}
        personName={person.name}
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
