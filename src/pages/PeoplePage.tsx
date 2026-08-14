import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { UserPlus, Users, ArrowUpDown } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PersonCard } from '../features/people/components/PersonCard';
import { CreatePersonModal } from '../features/people/components/CreatePersonModal';
import { EditPersonModal } from '../features/people/components/EditPersonModal';
import { DeletePersonModal } from '../features/people/components/DeletePersonModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { peopleService } from '../services/peopleService';
import { worldService } from '../services/worldService';
import { Person, World } from '../types';

type SortOption = 'recent' | 'name' | 'role' | 'status';

export const PeoplePage: React.FC = () => {
  const toast = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorldId, setSelectedWorldId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedPersonForEdit, setSelectedPersonForEdit] = useState<Person | null>(null);
  const [selectedPersonForDelete, setSelectedPersonForDelete] = useState<Person | null>(null);

  const createDisclosure = useDisclosure(false);
  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [p, w] = await Promise.all([
        peopleService.getAllPeople(),
        worldService.getAllWorlds(),
      ]);
      setPeople(p);
      setWorlds(w);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (person: Person) => {
    setSelectedPersonForEdit(person);
    editDisclosure.onOpen();
  };

  const handleDelete = (person: Person) => {
    setSelectedPersonForDelete(person);
    deleteDisclosure.onOpen();
  };

  const handleDuplicate = async (person: Person) => {
    try {
      const copy = await peopleService.duplicatePerson(person.worldId, person.id);
      if (copy) {
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}' with matching configuration.`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'available', label: '🟢 Available' },
    { id: 'busy', label: '🟡 Busy' },
    { id: 'away', label: '🟠 Away' },
    { id: 'offline', label: '⚪ Offline' },
  ];

  const filteredAndSortedPeople = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = people.filter((person) => {
      const matchesSearch =
        !q ||
        person.name.toLowerCase().includes(q) ||
        person.role.toLowerCase().includes(q) ||
        (person.worldName && person.worldName.toLowerCase().includes(q)) ||
        person.description.toLowerCase().includes(q) ||
        person.skills.some((k) => k.toLowerCase().includes(q)) ||
        person.responsibilities.some((r) => r.toLowerCase().includes(q));

      const matchesWorld =
        selectedWorldId === 'all' || person.worldId === selectedWorldId;

      const matchesStatus =
        selectedStatus === 'all' || person.status === selectedStatus;

      return matchesSearch && matchesWorld && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [people, searchQuery, selectedWorldId, selectedStatus, sortBy]);

  if (isLoading) {
    return <LoadingState message="Loading people directory..." />;
  }

  const activeTargetWorldId =
    selectedWorldId !== 'all' ? selectedWorldId : worlds[0]?.id || 'world-company';
  const activeTargetWorldName =
    worlds.find((w) => w.id === activeTargetWorldId)?.name || 'My World';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="People"
        description="All intelligent people and helpers across your worlds."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            onClick={createDisclosure.onOpen}
          >
            Add Person
          </Button>
        }
      />

      {/* World & Status Filters */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full md:w-80">
            <Input
              isSearch
              placeholder="Search by name, role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-surface border border-border text-xs text-text-secondary">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-background-surface">Recently Created</option>
                <option value="name" className="bg-background-surface">Name</option>
                <option value="role" className="bg-background-surface">Role</option>
                <option value="status" className="bg-background-surface">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* World Filter */}
          <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedWorldId('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                selectedWorldId === 'all'
                  ? 'bg-brand-purple text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Worlds ({people.length})
            </button>
            {worlds.map((w) => {
              const count = people.filter((p) => p.worldId === w.id).length;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorldId(w.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    selectedWorldId === w.id
                      ? 'bg-brand-purple text-white shadow-sm font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{w.icon || w.emoji}</span>
                  <span>{w.name} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-background-surface p-1 rounded-xl border border-border overflow-x-auto no-scrollbar">
            {statuses.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-brand-purple text-white shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* People Grid */}
      {filteredAndSortedPeople.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people found"
          description={
            searchQuery
              ? `No one matching "${searchQuery}". Try adjusting your search query or filters.`
              : 'Add intelligent people to your worlds to get started.'
          }
          actionLabel="Add Person"
          onAction={createDisclosure.onOpen}
          actionIcon={UserPlus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePersonModal
        isOpen={createDisclosure.isOpen}
        onClose={createDisclosure.onClose}
        worldId={activeTargetWorldId}
        worldName={activeTargetWorldName}
        onPersonCreated={loadData}
      />

      {selectedPersonForEdit && (
        <EditPersonModal
          isOpen={editDisclosure.isOpen}
          onClose={() => {
            editDisclosure.onClose();
            setSelectedPersonForEdit(null);
          }}
          person={selectedPersonForEdit}
          onPersonUpdated={loadData}
        />
      )}

      {selectedPersonForDelete && (
        <DeletePersonModal
          isOpen={deleteDisclosure.isOpen}
          onClose={() => {
            deleteDisclosure.onClose();
            setSelectedPersonForDelete(null);
          }}
          person={selectedPersonForDelete}
          onPersonDeleted={loadData}
        />
      )}
    </div>
  );
};
