import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, LayoutGrid, List } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/layout/LoadingState';
import { AddRelationshipModal } from '../features/relationships/components/AddRelationshipModal';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { relationshipService } from '../services/relationshipService';
import { World, Person } from '../types';
import { Relationship } from '../types/relationship';
import { useDisclosure } from '../hooks/useDisclosure';
import { cn } from '../lib/utils';

export const RelationshipGraphPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPersonForAdd, setSelectedPersonForAdd] = useState<Person | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  const addRelDisclosure = useDisclosure(false);

  const loadData = async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, pList, rList] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
        relationshipService.getRelationships(worldId),
      ]);
      setWorld(w);
      setPeople(pList);
      setRelationships(rList.filter((r: Relationship) => r.status !== 'ended'));
    } catch (e) {
      console.error('Failed to load relationship graph data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [worldId]);

  if (isLoading) {
    return <LoadingState message="Loading world network..." />;
  }

  if (!world) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">World Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Return to Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  const handleOpenAddModal = (person?: Person) => {
    setSelectedPersonForAdd(person || people[0] || null);
    addRelDisclosure.onOpen();
  };

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${world.id}`}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{world.name} Relationships</h1>
              <span className="cosmos-chip cosmos-chip-blue text-[11px]">
                {relationships.length} Connections
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visual social ecosystem of people and directed relationships
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('graph')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'graph' ? 'bg-white text-[#007aff] shadow-xs' : 'text-slate-500',
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Graph
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'list' ? 'bg-white text-[#007aff] shadow-xs' : 'text-slate-500',
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => handleOpenAddModal()}
            disabled={people.length < 2}
          >
            Add Relationship
          </Button>
        </div>
      </div>

      {/* ── Main Graph / List View ── */}
      {viewMode === 'graph' ? (
        /* Visual Graph Container */
        <Card className="min-h-[460px] p-6 relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-sm">
          {people.length < 2 ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Need at least 2 people to build a network graph</p>
              <Link to={`/world/${world.id}`}>
                <Button variant="secondary" size="sm">Add More People</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top summary bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/60 pb-3">
                <span>{people.length} People in World</span>
                <span>Click any person to view connections</span>
              </div>

              {/* Node cards layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.map((person) => {
                  const personRels = relationships.filter(
                    (r) => r.fromPersonId === person.id || r.toPersonId === person.id,
                  );
                  const emoji = person.avatar?.emoji || person.avatarEmoji || '👤';

                  return (
                    <div
                      key={person.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#007aff]/30 transition-all space-y-3"
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/world/${world.id}/people/${person.id}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <Avatar name={person.name} emoji={emoji} size="md" />
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#007aff] transition-colors">
                              {person.name}
                            </div>
                            <div className="text-[11px] text-slate-500">{person.role}</div>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleOpenAddModal(person)}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-[#007aff]/10 hover:text-[#007aff] flex items-center justify-center transition-colors"
                          title="Connect person"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Connections list */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        {personRels.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No connections yet</p>
                        ) : (
                          personRels.map((rel) => {
                            const isOutgoing = rel.fromPersonId === person.id;
                            const otherId = isOutgoing ? rel.toPersonId : rel.fromPersonId;
                            const other = peopleMap.get(otherId);
                            if (!other) return null;

                            return (
                              <div
                                key={rel.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-[11px]"
                              >
                                <span className="font-semibold text-slate-700 capitalize">
                                  {isOutgoing ? rel.type.replace('_', ' ') : `Connected (${rel.type.replace('_', ' ')})`}
                                </span>
                                <Link
                                  to={`/world/${world.id}/people/${other.id}`}
                                  className="flex items-center gap-1.5 text-slate-800 hover:text-[#007aff] font-medium"
                                >
                                  <span>{other.name}</span>
                                  <span className="text-[10px] text-slate-400">({other.role})</span>
                                </Link>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* List Fallback View */
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            All Relationship Connections ({relationships.length})
          </h3>
          {relationships.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No relationships created yet.</p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => {
                const fromP = peopleMap.get(rel.fromPersonId);
                const toP = peopleMap.get(rel.toPersonId);
                if (!fromP || !toP) return null;

                return (
                  <div
                    key={rel.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{fromP.name}</span>
                      <span className="cosmos-chip cosmos-chip-blue text-[10px] capitalize">
                        {rel.type.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-slate-900">{toP.name}</span>
                    </div>

                    {rel.description && (
                      <span className="text-[11px] text-slate-500 italic">
                        "{rel.description}"
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Add Modal */}
      {selectedPersonForAdd && (
        <AddRelationshipModal
          isOpen={addRelDisclosure.isOpen}
          onClose={addRelDisclosure.onClose}
          worldId={world.id}
          fromPerson={selectedPersonForAdd}
          allPeople={people}
          onRelationshipAdded={loadData}
        />
      )}
    </div>
  );
};

export default RelationshipGraphPage;
