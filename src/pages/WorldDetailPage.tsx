import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckSquare,
  BookOpen,
  Activity,
  Sparkles,
  Plus,
  UserPlus,
  Globe,
  ArrowRight,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { WorldHeader } from '../features/worlds/components/WorldHeader';
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
import { CreateWorldModal } from '../features/worlds/components/CreateWorldModal';
import { MemoryCard } from '../features/memory/components/MemoryCard';
import { AddMemoryModal } from '../features/memory/components/AddMemoryModal';
import { EditMemoryModal } from '../features/memory/components/EditMemoryModal';
import { DeleteMemoryModal } from '../features/memory/components/DeleteMemoryModal';
import { KnowledgeCard } from '../features/knowledge/components/KnowledgeCard';
import { AddKnowledgeModal } from '../features/knowledge/components/AddKnowledgeModal';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { ApprovalCard } from '../features/approvals/components/ApprovalCard';
import { Tabs } from '../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
import { formatDateRelative } from '../lib/utils';

export const WorldDetailPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
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
  const createWorldDisclosure = useDisclosure(false);
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

    const handleTaskCompleted = () => {
      loadWorldData();
    };

    window.addEventListener('parallel:task_completed', handleTaskCompleted);
    window.addEventListener('parallel:approval_requested', handleTaskCompleted);

    return () => {
      window.removeEventListener('parallel:task_completed', handleTaskCompleted);
      window.removeEventListener('parallel:approval_requested', handleTaskCompleted);
    };
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
          <div className="w-16 h-16 rounded-2xl bg-background-elevated border border-border flex items-center justify-center text-3xl">
            🌍
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
            World Not Found
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md">
            The world you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={Globe}
              onClick={() => navigate('/worlds')}
            >
              Browse My Worlds
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={createWorldDisclosure.onOpen}
            >
              Create a World
            </Button>
          </div>
        </div>

        <CreateWorldModal
          isOpen={createWorldDisclosure.isOpen}
          onClose={createWorldDisclosure.onClose}
          onWorldCreated={() => navigate('/worlds')}
        />
      </div>
    );
  }

  const icon = world.icon || world.emoji || '✨';

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Sparkles,
    },
    {
      id: 'people',
      label: 'People',
      badge: people.length,
      icon: Users,
    },
    {
      id: 'tasks',
      label: 'Tasks & Projects',
      badge: tasks.length,
      icon: CheckSquare,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      badge: knowledgeList.length,
      icon: BookOpen,
    },
    {
      id: 'activity',
      label: 'Activity Log',
      badge: activities.length,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          to="/worlds"
          className="flex items-center gap-1 hover:text-text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Worlds
        </Link>
        <span>/</span>
        <span className="text-text-primary font-semibold flex items-center gap-1">
          <span>{icon}</span>
          <span>{world.name}</span>
        </span>
      </div>

      {/* World Command Header */}
      <WorldHeader
        world={world}
        onAddAgentClick={addPersonDisclosure.onOpen}
        onStartTaskClick={startTaskDisclosure.onOpen}
        onEditWorldClick={editWorldDisclosure.onOpen}
        onDeleteWorldClick={deleteWorldDisclosure.onOpen}
      />

      {/* World Summary Counters */}
      <WorldMetrics world={world} />

      {/* Pending Approvals Banner */}
      {approvals.length > 0 && (
        <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-brand-amber/10 border border-brand-amber/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-amber" />
            <h3 className="text-sm font-bold text-text-primary">
              Approval Requests ({approvals.length})
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

      {/* Content Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Split view: People & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* People Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-purple-light" />
                    <h3 className="text-sm font-bold text-text-primary">People in World</h3>
                  </div>
                  {people.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/world/${world.id}/people`}
                        className="text-xs text-brand-purple-light hover:underline font-semibold flex items-center gap-1"
                      >
                        View all ({people.length}) <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={UserPlus}
                        onClick={addPersonDisclosure.onOpen}
                      >
                        Add Person
                      </Button>
                    </div>
                  )}
                </div>

                {people.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Your world is ready. Now let's give it some people."
                    description="Add people with roles, personalities and responsibilities to bring this world to life."
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

              {/* Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-brand-emerald" />
                    <h3 className="text-sm font-bold text-text-primary">Tasks & Projects</h3>
                  </div>
                  {tasks.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Plus}
                      onClick={startTaskDisclosure.onOpen}
                    >
                      Create Task
                    </Button>
                  )}
                </div>

                {tasks.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="Nothing needs to be done yet."
                    description="Create your first task to assign goals and get your world moving forward."
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

            {/* Knowledge & Reference Library Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-cyan" />
                  <h3 className="text-sm font-bold text-text-primary">World Knowledge Library</h3>
                </div>
                <div className="flex items-center gap-2">
                  {knowledgeList.length > 0 && (
                    <Link
                      to={`/world/${world.id}/knowledge`}
                      className="text-xs text-brand-cyan hover:underline font-semibold flex items-center gap-1"
                    >
                      View all ({knowledgeList.length}) <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={addKnowledgeDisclosure.onOpen}
                  >
                    Add Knowledge
                  </Button>
                </div>
              </div>

              {knowledgeList.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Your world is ready to learn."
                  description="Add documents, notes, product catalogs, or web pages for your people to reference."
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

            {/* World Knowledge & Memory Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-purple-light" />
                  <h3 className="text-sm font-bold text-text-primary">World Memory</h3>
                </div>
                <div className="flex items-center gap-2">
                  {memories.length > 0 && (
                    <Link
                      to={`/world/${world.id}/memory`}
                      className="text-xs text-brand-purple-light hover:underline font-semibold flex items-center gap-1"
                    >
                      View all ({memories.length}) <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={addMemoryDisclosure.onOpen}
                  >
                    Add Memory
                  </Button>
                </div>
              </div>

              {memories.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  title="No world memories recorded yet."
                  description="Save key facts, decisions, and guidelines that belong to everyone in this world."
                  actionLabel="Add First Memory"
                  onAction={addMemoryDisclosure.onOpen}
                  actionIcon={Plus}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {memories.slice(0, 3).map((mem) => (
                    <MemoryCard
                      key={mem.id}
                      memory={mem}
                      onEdit={handleEditMemory}
                      onDelete={handleDeleteMemory}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* World Details & Info Card */}
            <Card className="p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-text-primary">
                  World Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-background-elevated/70 border border-border">
                  <div>
                    <span className="text-[11px] text-text-muted block">World Type</span>
                    <span className="font-bold text-text-primary capitalize">{world.type || world.category}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Created Date</span>
                    <span className="font-bold text-text-primary">{formatDateRelative(world.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Status</span>
                    <span className="font-bold text-emerald-400 capitalize">{world.status || 'Active'}</span>
                  </div>
                </div>

                {world.promptDescription && (
                  <div className="p-3 rounded-xl bg-background-deep text-xs text-text-secondary border border-border">
                    <span className="text-[10px] font-bold text-text-muted uppercase block mb-0.5">
                      World Vision Prompt:
                    </span>
                    "{world.promptDescription}"
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Stream Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
              </div>

              {activities.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="Your world is quiet for now."
                  description="Things will appear here as your world comes to life and people start completing tasks."
                />
              ) : (
                <ActivityTimeline
                  activities={activities}
                  title={`Activity in ${world.name}`}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">All People in {world.name}</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={UserPlus}
                onClick={addPersonDisclosure.onOpen}
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
          <div>
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="Nothing needs to be done yet."
                description="Create your first task to start organizing projects."
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
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">World Knowledge Library ({knowledgeList.length})</h3>
              <div className="flex items-center gap-2">
                <Link to={`/world/${world.id}/knowledge`}>
                  <Button variant="outline" size="sm" rightIcon={ArrowRight}>
                    Open Library Directory
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={addKnowledgeDisclosure.onOpen}
                >
                  Add Knowledge
                </Button>
              </div>
            </div>

            {knowledgeList.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No knowledge documents in this world yet."
                description="Add company handbooks, product catalogs, or notes to provide reference data to all people in this world."
                actionLabel="Add Knowledge"
                onAction={addKnowledgeDisclosure.onOpen}
                actionIcon={Plus}
              />
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {activities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Your world is quiet for now."
                description="Things will appear here as your world comes to life."
              />
            ) : (
              <ActivityTimeline
                activities={activities}
                title={`Activity Stream for ${world.name}`}
              />
            )}
          </div>
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
