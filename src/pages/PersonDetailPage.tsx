import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Brain,
  Target,
  Sparkles,
  ShieldCheck,
  Shield,
  Code,
  Compass,
  MessageSquare,
  Sliders,
  Plus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingState } from '../components/layout/LoadingState';
import { EditPersonModal } from '../features/people/components/EditPersonModal';
import { DeletePersonModal } from '../features/people/components/DeletePersonModal';
import { ConfigureIntelligenceModal } from '../features/intelligence/components/ConfigureIntelligenceModal';
import { MemoryCard } from '../features/memory/components/MemoryCard';
import { AddMemoryModal } from '../features/memory/components/AddMemoryModal';
import { EditMemoryModal } from '../features/memory/components/EditMemoryModal';
import { DeleteMemoryModal } from '../features/memory/components/DeleteMemoryModal';
import { KnowledgeCard } from '../features/knowledge/components/KnowledgeCard';
import { AddKnowledgeModal } from '../features/knowledge/components/AddKnowledgeModal';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { ConfigurePermissionsModal } from '../features/permissions/components/ConfigurePermissionsModal';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { memoryService } from '../services/memoryService';
import { knowledgeService } from '../services/knowledgeService';
import { permissionService } from '../services/permissionService';
import { World, Person } from '../types';
import { Memory } from '../types/memory';
import { KnowledgeSource } from '../types/knowledge';
import { PersonPermissions } from '../types/runtime';
import { formatDateRelative } from '../lib/utils';

