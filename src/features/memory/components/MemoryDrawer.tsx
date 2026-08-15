import React, { useState, useEffect, useCallback } from 'react';
import { Brain, X, Plus, Trash2, Globe, User } from 'lucide-react';
import { MemoryCard } from './MemoryCard';
import { AddMemoryModal } from './AddMemoryModal';
import { EditMemoryModal } from './EditMemoryModal';
import { DeleteMemoryModal } from './DeleteMemoryModal';
import { Button } from '../../../components/ui/Button';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useToast } from '../../../hooks/useToast';
import { memoryService } from '../../../services/memoryService';
import { Memory } from '../../../types/memory';
import { Person, World } from '../../../types';
import { cn } from '../../../lib/utils';

export interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  world: World;
  person: Person;
  onMemoryChanged?: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  world,
  person,
  onMemoryChanged,
}) => {
  const toast = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filterScope, setFilterScope] = useState<'all' | 'person' | 'world'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedForEdit, setSelectedForEdit] = useState<Memory | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Memory | null>(null);

  const addDisclosure = useDisclosure(false);
  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await memoryService.getMemories(world.id, { personId: person.id });
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [world.id, person.id]);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, loadMemories]);

  const handleEdit = (mem: Memory) => {
    setSelectedForEdit(mem);
    editDisclosure.onOpen();
  };

  const handleDelete = (mem: Memory) => {
    setSelectedForDelete(mem);
    deleteDisclosure.onOpen();
  };

  const handleClearPersonMemories = async () => {
    if (window.confirm(`Forget everything ${person.name} personally remembers?`)) {
      try {
        await memoryService.clearPersonMemories(world.id, person.id);
        toast.info(`Cleared ${person.name}'s memories`, 'Personal memories have been reset.');
        loadMemories();
        if (onMemoryChanged) onMemoryChanged();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (filterScope === 'person') return m.scope === 'person';
    if (filterScope === 'world') return m.scope === 'world';
    return true;
  });

  const personMemoriesCount = memories.filter((m) => m.scope === 'person').length;
  const worldMemoriesCount = memories.filter((m) => m.scope === 'world').length;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9998] animate-fade-in transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[440px] md:w-[480px] bg-[#121426] border-l border-white/[0.12] shadow-2xl flex flex-col animate-slide-left font-sans">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-background-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-purple-light">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-primary">
                {person.name}'s Memory
              </h3>
              <p className="text-[11px] text-text-muted">
                Persistent knowledge recalled during conversations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-background-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Filter Pills */}
        <div className="p-3 sm:p-4 border-b border-border/60 space-y-3 shrink-0 bg-background-surface/80">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={addDisclosure.onOpen}
              className="flex-1"
            >
              Add Memory
            </Button>

            {personMemoriesCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={Trash2}
                onClick={handleClearPersonMemories}
                className="text-text-muted hover:text-brand-rose"
                title="Forget personal memories"
              >
                Forget All
              </Button>
            )}
          </div>

          {/* Scope Filters */}
          <div className="flex items-center gap-1 bg-background-elevated p-1 rounded-xl border border-border">
            <button
              onClick={() => setFilterScope('all')}
              className={cn(
                'flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
                filterScope === 'all'
                  ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              All ({memories.length})
            </button>
            <button
              onClick={() => setFilterScope('person')}
              className={cn(
                'flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1',
                filterScope === 'person'
                  ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              <User className="w-3 h-3 text-brand-purple-light" />
              <span>Personal ({personMemoriesCount})</span>
            </button>
            <button
              onClick={() => setFilterScope('world')}
              className={cn(
                'flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1',
                filterScope === 'world'
                  ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              <Globe className="w-3 h-3 text-brand-cyan" />
              <span>World ({worldMemoriesCount})</span>
            </button>
          </div>
        </div>

        {/* Memory List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Loading memories...
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-background-elevated border border-border flex items-center justify-center text-xl mx-auto">
                🧠
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-primary">
                  No memories saved yet
                </h4>
                <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                  Facts, goals, and preferences discussed in chat or added manually will appear here.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={Plus}
                onClick={addDisclosure.onOpen}
              >
                Add First Memory
              </Button>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <MemoryCard
                key={mem.id}
                memory={mem}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showScope={filterScope === 'all'}
              />
            ))
          )}
        </div>

        {/* Modals */}
        <AddMemoryModal
          isOpen={addDisclosure.isOpen}
          onClose={addDisclosure.onClose}
          worldId={world.id}
          worldName={world.name}
          personId={person.id}
          personName={person.name}
          onMemoryCreated={() => {
            loadMemories();
            if (onMemoryChanged) onMemoryChanged();
          }}
        />

        {selectedForEdit && (
          <EditMemoryModal
            isOpen={editDisclosure.isOpen}
            onClose={() => {
              editDisclosure.onClose();
              setSelectedForEdit(null);
            }}
            memory={selectedForEdit}
            onMemoryUpdated={() => {
              loadMemories();
              if (onMemoryChanged) onMemoryChanged();
            }}
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
            onMemoryDeleted={() => {
              loadMemories();
              if (onMemoryChanged) onMemoryChanged();
            }}
          />
        )}
      </div>
    </>
  );
};
