import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ChevronRight, RefreshCw } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/layout/LoadingState';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { communicationService } from '../services/communicationService';
import { World, Person } from '../types';
import { PersonConversation } from '../types/communication';

export const ConversationsListPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [conversations, setConversations] = useState<PersonConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!worldId) return;
    try {
      setIsLoading(true);
      const [w, pList, cList] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
        communicationService.getConversations(worldId),
      ]);
      setWorld(w);
      setPeople(pList);
      setConversations(cList);
    } catch (e) {
      console.error('Failed to load conversations list:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [worldId]);

  if (isLoading) return <LoadingState message="Loading conversations..." />;

  if (!world) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">World Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>Return to Worlds</Button>
        </Link>
      </div>
    );
  }

  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${world.id}`}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{world.name} Internal Chats</h1>
              <span className="cosmos-chip cosmos-chip-purple text-[11px]">
                {conversations.length} Discussions
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Person-to-Person conversations and task collaborations
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations List */}
      <Card className="p-4 bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            All Person-to-Person Discussions
          </h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No person conversations recorded yet</p>
            <p className="text-xs text-slate-400 max-w-sm">
              When people communicate or collaborate on tasks, their discussions will appear here for inspection.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const participants = conv.participantIds
                .map((id) => peopleMap.get(id))
                .filter(Boolean) as Person[];

              const names = participants.map((p) => p.name).join(' ↔ ') || 'Participants';

              return (
                <Link
                  key={conv.id}
                  to={`/world/${world.id}/conversations/${conv.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                      {participants.map((p) => (
                        <Avatar
                          key={p.id}
                          name={p.name}
                          emoji={p.avatar?.emoji || p.avatarEmoji || '👤'}
                          size="sm"
                        />
                      ))}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#007aff] transition-colors truncate">
                          {names}
                        </span>
                        {conv.topic && (
                          <span className="cosmos-chip cosmos-chip-blue text-[10px]">
                            {conv.topic}
                          </span>
                        )}
                      </div>

                      {conv.lastMessage ? (
                        <p className="text-xs text-slate-500 truncate max-w-md">
                          <span className="font-semibold text-slate-700">{conv.lastMessage.senderName}:</span>{' '}
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No messages sent yet</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      {new Date(conv.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#007aff] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConversationsListPage;
