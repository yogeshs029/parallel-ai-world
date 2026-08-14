import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
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
    <div className="min-h-screen bg-app-ambient text-text-primary selection:bg-brand-purple/30 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        onCreateWorldClick={createWorldDisclosure.onOpen}
      />

      {/* Main Layout Container */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-250 ease-in-out',
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64',
        )}
      >
        {/* Top Header */}
        <Header
          onSearchOpen={searchDisclosure.onOpen}
          onCreateWorldClick={createWorldDisclosure.onOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onCreateWorldClick={createWorldDisclosure.onOpen} />

      {/* Universal Search / Command Palette Dialog */}
      <CommandPalette
        isOpen={searchDisclosure.isOpen}
        onClose={searchDisclosure.onClose}
      />

      {/* Global Create World Modal */}
      <CreateWorldModal
        isOpen={createWorldDisclosure.isOpen}
        onClose={createWorldDisclosure.onClose}
      />
    </div>
  );
};
