import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckSquare,
  BookOpen,
  Activity,
  Sparkles,
  Plus,
  UserPlus,
  ArrowRight,
  Brain,
  ShieldAlert,
  MessageSquare,
  Settings,
  Target,
  SlidersHorizontal,
} from 'lucide-react';
import { WorldMetrics } from '../features/worlds/components/WorldMetrics';
import { WorldTaskQueue } from '../features/worlds/components/WorldTaskQueue';
import { ActivityTimeline } from '../features/dashboard/components/ActivityTimeline';
import { PersonCard } from '../features/people/components/PersonCard';
import { CreatePersonModal } from '../features/people/components/CreatePersonModal';
import { EditPersonModal } from '../features/people/components/EditPersonModal';
import { DeletePersonModal } from '../features/people/components/DeletePersonModal';
import { StartTaskModal } from '../features/worlds/components/StartTaskModal';
import { EditWorldModal } from '../features/worlds/components/EditWorldModal';
import { DeleteWorldModal } from '../features/worlds/components/DeleteWorldModal';
import { MemoryCard } from '../features/memory/components/MemoryCard';
import { AddMemoryModal } from '../features/memory/components/AddMemoryModal';
import { EditMemoryModal } from '../features/memory/components/EditMemoryModal';
import { DeleteMemoryModal } from '../features/memory/components/DeleteMemoryModal';
import { KnowledgeCard } from '../features/knowledge/components/KnowledgeCard';
import { AddKnowledgeModal } from '../features/knowledge/components/AddKnowledgeModal';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { ApprovalCard } from '../features/approvals/components/ApprovalCard';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { taskService } from '../services/taskService';
import { activityService } from '../services/activityService';
import { memoryService } from '../services/memoryService';
import { knowledgeService } from '../services/knowledgeService';
import { approvalService } from '../services/approvalService';
import { World, Person, Task, ActivityLog } from '../types';
import { Memory } from '../types/memory';
import { KnowledgeSource } from '../types/knowledge';
import { ApprovalRequest } from '../types/runtime';

