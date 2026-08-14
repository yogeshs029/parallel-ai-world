import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  ArrowUpDown,
  FileText,
  StickyNote,
  Globe,
} from 'lucide-react';
import { KnowledgeCard } from '../features/knowledge/components/KnowledgeCard';
import { AddKnowledgeModal } from '../features/knowledge/components/AddKnowledgeModal';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { worldService } from '../services/worldService';
import { knowledgeService } from '../services/knowledgeService';
import { World } from '../types';
import { KnowledgeSource } from '../types/knowledge';
import { cn } from '../lib/utils';

type SortOption = 'recent' | 'name' | 'type';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Knowledge' },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'note', label: 'Notes', icon: StickyNote },
  { id: 'url', label: 'Web Pages', icon: Globe },
];

export const WorldKnowledgePage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedForDelete, setSelectedForDelete] = useState<KnowledgeSource | null>(null);

  const addDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, list] = await Promise.all([
        worldService.getWorldById(worldId),
        knowledgeService.getKnowledgeList(worldId, { visibility: 'world' }),
      ]);
      setWorld(w);
      setSources(list);
    } catch (err) {
      console.error('Failed to load world knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

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

      const matchesType = selectedType === 'all' || s.type === selectedType;

      return matchesSearch && matchesType;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [sources, searchQuery, selectedType, sortBy]);

  if (isLoading) {
    return <LoadingState message="Opening world library..." />;
  }

  if (!world) {
    return (
      <div className="text-center p-8 space-y-4 font-sans">
        <h2 className="text-xl font-bold">World Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md">
            Return to Worlds
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
        <span className="text-text-primary font-bold">Knowledge</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              Knowledge Library
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light font-bold">
              {sources.length} sources
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary">
            Give your world the information it needs. Reference documents, notes, and catalogs available to everyone in <strong className="text-text-primary">{world.name}</strong>.
          </p>
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
              placeholder="Search documents, notes, guides..."
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

        {/* Format Filter Pills */}
        <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedType(tf.id)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                selectedType === tf.id
                  ? 'bg-brand-purple text-white shadow-xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tf.icon && <tf.icon className="w-3.5 h-3.5" />}
              <span>{tf.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Grid / Empty State */}
      {sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your world is ready to learn."
          description="Add documents, notes, product catalogs, or web pages your people can reference when answering questions."
          actionLabel="Add Knowledge"
          onAction={addDisclosure.onOpen}
          actionIcon={Plus}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No knowledge found"
          description={`No documents or notes matching "${searchQuery}". Try a different keyword or filter.`}
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedType('all');
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
