import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Users, Activity, Settings, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { worldService } from '../../services/worldService';
import { personService } from '../../services/personService';
import { World, Person } from '../../types';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [worlds, setWorlds] = useState<World[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      worldService.getAllWorlds().then(setWorlds);
      personService.getAllPeople().then(setPeople);
      setQuery('');
    }
  }, [isOpen]);

  const filteredWorlds = worlds.filter(
    (w) =>
      w.name.toLowerCase().includes(query.toLowerCase()) ||
      w.description.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.role.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelectWorld = (worldId: string) => {
    onClose();
    navigate(`/world/${worldId}`);
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-3 font-sans -m-1">
        {/* Search Bar */}
        <div className="flex items-center gap-2.5 px-3 py-2 bg-background-elevated rounded-xl border border-border">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search worlds, people, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none placeholder:text-text-dim"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-3 pt-1">
          {/* Quick Pages */}
          {!query && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-text-dim px-2">Navigation</div>
              <button
                onClick={() => handleNavigate('/worlds')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-brand-purple-light" /> My Worlds
                </span>
                <ArrowRight className="w-3 h-3 text-text-dim" />
              </button>
              <button
                onClick={() => handleNavigate('/people')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-brand-cyan-light" /> People Directory
                </span>
                <ArrowRight className="w-3 h-3 text-text-dim" />
              </button>
              <button
                onClick={() => handleNavigate('/activity')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-brand-emerald-light" /> Recent Activity
                </span>
                <ArrowRight className="w-3 h-3 text-text-dim" />
              </button>
              <button
                onClick={() => handleNavigate('/settings')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-text-muted" /> Settings
                </span>
                <ArrowRight className="w-3 h-3 text-text-dim" />
              </button>
            </div>
          )}

          {/* Worlds Results */}
          {filteredWorlds.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-text-dim px-2">Worlds</div>
              {filteredWorlds.slice(0, 4).map((world) => {
                const icon = world.icon || world.emoji || '✨';
                const peopleCount = world.memberCount ?? world.peopleCount ?? 0;

                return (
                  <button
                    key={world.id}
                    onClick={() => handleSelectWorld(world.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{icon}</span>
                      <span className="font-bold text-text-primary group-hover:text-brand-purple-light">
                        {world.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-dim">
                      {peopleCount} people
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* People Results */}
          {filteredPeople.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-text-dim px-2">People</div>
              {filteredPeople.slice(0, 4).map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    onClose();
                    navigate(`/world/${person.worldId}/people/${person.id}`);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-background-elevated text-left text-xs text-text-secondary hover:text-text-primary transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{person.avatarEmoji}</span>
                    <div>
                      <span className="font-bold text-text-primary group-hover:text-brand-purple-light">
                        {person.name}
                      </span>
                      <span className="text-[11px] text-text-muted ml-2">
                        {person.role}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-text-dim">
                    {person.worldName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
