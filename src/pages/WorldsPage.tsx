import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Users, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { CreateWorldModal } from '../features/worlds/components/CreateWorldModal';
import { DeleteWorldModal } from '../features/worlds/components/DeleteWorldModal';
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
  const [deletingWorld, setDeletingWorld] = useState<World | null>(null);

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
    window.addEventListener('parallel:world_deleted', loadWorlds);
    window.addEventListener('parallel:world_created', loadWorlds);
    return () => {
      window.removeEventListener('parallel:world_deleted', loadWorlds);
      window.removeEventListener('parallel:world_created', loadWorlds);
    };
  }, []);

  const typeFilters = [
    { id: 'all', label: 'All Worlds' },
    { id: 'company', label: '🏢 Company' },
    { id: 'home', label: '🏠 Home' },
    { id: 'study', label: '📚 Study' },
    { id: 'creative', label: '🎨 Creative' },
    { id: 'business', label: '💼 Business' },
  ];

  const filteredWorlds = useMemo(() => {
    return worlds.filter((world) => {
      const currentType = world.type || world.category;
      const matchesSearch =
        world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (world.description && world.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === 'all' || currentType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [worlds, searchQuery, selectedType]);

  const totalPeople = useMemo(() => {
    return worlds.reduce((acc, w) => acc + (w.memberCount ?? w.peopleCount ?? 0), 0);
  }, [worlds]);

  if (isLoading) {
    return <LoadingState message="Loading Worlds..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* ── TOP BANNER & METRICS RIBBON ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121426] via-[#16182E] to-[#0F101E] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Parallel Worlds Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Worlds
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
              Isolated AI environments where autonomous agents collaborate, solve problems, and achieve goals.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={createWorldDisclosure.onOpen}
            className="shadow-purple-glow cursor-pointer self-start sm:self-auto"
          >
            Create World
          </Button>
        </div>

        {/* Quick Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Total Worlds</span>
            <span className="text-lg font-black text-white">{worlds.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Active People</span>
            <span className="text-lg font-black text-emerald-400">{totalPeople} Members</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">Status</span>
            <span className="text-lg font-black text-purple-300">{worlds.length > 0 ? 'Active' : 'Empty'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] text-text-muted font-semibold block">System Health</span>
            <span className="text-lg font-black text-cyan-400">{worlds.length > 0 ? '100%' : '—'}</span>
          </div>
        </div>
      </div>

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

        {/* Category Pills & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-[#121426] p-1 rounded-2xl border border-white/[0.08] overflow-x-auto no-scrollbar">
            {typeFilters.map((flt) => (
              <button
                key={flt.id}
                onClick={() => setSelectedType(flt.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === flt.id
                    ? 'bg-purple-600 text-white shadow-purple-glow'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#121426] p-1 rounded-2xl border border-white/[0.08] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-purple-600/30 text-purple-300'
                  : 'text-text-muted hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-purple-600/30 text-purple-300'
                  : 'text-text-muted hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* World Cards Grid */}
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
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
          {filteredWorlds.map((world) => {
            const name = world.name;
            const description = world.description || 'Active AI World';
            const peopleCount = world.memberCount ?? world.peopleCount ?? 0;
            const icon = world.icon || world.emoji || '🌐';

            return (
              <div key={world.id} className="group">
                <Card
                  variant="glass"
                  className="h-full flex flex-col justify-between hover:border-purple-500/50 transition-all duration-200 overflow-hidden shadow-xl"
                >
                  <div>
                    {/* Cover Header */}
                    <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#1A1C30] to-[#0E1020] flex items-center justify-center p-4">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        {icon}
                      </div>

                      <div className="absolute top-3 right-3">
                        <Badge variant="working" size="sm" dot>
                          Active
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="p-5 pt-3.5 pb-2">
                      <CardTitle className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                        {name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs text-text-secondary leading-relaxed font-sans mt-1">
                        {description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 pt-1 pb-4">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-medium">
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                        <Link to={`/world/${world.id}`} className="flex-1">
                          <Button variant="primary" size="sm" rightIcon={ArrowRight} className="w-full cursor-pointer">
                            Enter World
                          </Button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingWorld(world)}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/30 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete World Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
        onWorldCreated={loadWorlds}
      />

      {/* Delete World Modal */}
      {deletingWorld && (
        <DeleteWorldModal
          isOpen={!!deletingWorld}
          onClose={() => setDeletingWorld(null)}
          world={deletingWorld}
          onWorldDeleted={loadWorlds}
        />
      )}
    </div>
  );
};

export default WorldsPage;
