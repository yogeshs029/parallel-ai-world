import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { UserPlus, Users, Plus } from 'lucide-react';
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

export const PeoplePage: React.FC = () => {
  const toast = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'offline'>('all');

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

      setWorlds(w);
      setPeople(p);
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
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}'.`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const filteredPeople = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return people.filter((person) => {
      const matchesSearch =
        !q ||
        person.name.toLowerCase().includes(q) ||
        person.role.toLowerCase().includes(q) ||
        (person.description && person.description.toLowerCase().includes(q));

      const isOffline = person.status === 'offline';
      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && !isOffline) ||
        (selectedStatusFilter === 'offline' && isOffline);

      return matchesSearch && matchesStatus;
    });
  }, [people, searchQuery, selectedStatusFilter]);

  if (isLoading) return <LoadingState message="Loading People directory..." />;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
            People
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage AI agents, teammates, and specialized assistants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={createDisclosure.onOpen}
            className="shadow-purple-glow cursor-pointer"
          >
            Add Person
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'offline'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
                selectedStatusFilter === status
                  ? 'bg-purple-600 text-white shadow-purple-glow'
                  : 'bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] hover:text-white border border-white/[0.08]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            isSearch
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      {/* People Roster Grid */}
      {filteredPeople.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people found"
          description={
            searchQuery
              ? `No one matching "${searchQuery}".`
              : 'Add intelligent people to your worlds to get started.'
          }
          actionLabel="Add Person"
          onAction={createDisclosure.onOpen}
          actionIcon={UserPlus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
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
        worldId={worlds[0]?.id || 'w-company'}
        worldName={worlds[0]?.name || 'My World'}
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
