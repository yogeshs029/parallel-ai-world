import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { UniverseStarfield } from '../ui/UniverseStarfield';
import { CreateWorldModal } from '../../features/worlds/components/CreateWorldModal';
import { useDisclosure } from '../../hooks/useDisclosure';
import { cn } from '../../lib/utils';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const searchDisclosure = useDisclosure(false);
  const createWorldDisclosure = useDisclosure(false);

  // Global Keyboard Shortcuts (Cmd+K for search, Cmd+B for sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchDisclosure.onToggle();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchDisclosure]);

  return (
    <div className="min-h-screen relative text-text-primary selection:bg-brand-purple/40 selection:text-white">
      {/* 🌌 Universe Starfield Canvas Background */}
      <UniverseStarfield />

      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        onCreateWorldClick={createWorldDisclosure.onOpen}
      />

      {/* Main Layout Container */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out relative z-10',
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64',
        )}
      >
        {/* Top Header */}
        <Header
          onSearchOpen={searchDisclosure.onOpen}
          onCreateWorldClick={createWorldDisclosure.onOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-12 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onCreateWorldClick={createWorldDisclosure.onOpen} />

      {/* Modals and Overlays */}
      <CommandPalette
        isOpen={searchDisclosure.isOpen}
        onClose={searchDisclosure.onClose}
      />

      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
      />
    </div>
  );
};

export default AppShell;
