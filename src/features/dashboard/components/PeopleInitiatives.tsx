/**
 * PeopleInitiatives — shows proactive messages/nudges from People on the dashboard.
 * Each person reaching out with something relevant to their role.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Person, World } from '../../../types';
import { conversationService, ChatMessage } from '../../../services/conversationService';
import { cn } from '../../../lib/utils';

interface PersonInitiative {
  person: Person;
  world: World | null;
  message: string;
  isLoading: boolean;
  error: boolean;
}

interface PeopleInitiativesProps {
  people: Person[];
  worlds: World[];
}

// Generate a natural initiative prompt (system-side, not shown to user)
function buildInitiativeTrigger(person: Person, world: World | null): string {
  const role = person.role || 'person';
  const worldName = world?.name || 'this world';
  const resp = person.responsibilities?.slice(0, 2).join(' and ') || '';
  return `[SYSTEM: You are ${person.name}, a real ${role} in ${worldName}. Send a short, natural message to the user like you're reaching out on chat. Something relevant to your role${resp ? ` (especially around ${resp})` : ''}. It should feel like a real person checking in, flagging something, or asking for input. 1-2 sentences max. NO greetings. NO "Hey!" or "Hi there!". Just talk like you normally would.]`;
}

export const PeopleInitiatives: React.FC<PeopleInitiativesProps> = ({ people, worlds }) => {
  const [initiatives, setInitiatives] = useState<PersonInitiative[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const worldMap = React.useMemo(() => {
    const map: Record<string, World> = {};
    worlds.forEach((w) => { map[w.id] = w; });
    return map;
  }, [worlds]);

  const loadInitiatives = useCallback(async (personsToLoad: Person[]) => {
    if (personsToLoad.length === 0) return;

    // Pick up to 3 people who haven't chatted recently (or random selection)
    const selected = personsToLoad.slice(0, 3);

    // Initialise with loading state
    setInitiatives(
      selected.map((p) => ({
        person: p,
        world: worldMap[p.worldId] || null,
        message: '',
        isLoading: true,
        error: false,
      })),
    );

    // Stream each initiative
    for (const p of selected) {
      const world = worldMap[p.worldId] || null;
      const triggerMsg: ChatMessage = {
        id: `initiative-trigger-${p.id}-${Date.now()}`,
        role: 'user',
        content: buildInitiativeTrigger(p, world),
        timestamp: new Date().toISOString(),
      };

      let content = '';
      try {
        await conversationService.streamChat(
          world as any,
          p,
          [triggerMsg],
          (token) => {
            content += token;
            setInitiatives((prev) =>
              prev.map((item) =>
                item.person.id === p.id ? { ...item, message: content } : item,
              ),
            );
          },
        );
        setInitiatives((prev) =>
          prev.map((item) =>
            item.person.id === p.id
              ? { ...item, message: content, isLoading: false, error: !content }
              : item,
          ),
        );
      } catch {
        setInitiatives((prev) =>
          prev.map((item) =>
            item.person.id === p.id ? { ...item, isLoading: false, error: true } : item,
          ),
        );
      }
    }
  }, [worldMap]);

  useEffect(() => {
    if (people.length > 0) {
      loadInitiatives(people);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitiatives(people);
    setIsRefreshing(false);
  };

  const visibleInitiatives = initiatives.filter(
    (i) => i.isLoading || (!i.error && i.message),
  );

  if (visibleInitiatives.length === 0 && !isRefreshing) return null;

  return (
    <Card className="font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#7c9bf7]" />
          <CardTitle className="text-sm font-bold">People Want to Talk</CardTitle>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="cosmos-btn-icon w-7 h-7 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
        </button>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {visibleInitiatives.map(({ person, world, message, isLoading }) => {
          const emoji = person.avatar?.emoji || person.avatarEmoji || '👤';
          const chatUrl = world
            ? `/world/${world.id}/people/${person.id}/chat`
            : `/world/${person.worldId}/people/${person.id}/chat`;

          return (
            <Link
              key={person.id}
              to={chatUrl}
              className="flex items-start gap-3 p-3 rounded-2xl cosmos-card cosmos-card-interactive group"
            >
              {/* Avatar */}
              <div className="shrink-0 pt-0.5">
                <Avatar
                  name={person.name}
                  emoji={emoji}
                  size="sm"
                  status={isLoading ? 'working' : 'available'}
                />
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-bold text-text-primary group-hover:text-[#a5bef9] transition-colors">
                    {person.name}
                  </span>
                  <span className="text-[10px] text-text-dim truncate">{person.role}</span>
                </div>

                {isLoading ? (
                  <div className="dot-pulse mt-1"><span /><span /><span /></div>
                ) : (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {message}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="w-3.5 h-3.5 text-text-dim shrink-0 mt-0.5 group-hover:text-[#7c9bf7] transition-colors" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};
