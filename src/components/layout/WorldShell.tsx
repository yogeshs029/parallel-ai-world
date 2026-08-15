import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { WorldHeader } from '../../features/experience/components/WorldHeader';
import { WorldNavigation } from '../../features/experience/components/WorldNavigation';
import { WorldFooter } from '../../features/experience/components/WorldFooter';
import { WorldCommandBar } from '../../features/experience/components/WorldCommandBar';
import { WorldChangePreviewModal } from '../../features/experience/components/WorldChangePreviewModal';
import { WorldExperienceCustomizerModal } from '../../features/experience/components/WorldExperienceCustomizerModal';
import { WorldVersionHistoryDrawer } from '../../features/experience/components/WorldVersionHistoryDrawer';
import { worldService } from '../../services/worldService';
import { peopleService } from '../../services/peopleService';
import { experienceService } from '../../services/experienceService';
import { themeEngine } from '../../services/themeEngine';
import { World, Person } from '../../types';
import { WorldExperience, WorldChangeProposal } from '../../types/experience';
import { LoadingState } from './LoadingState';
import { useDisclosure } from '../../hooks/useDisclosure';

export const WorldShell: React.FC = () => {
  const { worldId = '' } = useParams<{ worldId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [experience, setExperience] = useState<WorldExperience | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const commandBarDisclosure = useDisclosure(false);
  const customizerDisclosure = useDisclosure(false);
  const historyDisclosure = useDisclosure(false);
  const [activeProposal, setActiveProposal] = useState<WorldChangeProposal | null>(null);

  const loadData = useCallback(async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, exp, ppl] = await Promise.all([
        worldService.getWorldById(worldId),
        experienceService.getExperience(worldId),
        peopleService.getPeople(worldId),
      ]);
      setWorld(w);
      setExperience(exp);
      setPeople(ppl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global hotkey Ctrl+K / Cmd+K for Command Bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        commandBarDisclosure.onOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandBarDisclosure]);

  if (isLoading || !world || !experience) {
    return (
      <div className="min-h-screen bg-[#090A12] flex items-center justify-center">
        <LoadingState message="Entering Living World..." />
      </div>
    );
  }

  const styleObj = themeEngine.getStyleObject(experience.theme);

  return (
    <div
      style={styleObj}
      className="min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* ── LIVING WORLD HEADER ── */}
      <WorldHeader
        world={world}
        experience={experience}
        people={people}
        onOpenCommandBar={commandBarDisclosure.onOpen}
        onOpenCustomizer={customizerDisclosure.onOpen}
        onOpenHistory={historyDisclosure.onOpen}
      />

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:flex shrink-0">
          <WorldNavigation worldId={worldId} experience={experience} isMobile={false} />
        </div>

        {/* Scrollable World Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden shrink-0">
        <WorldNavigation worldId={worldId} experience={experience} isMobile={true} />
      </div>

      {/* Optional Living World Footer */}
      <WorldFooter world={world} experience={experience} />

      {/* ── EXPERIENCE MODALS & DRAWERS ── */}
      <WorldCommandBar
        isOpen={commandBarDisclosure.isOpen}
        onClose={commandBarDisclosure.onClose}
        worldId={worldId}
        worldName={world.name}
        onProposalGenerated={(prop) => setActiveProposal(prop)}
      />

      {activeProposal && (
        <WorldChangePreviewModal
          isOpen={Boolean(activeProposal)}
          onClose={() => setActiveProposal(null)}
          proposal={activeProposal}
          onApplied={() => {
            setActiveProposal(null);
            loadData();
          }}
        />
      )}

      <WorldExperienceCustomizerModal
        isOpen={customizerDisclosure.isOpen}
        onClose={customizerDisclosure.onClose}
        experience={experience}
        onUpdated={(updated) => setExperience(updated)}
      />

      <WorldVersionHistoryDrawer
        isOpen={historyDisclosure.isOpen}
        onClose={historyDisclosure.onClose}
        worldId={worldId}
        onRestored={(restored) => setExperience(restored)}
      />
    </div>
  );
};

export default WorldShell;
