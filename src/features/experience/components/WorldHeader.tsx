import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  History,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { World, Person } from '../../../types';
import { WorldExperience } from '../../../types/experience';
import { Avatar } from '../../../components/ui/Avatar';
import { DeleteWorldModal } from '../../worlds/components/DeleteWorldModal';

export interface WorldHeaderProps {
  world: World;
  experience: WorldExperience;
  people: Person[];
  onOpenCommandBar: () => void;
  onOpenCustomizer: () => void;
  onOpenHistory: () => void;
}

export const WorldHeader: React.FC<WorldHeaderProps> = ({
  world,
  experience,
  people,
  onOpenCommandBar,
  onOpenCustomizer,
  onOpenHistory,
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const icon = world.icon || world.emoji || '🌐';
  const headerCfg = experience.headerConfig;

  return (
    <>
      <header className="h-16 border-b border-white/[0.08] bg-[#0C0E1A]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 font-sans z-30">
        {/* Left: Escape Link & World Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            to="/worlds"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-text-muted hover:text-white transition-all cursor-pointer shrink-0"
            title="Return to global Parallel worlds"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Worlds</span>
          </Link>

          <div className="h-5 w-px bg-white/[0.08] hidden sm:block shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                {world.name}
              </h2>
              {headerCfg.customTagline && (
                <p className="text-[10px] text-text-muted truncate hidden md:block">
                  {headerCfg.customTagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Middle: World Search & Command Bar Trigger */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md mx-2">
          {headerCfg.showCommandTrigger && (
            <button
              type="button"
              onClick={onOpenCommandBar}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-text-muted hover:text-white transition-all cursor-pointer group shadow-inner"
            >
              <span className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:animate-pulse shrink-0" />
                <span className="truncate">Change anything with prompt...</span>
              </span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.1] text-[10px] font-mono text-purple-300">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        {/* Right: Presence Avatars, History, Customizer, Delete */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Member Presence */}
          {headerCfg.showMemberAvatars && people.length > 0 && (
            <div className="hidden lg:flex items-center -space-x-2 mr-1">
              {people.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`/world/${world.id}/people/${p.id}`}
                  className="hover:scale-110 transition-transform cursor-pointer"
                  title={`${p.name} (${p.role})`}
                >
                  <Avatar
                    name={p.name}
                    emoji={p.avatar?.emoji || p.avatarEmoji || '👤'}
                    size="xs"
                    className="ring-2 ring-[#0C0E1A]"
                  />
                </Link>
              ))}
              {people.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/40 text-[9px] font-bold text-purple-200 flex items-center justify-center ring-2 ring-[#0C0E1A]">
                  +{people.length - 4}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Experience Version History & Undo"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-purple-glow"
            title="World Experience Customizer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/30 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
            title="Delete World Permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {isDeleteOpen && (
        <DeleteWorldModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          world={world}
        />
      )}
    </>
  );
};