export const WorldDetailPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSource[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [selectedPersonForEdit, setSelectedPersonForEdit] = useState<Person | null>(null);
  const [selectedPersonForDelete, setSelectedPersonForDelete] = useState<Person | null>(null);
  const [selectedMemoryForEdit, setSelectedMemoryForEdit] = useState<Memory | null>(null);
  const [selectedMemoryForDelete, setSelectedMemoryForDelete] = useState<Memory | null>(null);
  const [selectedKnowledgeForDelete, setSelectedKnowledgeForDelete] = useState<KnowledgeSource | null>(null);

  const addPersonDisclosure = useDisclosure(false);
  const editPersonDisclosure = useDisclosure(false);
  const deletePersonDisclosure = useDisclosure(false);
  const startTaskDisclosure = useDisclosure(false);
  const editWorldDisclosure = useDisclosure(false);
  const deleteWorldDisclosure = useDisclosure(false);
  const addMemoryDisclosure = useDisclosure(false);
  const editMemoryDisclosure = useDisclosure(false);
  const deleteMemoryDisclosure = useDisclosure(false);
  const addKnowledgeDisclosure = useDisclosure(false);
  const deleteKnowledgeDisclosure = useDisclosure(false);

  const loadWorldData = useCallback(async () => {
    if (!worldId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setIsNotFound(false);
      const [w, p, t, a, mems, kList, apps] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
        taskService.getTasksByWorldId(worldId),
        activityService.getActivitiesByWorldId(worldId),
        memoryService.getWorldMemories(worldId),
        knowledgeService.getKnowledgeList(worldId, { visibility: 'world' }),
        approvalService.getApprovals(worldId, 'pending'),
      ]);

      if (!w) {
        setIsNotFound(true);
        return;
      }

      setWorld({
        ...w,
        memberCount: p.length,
        peopleCount: p.length,
        activeTaskCount: t.filter((task) => task.status !== 'completed').length,
        activeTasksCount: t.filter((task) => task.status !== 'completed').length,
      });
      setPeople(p);
      setTasks(t);
      setActivities(a);
      setMemories(mems);
      setKnowledgeList(kList);
      setApprovals(apps);
    } catch (err) {
      console.error('Failed to load world data:', err);
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    loadWorldData();
  }, [loadWorldData]);

  const handleEditPerson = (person: Person) => {
    setSelectedPersonForEdit(person);
    editPersonDisclosure.onOpen();
  };

  const handleDeletePerson = (person: Person) => {
    setSelectedPersonForDelete(person);
    deletePersonDisclosure.onOpen();
  };

  const handleDuplicatePerson = async (person: Person) => {
    if (!worldId) return;
    try {
      const copy = await peopleService.duplicatePerson(worldId, person.id);
      if (copy) {
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}' with matching configuration.`);
        loadWorldData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const handleEditMemory = (memory: Memory) => {
    setSelectedMemoryForEdit(memory);
    editMemoryDisclosure.onOpen();
  };

  const handleDeleteMemory = (memory: Memory) => {
    setSelectedMemoryForDelete(memory);
    deleteMemoryDisclosure.onOpen();
  };

  const handleDeleteKnowledge = (knowledge: KnowledgeSource) => {
    setSelectedKnowledgeForDelete(knowledge);
    deleteKnowledgeDisclosure.onOpen();
  };

  if (isLoading) {
    return <LoadingState message="Opening world..." />;
  }

  if (isNotFound || !world) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link
            to="/worlds"
            className="flex items-center gap-1 hover:text-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Worlds
          </Link>
        </div>

        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">World Not Found</h2>
          <Link to="/worlds">
            <Button variant="primary" size="md" leftIcon={ArrowLeft}>Browse My Worlds</Button>
          </Link>
        </div>
      </div>
    );
  }

  const icon = world.icon || world.emoji || '🌐';
  const coverImg = (world as unknown as { coverImg?: string }).coverImg || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'people', label: 'People', badge: people.length, icon: Users },
    { id: 'tasks', label: 'Goals & Tasks', badge: tasks.length, icon: CheckSquare },
    { id: 'knowledge', label: 'Knowledge Base', badge: knowledgeList.length, icon: BookOpen },
    { id: 'memory', label: 'Memory', badge: memories.length, icon: Brain },
    { id: 'activity', label: 'Activity Log', badge: activities.length, icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          to="/worlds"
          className="flex items-center gap-1 hover:text-purple-300 transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Worlds
        </Link>
        <span>/</span>
        <span className="text-white font-bold flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{world.name}</span>
        </span>
      </div>

      {/* ── IMMERSIVE HERO COVER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121426] shadow-2xl">
        {/* Cover Photo Backdrop */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={coverImg}
            alt={world.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121426] via-[#121426]/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.3),transparent_70%)] pointer-events-none" />

          {/* Status badge top right */}
          <div className="absolute top-4 right-4">
            <Badge variant="working" size="md" dot pulse>
              {world.status || 'Active World'}
            </Badge>
          </div>
        </div>

        {/* Banner Content Container */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 border-4 border-[#121426] shadow-2xl flex items-center justify-center text-3xl sm:text-4xl text-white shrink-0">
                {icon}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {world.name}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 max-w-xl font-sans">
                  {world.description || 'An intelligent world where AI agents collaborate.'}
                </p>
              </div>
            </div>

            {/* Banner Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              <Link to="/conversations">
                <Button variant="primary" size="md" leftIcon={MessageSquare} className="shadow-purple-glow cursor-pointer">
                  Chat in World
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="md"
                leftIcon={UserPlus}
                onClick={addPersonDisclosure.onOpen}
                className="bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.15] cursor-pointer text-xs"
              >
                Add Person
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={Target}
                onClick={startTaskDisclosure.onOpen}
                className="bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.15] cursor-pointer text-xs"
              >
                New Goal
              </Button>
              <Link to={`/world/${world.id}/settings/tools`}>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={SlidersHorizontal}
                  className="bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30 cursor-pointer text-xs font-bold"
                >
                  Tool Policy
                </Button>
              </Link>
              <button
                onClick={editWorldDisclosure.onOpen}
                className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="World Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <WorldMetrics world={world} />

      {/* ── PENDING APPROVALS BANNER ── */}
      {approvals.length > 0 && (
        <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Pending Approvals ({approvals.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvals.map((app) => (
              <ApprovalCard
                key={app.id}
                approval={app}
                worldId={world.id}
                onResolved={loadWorldData}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MODULAR TABS NAVIGATION ── */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── TAB PANELS ── */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Split View: People & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* People Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-extrabold text-white">People in {world.name}</h3>
                  </div>
                  {people.length > 0 && (
                    <Link
                      to={`/world/${world.id}/people`}
                      className="text-xs text-purple-400 hover:underline font-bold flex items-center gap-1"
                    >
                      View all ({people.length}) <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {people.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Your world is ready. Add your first person."
                    description="Assign personalities, responsibilities, and intelligence to your AI people."
                    actionLabel="Add Person"
                    onAction={addPersonDisclosure.onOpen}
                    actionIcon={UserPlus}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {people.slice(0, 4).map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onEdit={handleEditPerson}
                        onDuplicate={handleDuplicatePerson}
                        onDelete={handleDeletePerson}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks & Goals Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-white">Active Goals & Tasks</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={startTaskDisclosure.onOpen}
                    className="text-xs"
                  >
                    New Task
                  </Button>
                </div>

                {tasks.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks scheduled."
                    description="Assign milestones to keep your AI agents working on your goals."
                    actionLabel="Create Task"
                    onAction={startTaskDisclosure.onOpen}
                    actionIcon={Plus}
                  />
                ) : (
                  <WorldTaskQueue
                    tasks={tasks}
                    onStartTaskClick={startTaskDisclosure.onOpen}
                  />
                )}
              </div>
            </div>

            {/* Knowledge Library */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white">World Knowledge Library</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Plus}
                  onClick={addKnowledgeDisclosure.onOpen}
                  className="text-xs"
                >
                  Add Knowledge
                </Button>
              </div>

              {knowledgeList.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Your world is ready to learn."
                  description="Upload briefs, guidelines, and manuals for your AI people to reference."
                  actionLabel="Add Knowledge"
                  onAction={addKnowledgeDisclosure.onOpen}
                  actionIcon={Plus}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {knowledgeList.slice(0, 3).map((item) => (
                    <KnowledgeCard
                      key={item.id}
                      knowledge={item}
                      worldId={world.id}
                      onDelete={handleDeleteKnowledge}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Stream */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-extrabold text-white">Recent Activity in {world.name}</h3>
              </div>
              <ActivityTimeline activities={activities} title={`Activity in ${world.name}`} />
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">All People in {world.name}</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={UserPlus}
                onClick={addPersonDisclosure.onOpen}
                className="shadow-purple-glow cursor-pointer"
              >
                Add Person
              </Button>
            </div>

            {people.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Your world is waiting for its first person."
                description="Add intelligent people with specific roles and responsibilities."
                actionLabel="Add Person"
                onAction={addPersonDisclosure.onOpen}
                actionIcon={UserPlus}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onEdit={handleEditPerson}
                    onDuplicate={handleDuplicatePerson}
                    onDelete={handleDeletePerson}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Goals & Tasks Queue</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={startTaskDisclosure.onOpen}
                className="shadow-purple-glow cursor-pointer"
              >
                Create Task
              </Button>
            </div>
            <WorldTaskQueue
              tasks={tasks}
              onStartTaskClick={startTaskDisclosure.onOpen}
            />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Knowledge Library ({knowledgeList.length})</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={addKnowledgeDisclosure.onOpen}
                className="shadow-purple-glow cursor-pointer"
              >
                Add Knowledge
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeList.map((item) => (
                <KnowledgeCard
                  key={item.id}
                  knowledge={item}
                  worldId={world.id}
                  onDelete={handleDeleteKnowledge}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">World Memories ({memories.length})</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={addMemoryDisclosure.onOpen}
                className="shadow-purple-glow cursor-pointer"
              >
                Add Memory
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((mem) => (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  onEdit={handleEditMemory}
                  onDelete={handleDeleteMemory}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline activities={activities} title={`Activity Log for ${world.name}`} />
        )}
      </div>

      {/* Modals */}
      <CreatePersonModal
        isOpen={addPersonDisclosure.isOpen}
        onClose={addPersonDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        onPersonCreated={loadWorldData}
      />

      {selectedPersonForEdit && (
        <EditPersonModal
          isOpen={editPersonDisclosure.isOpen}
          onClose={() => {
            editPersonDisclosure.onClose();
            setSelectedPersonForEdit(null);
          }}
          person={selectedPersonForEdit}
          onPersonUpdated={loadWorldData}
        />
      )}

      {selectedPersonForDelete && (
        <DeletePersonModal
          isOpen={deletePersonDisclosure.isOpen}
          onClose={() => {
            deletePersonDisclosure.onClose();
            setSelectedPersonForDelete(null);
          }}
          person={selectedPersonForDelete}
          onPersonDeleted={loadWorldData}
        />
      )}

      <StartTaskModal
        isOpen={startTaskDisclosure.isOpen}
        onClose={startTaskDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        agents={people}
        onTaskStarted={loadWorldData}
      />

      <EditWorldModal
        isOpen={editWorldDisclosure.isOpen}
        onClose={editWorldDisclosure.onClose}
        world={world}
        onWorldUpdated={(updated) => {
          setWorld((prev) => (prev ? { ...prev, ...updated } : updated));
        }}
      />

      <DeleteWorldModal
        isOpen={deleteWorldDisclosure.isOpen}
        onClose={deleteWorldDisclosure.onClose}
        world={world}
      />

      <AddMemoryModal
        isOpen={addMemoryDisclosure.isOpen}
        onClose={addMemoryDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        onMemoryCreated={loadWorldData}
      />

      {selectedMemoryForEdit && (
        <EditMemoryModal
          isOpen={editMemoryDisclosure.isOpen}
          onClose={() => {
            editMemoryDisclosure.onClose();
            setSelectedMemoryForEdit(null);
          }}
          memory={selectedMemoryForEdit}
          onMemoryUpdated={loadWorldData}
        />
      )}

      {selectedMemoryForDelete && (
        <DeleteMemoryModal
          isOpen={deleteMemoryDisclosure.isOpen}
          onClose={() => {
            deleteMemoryDisclosure.onClose();
            setSelectedMemoryForDelete(null);
          }}
          memory={selectedMemoryForDelete}
          onMemoryDeleted={loadWorldData}
        />
      )}

      <AddKnowledgeModal
        isOpen={addKnowledgeDisclosure.isOpen}
        onClose={addKnowledgeDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        onKnowledgeCreated={loadWorldData}
      />

      {selectedKnowledgeForDelete && (
        <DeleteKnowledgeModal
          isOpen={deleteKnowledgeDisclosure.isOpen}
          onClose={() => {
            deleteKnowledgeDisclosure.onClose();
            setSelectedKnowledgeForDelete(null);
          }}
          knowledge={selectedKnowledgeForDelete}
          worldId={world.id}
          onDeleted={loadWorldData}
        />
      )}
    </div>
  );
};

export default WorldDetailPage;
