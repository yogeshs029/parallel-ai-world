import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LoadingState } from '../components/layout/LoadingState';
import { PersonCapabilitiesCard } from '../features/tools/components/PersonCapabilitiesCard';
import { toolService } from '../services/toolService';
import { peopleService } from '../services/peopleService';
import { worldService } from '../services/worldService';
import { useToast } from '../hooks/useToast';
import { Person, World } from '../types';
import { PersonCapabilities } from '../types/tool';

export const PersonCapabilitiesPage: React.FC = () => {
  const { worldId = '', personId = '' } = useParams<{ worldId: string; personId: string }>();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [capabilities, setCapabilities] = useState<PersonCapabilities | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [w, p, caps] = await Promise.all([
          worldService.getWorldById(worldId),
          peopleService.getPerson(worldId, personId),
          toolService.getPersonCapabilities(worldId, personId),
        ]);
        setWorld(w);
        setPerson(p);
        setCapabilities(caps);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (worldId && personId) {
      load();
    }
  }, [worldId, personId]);

  const handleSave = async () => {
    if (!capabilities || !worldId || !personId) return;
    try {
      setIsSaving(true);
      await toolService.updatePersonCapabilities(worldId, personId, capabilities);
      toast.success('Capabilities Saved', `Updated allowed tools for ${person?.name || 'agent'}.`);
    } catch (e) {
      toast.error('Save Failed', 'Could not save capabilities.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading agent capabilities..." />;
  if (!person || !capabilities) {
    return (
      <div className="p-8 text-center text-text-muted">
        Person not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${worldId}/people/${personId}`}
            className="p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{person.name}'s Capabilities</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h1>
            <p className="text-xs text-text-muted">
              World: {world?.name || worldId} • Role: {person.role}
            </p>
          </div>
        </div>
      </div>

      {/* Main Capabilities Editor Card */}
      <PersonCapabilitiesCard
        personName={person.name}
        capabilities={capabilities}
        onChange={setCapabilities}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default PersonCapabilitiesPage;