export const PersonDetailPage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSource[]>([]);
  const [permissions, setPermissions] = useState<PersonPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMemoryForEdit, setSelectedMemoryForEdit] = useState<Memory | null>(null);
  const [selectedMemoryForDelete, setSelectedMemoryForDelete] = useState<Memory | null>(null);
  const [selectedKnowledgeForDelete, setSelectedKnowledgeForDelete] = useState<KnowledgeSource | null>(null);

  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);
  const intelligenceDisclosure = useDisclosure(false);
  const addMemoryDisclosure = useDisclosure(false);
  const editMemoryDisclosure = useDisclosure(false);
  const deleteMemoryDisclosure = useDisclosure(false);
  const addKnowledgeDisclosure = useDisclosure(false);
  const deleteKnowledgeDisclosure = useDisclosure(false);
  const permissionsDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p, mems, kList, perms] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
        memoryService.getMemories(worldId, { personId }),
        knowledgeService.getKnowledgeList(worldId, { personId }),
        permissionService.getPermissions(worldId, personId),
      ]);
      setWorld(w);
      setPerson(p);
      setMemories(mems);
      setKnowledgeList(kList);
      setPermissions(perms);
    } catch (err) {
      console.error('Failed to load person profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDuplicate = async () => {
    if (!worldId || !person) return;
    try {
      const copy = await peopleService.duplicatePerson(worldId, person.id);
      if (copy) {
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}' with matching configuration.`);
        navigate(`/world/${worldId}/people/${copy.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const handleEditMemory = (mem: Memory) => {
    setSelectedMemoryForEdit(mem);
    editMemoryDisclosure.onOpen();
  };

  const handleDeleteMemory = (mem: Memory) => {
    setSelectedMemoryForDelete(mem);
    deleteMemoryDisclosure.onOpen();
  };

  const handleDeleteKnowledge = (k: KnowledgeSource) => {
    setSelectedKnowledgeForDelete(k);
    deleteKnowledgeDisclosure.onOpen();
  };

  if (isLoading) {
    return <LoadingState message="Opening person profile..." />;
  }

  if (!world || !person) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-background-elevated border border-border flex items-center justify-center text-3xl">
          👤
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Person Not Found
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md">
          This person may have been removed or does not exist in this world.
        </p>
        <Link to={worldId ? `/world/${worldId}/people` : '/worlds'}>
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Back to People Directory
          </Button>
        </Link>
      </div>
    );
  }

  const worldIcon = world.icon || world.emoji || '✨';
  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';

  const statusVariant =
    person.status === 'available'
      ? 'available'
      : person.status === 'busy'
        ? 'working'
        : person.status === 'away'
          ? 'thinking'
          : 'offline';

  const statusLabel =
    person.status === 'available'
      ? '🟢 Available'
      : person.status === 'busy'
        ? '🟡 Busy'
        : person.status === 'away'
          ? '🟠 Away'
          : '⚪ Offline';

  const thinkingStyle = person.intelligence?.thinkingStyle || 'Balanced';
  const initiativeLevel = person.intelligence?.initiativeLevel || 'Suggest things';
  const customInstructions = person.intelligence?.customInstructions;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Breadcrumb Navigation */}
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
        <span className="text-text-primary font-bold">{person.name}</span>
      </div>

      {/* Main Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-background-surface p-6 sm:p-8 shadow-card-subtle">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative">
              <Avatar
                name={person.name}
                emoji={personEmoji}
                size="xl"
                status={person.status === 'busy' ? 'working' : person.status === 'away' ? 'thinking' : person.status}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
                  {person.name}
                </h1>
                <Badge variant={statusVariant} size="sm" dot>
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-brand-purple-light">{person.role}</span>
                <span className="text-border">•</span>
                <span className="text-text-muted">{world.name}</span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed pt-1">
                {person.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to={`/world/${world.id}/people/${person.id}/chat`}>
              <Button
                variant="primary"
                size="md"
                leftIcon={MessageSquare}
                className="shadow-md"
              >
                Talk to {person.name}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Edit}
              onClick={editDisclosure.onOpen}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Copy}
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={Trash2}
              onClick={deleteDisclosure.onOpen}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Character Profile Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Memory, Knowledge, Personality, Responsibilities, Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Memory Section */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-purple-light" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  {person.name}'s Memory ({memories.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {memories.length > 0 && (
                  <Link
                    to={`/world/${world.id}/people/${person.id}/memory`}
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
            </CardHeader>

            <CardContent className="p-0">
              {memories.length === 0 ? (
                <div className="p-5 rounded-2xl bg-background-elevated/60 border border-border/80 text-center space-y-2">
                  <p className="text-xs text-text-muted">
                    No memories saved yet. Facts, decisions, and preferences discussed in chat or added manually will be remembered here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={addMemoryDisclosure.onOpen}
                  >
                    Add First Memory
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {memories.slice(0, 4).map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onEdit={handleEditMemory}
                      onDelete={handleDeleteMemory}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference Knowledge Section */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-cyan" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  Reference Knowledge ({knowledgeList.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {knowledgeList.length > 0 && (
                  <Link
                    to={`/world/${world.id}/people/${person.id}/knowledge`}
                    className="text-xs text-brand-cyan hover:underline font-semibold flex items-center gap-1"
                  >
                    View library ({knowledgeList.length}) <ArrowRight className="w-3 h-3" />
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
            </CardHeader>

            <CardContent className="p-0">
              {knowledgeList.length === 0 ? (
                <div className="p-5 rounded-2xl bg-background-elevated/60 border border-border/80 text-center space-y-2">
                  <p className="text-xs text-text-muted">
                    No reference documents assigned to {person.name} yet. Add guides, catalogs, or notes.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={addKnowledgeDisclosure.onOpen}
                  >
                    Add Knowledge
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {knowledgeList.slice(0, 4).map((k) => (
                    <KnowledgeCard
                      key={k.id}
                      knowledge={k}
                      worldId={world.id}
                      onDelete={handleDeleteKnowledge}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personality & Communication */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-purple-light" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  Personality & Communication Style
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              {person.personality?.communicationStyle && person.personality.communicationStyle.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {person.personality.communicationStyle.map((st) => (
                    <span
                      key={st}
                      className="px-3 py-1 rounded-xl bg-brand-purple/20 text-brand-purple-light font-semibold border border-brand-purple/30"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              )}

              {person.personality?.description && (
                <div className="p-3.5 rounded-2xl bg-background-elevated border border-border text-text-secondary leading-relaxed font-sans italic">
                  "{person.personality.description}"
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Responsibilities */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  Responsibilities ({person.responsibilities?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {person.responsibilities && person.responsibilities.length > 0 ? (
                <div className="space-y-2">
                  {person.responsibilities.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-background-elevated/70 border border-border text-xs text-text-primary font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No responsibilities assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-amber" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  Goals & Objectives ({person.goals?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {person.goals && person.goals.length > 0 ? (
                <div className="space-y-2">
                  {person.goals.map((g, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-background-elevated/70 border border-border text-xs text-text-primary font-medium"
                    >
                      <span>🎯</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No active goals defined yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Permissions, Intelligence, Skills, Interests */}
        <div className="space-y-6">
          {/* Permissions & World Actions Card */}
          <Card className="p-6 space-y-4 border-brand-cyan/30 bg-gradient-to-b from-brand-cyan/10 to-transparent shadow-card-subtle">
            <CardHeader className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-cyan" />
                  <CardTitle className="text-sm font-bold text-text-primary">
                    Runtime Permissions
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Sliders}
                  onClick={permissionsDisclosure.onOpen}
                >
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <p className="text-text-secondary leading-relaxed">
                Controls what {person.name} can do autonomously inside this world.
              </p>

              {permissions && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background-elevated border border-border text-xs">
                    <span className="text-text-muted">Task management:</span>
                    <span className={permissions.taskCreate ? 'text-brand-emerald font-bold' : 'text-text-dim font-bold'}>
                      {permissions.taskCreate ? 'Allowed' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background-elevated border border-border text-xs">
                    <span className="text-text-muted">Knowledge adding:</span>
                    <span className={permissions.knowledgeCreate ? 'text-brand-emerald font-bold' : 'text-text-dim font-bold'}>
                      {permissions.knowledgeCreate ? 'Allowed' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background-elevated border border-border text-xs">
                    <span className="text-text-muted">World modifications:</span>
                    <span className={permissions.worldEdit ? 'text-brand-emerald font-bold' : 'text-brand-amber font-bold'}>
                      {permissions.worldEdit ? 'Direct' : 'Needs Approval'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background-elevated border border-border text-xs">
                    <span className="text-text-muted">Proactive messaging:</span>
                    <span className={permissions.messageUser ? 'text-brand-emerald font-bold' : 'text-text-dim font-bold'}>
                      {permissions.messageUser ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                leftIcon={Shield}
                onClick={permissionsDisclosure.onOpen}
                className="w-full"
              >
                Configure Permissions
              </Button>
            </CardContent>
          </Card>

          {/* Intelligence & Brain */}
          <Card className="p-6 space-y-4 border-brand-purple/30 bg-gradient-to-b from-brand-purple/10 to-transparent shadow-card-subtle">
            <CardHeader className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-purple-light" />
                  <CardTitle className="text-sm font-bold text-text-primary">
                    Intelligence & Brain
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Sliders}
                  onClick={intelligenceDisclosure.onOpen}
                >
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <p className="text-text-secondary leading-relaxed">
                {person.name}'s intelligence determines how she communicates and approaches problems in your world.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background-elevated border border-border">
                  <span className="text-text-muted">Thinking style:</span>
                  <span className="font-bold text-text-primary">{thinkingStyle}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background-elevated border border-border">
                  <span className="text-text-muted">Initiative:</span>
                  <span className="font-bold text-text-primary">{initiativeLevel}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background-elevated border border-border">
                  <span className="text-text-muted">Custom guidance:</span>
                  <span className="font-bold text-text-primary">
                    {customInstructions ? 'Configured' : 'Default'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link to={`/world/${world.id}/people/${person.id}/chat`} className="w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={MessageSquare}
                    className="w-full"
                  >
                    Start Conversation
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Sliders}
                  onClick={intelligenceDisclosure.onOpen}
                  className="w-full"
                >
                  Configure Intelligence
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-brand-cyan" />
                <CardTitle className="text-sm font-bold text-text-primary">
                  Skills & Expertise
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {person.skills && person.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {person.skills.map((sk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-background-elevated border border-border text-xs text-text-primary font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No skills listed.</p>
              )}
            </CardContent>
          </Card>

          {/* Interests */}
          {person.interests && person.interests.length > 0 && (
            <Card className="p-6 space-y-4">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-brand-purple-light" />
                  <CardTitle className="text-sm font-bold text-text-primary">
                    Personal Interests
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap gap-1.5">
                  {person.interests.map((it, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-background-deep border border-border text-xs text-text-muted"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Metadata */}
          <div className="text-[11px] text-text-dim px-1 space-y-1">
            <div>Created {formatDateRelative(person.createdAt)}</div>
            <div>Last updated {formatDateRelative(person.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditPersonModal
        isOpen={editDisclosure.isOpen}
        onClose={editDisclosure.onClose}
        person={person}
        onPersonUpdated={loadData}
      />

      <DeletePersonModal
        isOpen={deleteDisclosure.isOpen}
        onClose={deleteDisclosure.onClose}
        person={person}
      />

      <ConfigureIntelligenceModal
        isOpen={intelligenceDisclosure.isOpen}
        onClose={intelligenceDisclosure.onClose}
        person={person}
        onUpdated={loadData}
      />

      <AddMemoryModal
        isOpen={addMemoryDisclosure.isOpen}
        onClose={addMemoryDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        personId={person.id}
        personName={person.name}
        onMemoryCreated={loadData}
      />

      {selectedMemoryForEdit && (
        <EditMemoryModal
          isOpen={editMemoryDisclosure.isOpen}
          onClose={() => {
            editMemoryDisclosure.onClose();
            setSelectedMemoryForEdit(null);
          }}
          memory={selectedMemoryForEdit}
          onMemoryUpdated={loadData}
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
          onMemoryDeleted={loadData}
        />
      )}

      <AddKnowledgeModal
        isOpen={addKnowledgeDisclosure.isOpen}
        onClose={addKnowledgeDisclosure.onClose}
        worldId={world.id}
        worldName={world.name}
        personId={person.id}
        personName={person.name}
        onKnowledgeCreated={loadData}
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
          onDeleted={loadData}
        />
      )}

      <ConfigurePermissionsModal
        isOpen={permissionsDisclosure.isOpen}
        onClose={permissionsDisclosure.onClose}
        worldId={world.id}
        personId={person.id}
        personName={person.name}
        onUpdated={loadData}
      />
    </div>
  );
};
