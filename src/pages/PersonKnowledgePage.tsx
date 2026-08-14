import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  ArrowUpDown,
  User,
  Globe,
} from 'lucide-react';
import { KnowledgeCard } from '../features/knowledge/components/KnowledgeCard';
import { AddKnowledgeModal } from '../features/knowledge/components/AddKnowledgeModal';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { knowledgeService } from '../services/knowledgeService';
import { World, Person } from '../types';
import { KnowledgeSource } from '../types/knowledge';
import { cn } from '../lib/utils';

type SortOption = 'recent' | 'name' | 'type';

export const PersonKnowledgePage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'person' | 'world'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedForDelete, setSelectedForDelete] = useState<KnowledgeSource | null>(null);

  const addDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p, list] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
        knowledgeService.getKnowledgeList(worldId, { personId }),
      ]);
      setWorld(w);
      setPerson(p);
      setSources(list);
    } catch (err) {
      console.error('Failed to load person knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (item: KnowledgeSource) => {
    setSelectedForDelete(item);
    deleteDisclosure.onOpen();
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = sources.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.extractedText && s.extractedText.toLowerCase().includes(q));

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'person' && s.visibility === 'person') ||
        (scopeFilter === 'world' && s.visibility === 'world');

      const matchesType = typeFilter === 'all' || s.type === typeFilter;

      return matchesSearch && matchesScope && matchesType;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [sources, searchQuery, scopeFilter, typeFilter, sortBy]);

  if (isLoading) {
    return <LoadingState message="Opening character library..." />;
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

  const personCount = sources.filter((s) => s.visibility === 'person').length;
  const worldCount = sources.filter((s) => s.visibility === 'world').length;

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
        <span className="text-text-primary font-bold">Knowledge</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3.5">
          <Avatar name={person.name} emoji={personEmoji} size="lg" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
                {person.name}'s Knowledge Library
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light font-bold">
                {sources.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">
              Reference documents and guidelines <strong className="text-text-primary">{person.name}</strong> can look up when answering questions.
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
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              isSearch
              placeholder={`Search ${person.name}'s reference library...`}
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
                <option value="recent" className="bg-background-surface">Recently Added</option>
                <option value="name" className="bg-background-surface">Alphabetical</option>
                <option value="type" className="bg-background-surface">Format</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scope Filter Pills */}
        <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setScopeFilter('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap',
              scopeFilter === 'all'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            All Accessible ({sources.length})
          </button>
          <button
            onClick={() => setScopeFilter('person')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
              scopeFilter === 'person'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <User className="w-3 h-3 text-brand-purple-light" />
            <span>Private to {person.name} ({personCount})</span>
          </button>
          <button
            onClick={() => setScopeFilter('world')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
              scopeFilter === 'world'
                ? 'bg-brand-purple text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Globe className="w-3 h-3 text-brand-cyan" />
            <span>Shared World Knowledge ({worldCount})</span>
          </button>
        </div>
      </div>

      {/* Grid / Empty State */}
      {sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`${person.name} has no knowledge assigned yet.`}
          description="Add technical guides, policies, or notes to give this person reference material."
          actionLabel="Add Knowledge"
          onAction={addDisclosure.onOpen}
          actionIcon={Plus}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No knowledge found"
          description={`No documents or notes matching "${searchQuery}". Try a different keyword.`}
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setScopeFilter('all');
            setTypeFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((item) => (
            <KnowledgeCard
              key={item.id}
              knowledge={item}
              worldId={world.id}
              onDelete={handleDelete}
              showVisibility={scopeFilter === 'all'}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddKnowledgeModal
        isOpen={addDisclosure.isOpen}
        onClose={addDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        personId={person.id}
        personName={person.name}
        onKnowledgeCreated={loadData}
      />

      {selectedForDelete && (
        <DeleteKnowledgeModal
          isOpen={deleteDisclosure.isOpen}
          onClose={() => {
            deleteDisclosure.onClose();
            setSelectedForDelete(null);
          }}
          knowledge={selectedForDelete}
          worldId={world.id}
          onDeleted={loadData}
        />
      )}
    </div>
  );
};
