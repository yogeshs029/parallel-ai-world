import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, Users, ArrowUpDown } from 'lucide-react';
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
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { World, Person } from '../types';

type SortOption = 'recent' | 'name' | 'role' | 'status';

export const WorldPeoplePage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [presetRole, setPresetRole] = useState<string>('');

  const [selectedPersonForEdit, setSelectedPersonForEdit] = useState<Person | null>(null);
  const [selectedPersonForDelete, setSelectedPersonForDelete] = useState<Person | null>(null);

  const createDisclosure = useDisclosure(false);
  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, p] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
      ]);
      setWorld(w);
      setPeople(p);
    } catch (err) {
      console.error('Failed to load world people:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

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
    if (!worldId) return;
    try {
      const copy = await peopleService.duplicatePerson(worldId, person.id);
      if (copy) {
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}' with matching traits.`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const handleRolePreset = (roleTitle: string) => {
    setPresetRole(roleTitle);
    createDisclosure.onOpen();
  };

  const filteredAndSortedPeople = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = people.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q)) ||
        p.responsibilities.some((r) => r.toLowerCase().includes(q))
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [people, searchQuery, sortBy]);

  if (isLoading) {
    return <LoadingState message="Loading people in this world..." />;
  }

  if (!world) {
    return (
      <div className="space-y-4 font-sans text-center p-8">
        <h2 className="text-xl font-bold">World Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md">
            Return to My Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const icon = world.icon || world.emoji || '✨';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          to="/worlds"
          className="hover:text-text-primary transition-colors font-medium"
        >
          My Worlds
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}`}
          className="hover:text-text-primary transition-colors font-semibold flex items-center gap-1"
        >
          <span>{icon}</span>
          <span>{world.name}</span>
        </Link>
        <span>/</span>
        <span className="text-text-primary font-bold">People</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              People
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light font-bold">
              {people.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary">
            Build the people who bring <strong className="text-text-primary">{world.name}</strong> to life.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            onClick={() => {
              setPresetRole('');
              createDisclosure.onOpen();
            }}
          >
            Add Person
          </Button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      {people.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="w-full sm:w-80">
            <Input
              isSearch
              placeholder="Search people by name, role, or skills..."
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
                <option value="name" className="bg-background-surface">Name</option>
                <option value="role" className="bg-background-surface">Role</option>
                <option value="status" className="bg-background-surface">Status</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* People Grid or Empty State */}
      {people.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            icon={Users}
            title="Your world is waiting for its first person."
            description="Create someone with a role, personality, and responsibilities to bring this world to life."
            actionLabel="Add Person"
            onAction={() => {
              setPresetRole('');
              createDisclosure.onOpen();
            }}
            actionIcon={UserPlus}
          />

          {/* Role Suggestions / Quick Starters */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border/70 text-center space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Or start with a common role:
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Lead Developer', 'Designer', 'Marketing Lead', 'Family Organizer', 'Project Coordinator', 'Research Partner'].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRolePreset(r)}
                  className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-purple/20 border border-border hover:border-brand-purple/40 text-xs font-medium text-text-secondary hover:text-brand-purple-light transition-all cursor-pointer"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : filteredAndSortedPeople.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people matching your search"
          description={`No one found matching "${searchQuery}". Try a different name, role, or skill.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
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
        worldId={world.id}
        worldName={world.name}
        initialRole={presetRole}
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
