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
  MessageSquare,
  Sliders,
  Plus,
  BookOpen,
  Volume2,
  Play,
  Square,
  Users,
  Flame,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingState } from '../components/layout/LoadingState';
import { EditPersonModal } from '../features/people/components/EditPersonModal';
import { DeletePersonModal } from '../features/people/components/DeletePersonModal';
import { ConfigureIntelligenceModal } from '../features/intelligence/components/ConfigureIntelligenceModal';
import { ConfigureVoiceModal } from '../features/voice/components/ConfigureVoiceModal';
import { VoiceConversationModal } from '../features/voice/components/VoiceConversationModal';
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
import { voiceService } from '../services/voiceService';
import { relationshipService } from '../services/relationshipService';
import { AddRelationshipModal } from '../features/relationships/components/AddRelationshipModal';
import { World, Person } from '../types';
import { Memory } from '../types/memory';
import { KnowledgeSource } from '../types/knowledge';
import { PersonPermissions } from '../types/runtime';
import { VoiceProfile } from '../types/voice';
import { Relationship } from '../types/relationship';

export const PersonDetailPage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSource[]>([]);
  const [permissions, setPermissions] = useState<PersonPermissions | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMemoryForEdit, setSelectedMemoryForEdit] = useState<Memory | null>(null);
  const [selectedMemoryForDelete, setSelectedMemoryForDelete] = useState<Memory | null>(null);
  const [selectedKnowledgeForDelete, setSelectedKnowledgeForDelete] = useState<KnowledgeSource | null>(null);

  const editDisclosure = useDisclosure(false);
  const deleteDisclosure = useDisclosure(false);
  const intelligenceDisclosure = useDisclosure(false);
  const voiceDisclosure = useDisclosure(false);
  const voiceCallDisclosure = useDisclosure(false);
  const addMemoryDisclosure = useDisclosure(false);
  const editMemoryDisclosure = useDisclosure(false);
  const deleteMemoryDisclosure = useDisclosure(false);
  const addKnowledgeDisclosure = useDisclosure(false);
  const deleteKnowledgeDisclosure = useDisclosure(false);
  const permissionsDisclosure = useDisclosure(false);
  const addRelDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p, pList, mems, kList, perms, vProfile, rels] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
        peopleService.getPeople(worldId),
        memoryService.getPersonMemories(worldId, personId),
        knowledgeService.getKnowledgeList(worldId, { personId }),
        permissionService.getPermissions(worldId, personId),
        voiceService.getPersonVoice(worldId, personId),
        relationshipService.getPersonRelationships(worldId, personId),
      ]);
      setWorld(w);
      setPerson(p);
      setAllPeople(pList);
      setMemories(mems);
      setKnowledgeList(kList);
      setPermissions(perms);
      setVoiceProfile(vProfile);
      setRelationships(rels);
    } catch (err) {
      console.error('Failed to load person data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

  useEffect(() => {
    loadData();
    return () => {
      if (previewAudio) {
        previewAudio.pause();
      }
    };
  }, [loadData, previewAudio]);

  const handleDuplicate = async () => {
    if (!worldId || !personId || !person) return;
    try {
      const copy = await peopleService.duplicatePerson(worldId, personId);
      if (copy) {
        toast.success(`Duplicated ${person.name}`, `Created '${copy.name}' successfully.`);
        navigate(`/world/${worldId}/people/${copy.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not duplicate person', 'Please try again.');
    }
  };

  const handlePreviewVoice = async () => {
    if (!person) return;
    if (isPreviewingVoice && previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setIsPreviewingVoice(false);
      return;
    }

    setIsPreviewingVoice(true);
    try {
      const url = await voiceService.previewVoice(
        voiceProfile?.voiceId || 'en-US-AvaNeural',
        voiceProfile?.speakingRate || 1.0,
        voiceProfile?.pitch || 1.0,
        `Hello! I'm ${person.name}. I'm ready to collaborate in ${world?.name || 'this world'}.`,
      );
      if (url) {
        const audio = new Audio(url);
        setPreviewAudio(audio);
        audio.onended = () => {
          setIsPreviewingVoice(false);
          setPreviewAudio(null);
        };
        audio.onerror = () => {
          setIsPreviewingVoice(false);
          setPreviewAudio(null);
        };
        await audio.play();
      } else {
        setIsPreviewingVoice(false);
      }
    } catch (e) {
      console.error(e);
      setIsPreviewingVoice(false);
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
    return <LoadingState message="Loading person profile..." />;
  }

  if (!world || !person) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <h2 className="text-xl font-bold text-white">Person Not Found</h2>
        <Link to={`/world/${worldId}`}>
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>Return to World</Button>
        </Link>
      </div>
    );
  }

  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';

  const statusLabel =
    person.status === 'busy'
      ? 'Working'
      : person.status === 'away'
      ? 'Thinking'
      : person.status === 'offline'
      ? 'Offline'
      : 'Available';

  const statusVariant: BadgeVariant =
    person.status === 'busy'
      ? 'working'
      : person.status === 'away'
      ? 'thinking'
      : person.status === 'offline'
      ? 'offline'
      : 'available';

  const thinkingStyle = person.intelligence?.thinkingStyle || 'Balanced';
  const initiativeLevel = person.intelligence?.initiativeLevel || 'Suggest things';

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          to={`/world/${world.id}`}
          className="hover:text-purple-300 transition-colors font-medium flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{world.icon || world.emoji || '🌐'}</span>
          <span>{world.name}</span>
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}/people`}
          className="hover:text-purple-300 transition-colors font-medium"
        >
          People
        </Link>
        <span>/</span>
        <span className="text-white font-bold">{person.name}</span>
      </div>

      {/* ── AGENT HERO PROFILE BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121426] via-[#16182E] to-[#0F101E] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative">
              <Avatar
                name={person.name}
                emoji={personEmoji}
                size="xl"
                status={statusVariant}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                  {person.name}
                </h1>
                <Badge variant={statusVariant} size="sm" dot>
                  {statusLabel}
                </Badge>
                {person.explicitMode && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400 fill-rose-400" /> Explicit Mode ON
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-purple-300">{person.role}</span>
                <span className="text-white/20">•</span>
                <span className="text-text-muted">{world.name}</span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed pt-1 font-sans">
                {person.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to={`/world/${world.id}/people/${person.id}/chat`}>
              <Button
                variant="primary"
                size="md"
                leftIcon={MessageSquare}
                className="shadow-purple-glow cursor-pointer"
              >
                Chat with {person.name}
              </Button>
            </Link>
            <Link to={`/world/${world.id}/people/${person.id}/capabilities`}>
              <Button
                variant="secondary"
                size="md"
                leftIcon={SlidersHorizontal}
                className="bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30 cursor-pointer text-xs font-bold"
              >
                Capabilities & Tools
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              leftIcon={Radio}
              onClick={voiceCallDisclosure.onOpen}
              className="bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.15] cursor-pointer text-xs"
            >
              Voice Call
            </Button>
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
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN AGENT MANAGEMENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Memory, Knowledge, Personality, Responsibilities, Goals */}
        <div className="lg:col-span-8 space-y-6">
          {/* Memory Section */}
          <Card variant="glass" className="p-6 space-y-4 shadow-xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm font-extrabold text-white">
                  {person.name}'s Memory ({memories.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Plus}
                  onClick={addMemoryDisclosure.onOpen}
                  className="text-xs"
                >
                  Add Memory
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {memories.length === 0 ? (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
                  <p className="text-xs text-text-muted">
                    No memories saved yet. Facts, decisions, and preferences discussed in chat will be stored here.
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

          {/* Personal Knowledge Library */}
          <Card variant="glass" className="p-6 space-y-4 shadow-xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-sm font-extrabold text-white">
                  Personal Knowledge & References ({knowledgeList.length})
                </CardTitle>
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
            </CardHeader>

            <CardContent className="p-0">
              {knowledgeList.length === 0 ? (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
                  <p className="text-xs text-text-muted">
                    No personal reference materials uploaded for {person.name}. Upload role-specific guides or notes.
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
                  {knowledgeList.slice(0, 4).map((item) => (
                    <KnowledgeCard
                      key={item.id}
                      knowledge={item}
                      worldId={world.id}
                      onDelete={handleDeleteKnowledge}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personality Traits & Communication Style */}
          <Card variant="glass" className="p-6 space-y-4 shadow-xl">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm font-extrabold text-white">
                  Personality & Communication Style
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {person.personality?.traits && person.personality.traits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {person.personality.traits.map((trait: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-bold text-purple-300"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              {person.personality?.description && (
                <p className="text-xs text-text-secondary leading-relaxed p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {person.personality.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Responsibilities & Active Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="glass" className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Responsibilities</h4>
              </div>
              <div className="space-y-1.5">
                {person.responsibilities?.map((r, i) => (
                  <div key={i} className="p-2 rounded-xl bg-white/[0.03] text-xs text-text-secondary border border-white/[0.06]">
                    • {r}
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="glass" className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Active Goals</h4>
              </div>
              <div className="space-y-1.5">
                {person.goals?.map((g, i) => (
                  <div key={i} className="p-2 rounded-xl bg-purple-500/10 text-xs text-purple-300 border border-purple-500/20 font-semibold">
                    🎯 {g}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Relationships & P2P Discussions */}
          <Card variant="glass" className="p-6 space-y-4 shadow-xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm font-extrabold text-white">
                  Relationships ({relationships.length})
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRelDisclosure.onOpen} className="text-xs">
                Add Connection
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {relationships.length === 0 ? (
                <p className="text-xs text-text-muted italic">No connections established yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relationships.map((rel) => {
                    const isOutgoing = rel.fromPersonId === person.id;
                    const otherId = isOutgoing ? rel.toPersonId : rel.fromPersonId;
                    const other = allPeople.find((p) => p.id === otherId);
                    if (!other) return null;

                    return (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={other.name} emoji={other.avatar?.emoji || other.avatarEmoji || '👤'} size="sm" />
                          <div>
                            <div className="font-bold text-white">{other.name}</div>
                            <div className="text-[10px] text-text-muted">{other.role}</div>
                          </div>
                        </div>
                        <span className="cosmos-chip cosmos-chip-purple text-[10px] capitalize">
                          {isOutgoing ? rel.type.replace('_', ' ') : `Connected (${rel.type.replace('_', ' ')})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Voice, Intelligence, Permissions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Voice & Presence Card */}
          <Card variant="glass" className="p-5 space-y-4 border-purple-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-extrabold text-white">Voice & Presence</h3>
              </div>
              <Button variant="ghost" size="sm" leftIcon={Sliders} onClick={voiceDisclosure.onOpen} className="text-xs">
                Configure
              </Button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              Choose how {person.name} sounds when generating audio responses.
            </p>

            {voiceProfile && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#15172A] border border-white/[0.08] text-xs">
                  <span className="text-text-muted">Voice:</span>
                  <span className="font-bold text-white">{voiceProfile.voiceName}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#15172A] border border-white/[0.08] text-xs">
                  <span className="text-text-muted">Speaking Speed:</span>
                  <span className="font-bold text-purple-300">{voiceProfile.speakingRate.toFixed(1)}x</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={isPreviewingVoice ? Square : Play}
                onClick={handlePreviewVoice}
                className="flex-1 text-xs"
              >
                {isPreviewingVoice ? 'Stop' : 'Preview Voice'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Volume2}
                onClick={voiceDisclosure.onOpen}
                className="flex-1 text-xs shadow-purple-glow"
              >
                Change Voice
              </Button>
            </div>
          </Card>

          {/* Intelligence & Behavior Card */}
          <Card variant="glass" className="p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-extrabold text-white">Intelligence & Behavior</h3>
              </div>
              <Button variant="ghost" size="sm" leftIcon={Sliders} onClick={intelligenceDisclosure.onOpen} className="text-xs">
                Edit
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#15172A] border border-white/[0.08]">
                <span className="text-text-muted">Thinking Style:</span>
                <span className="font-bold text-white">{thinkingStyle}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#15172A] border border-white/[0.08]">
                <span className="text-text-muted">Initiative Level:</span>
                <span className="font-bold text-emerald-400">{initiativeLevel}</span>
              </div>
            </div>
          </Card>

          {/* Capabilities & Tools Card */}
          <Card variant="glass" className="p-5 space-y-3 shadow-xl border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-extrabold text-white">Agent Capabilities</h3>
              </div>
              <Link to={`/world/${world.id}/people/${person.id}/capabilities`}>
                <Button variant="ghost" size="sm" className="text-xs text-purple-300 hover:text-white">
                  Manage
                </Button>
              </Link>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Configure allowed tools (Web Search, Files, Code Execution, APIs) and approval triggers for {person.name}.
            </p>
          </Card>

          {/* Runtime Permissions */}
          <Card variant="glass" className="p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">Runtime Permissions</h3>
              </div>
              <Button variant="ghost" size="sm" leftIcon={Sliders} onClick={permissionsDisclosure.onOpen} className="text-xs">
                Configure
              </Button>
            </div>

            {permissions && (
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#15172A] border border-white/[0.06]">
                  <span className="text-text-muted">Task Management:</span>
                  <span className={permissions.taskCreate ? 'text-emerald-400 font-bold' : 'text-text-muted font-bold'}>
                    {permissions.taskCreate ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#15172A] border border-white/[0.06]">
                  <span className="text-text-muted">World Modifications:</span>
                  <span className={permissions.worldEdit ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {permissions.worldEdit ? 'Direct' : 'Needs Approval'}
                  </span>
                </div>
              </div>
            )}
          </Card>
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
        onPersonDeleted={() => navigate(`/world/${world.id}`)}
      />

      <ConfigureIntelligenceModal
        isOpen={intelligenceDisclosure.isOpen}
        onClose={intelligenceDisclosure.onClose}
        person={person}
        onUpdated={(updated) => setPerson(updated)}
      />

      <ConfigureVoiceModal
        isOpen={voiceDisclosure.isOpen}
        onClose={voiceDisclosure.onClose}
        worldId={world.id}
        personId={person.id}
        personName={person.name}
        onVoiceUpdated={(updated) => setVoiceProfile(updated)}
      />

      <VoiceConversationModal
        isOpen={voiceCallDisclosure.isOpen}
        onClose={voiceCallDisclosure.onClose}
        world={world}
        person={person}
        voiceProfile={voiceProfile}
      />

      <AddMemoryModal
        isOpen={addMemoryDisclosure.isOpen}
        onClose={addMemoryDisclosure.onClose}
        worldId={world.id}
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

      <AddRelationshipModal
        isOpen={addRelDisclosure.isOpen}
        onClose={addRelDisclosure.onClose}
        worldId={world.id}
        fromPerson={person}
        allPeople={allPeople}
        onRelationshipAdded={loadData}
      />
    </div>
  );
};

export default PersonDetailPage;
