import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, ShieldAlert, MessageCircle } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/layout/LoadingState';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { communicationService } from '../services/communicationService';
import { World, Person } from '../types';
import { PersonConversation, PersonToPersonMessage } from '../types/communication';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';

export const ConversationDetailPage: React.FC = () => {
  const { worldId, conversationId } = useParams<{ worldId: string; conversationId: string }>();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [conversation, setConversation] = useState<PersonConversation | null>(null);
  const [messages, setMessages] = useState<PersonToPersonMessage[]>([]);
  const [userInterventionText, setUserInterventionText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    if (!worldId || !conversationId) return;
    try {
      setIsLoading(true);
      const [w, pList, conv, msgList] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPeople(worldId),
        communicationService.getConversationById(worldId, conversationId),
        communicationService.getMessages(conversationId),
      ]);
      setWorld(w);
      setPeople(pList);
      setConversation(conv);
      setMessages(msgList);
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [worldId, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) return <LoadingState message="Opening conversation log..." />;

  if (!world || !conversation) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Conversation Not Found</h2>
        <Link to={`/world/${worldId}/conversations`}>
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>Back to Conversations</Button>
        </Link>
      </div>
    );
  }

  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  const participants = conversation.participantIds
    .map((id) => peopleMap.get(id))
    .filter(Boolean) as Person[];

  const handleUserIntervene = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = userInterventionText.trim();
    if (!text || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newMsg = await communicationService.userIntervene(world.id, conversation.id, text);
      setUserInterventionText('');
      setMessages((prev) => [...prev, newMsg]);
      toast.success('Intervention Sent', 'Your guidance was injected into the conversation.');
    } catch (err) {
      console.error('Intervention error:', err);
      toast.error('Failed', 'Could not send intervention message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/world/${world.id}/conversations`}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {participants.map((p) => p.name).join(' ↔ ')}
              </h1>
              {conversation.topic && (
                <span className="cosmos-chip cosmos-chip-blue text-[10px] hidden sm:inline">
                  {conversation.topic}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Exchanges: {conversation.exchangeCount} / 5 budget
            </p>
          </div>
        </div>

        <span className="cosmos-chip cosmos-chip-green text-[10px] shrink-0">
          {conversation.status}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 mb-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No messages recorded in this discussion</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCreator = msg.senderPersonId === 'user';
            const senderPerson = peopleMap.get(msg.senderPersonId);
            const senderName = isCreator
              ? 'You (Creator)'
              : senderPerson?.name || msg.senderName || 'Person';
            const senderEmoji = isCreator
              ? '👤'
              : senderPerson?.avatar?.emoji || senderPerson?.avatarEmoji || '👤';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[85%] sm:max-w-[75%]',
                  isCreator ? 'ml-auto flex-row-reverse' : 'mr-auto',
                )}
              >
                {!isCreator && (
                  <div className="shrink-0 pt-1">
                    <Avatar name={senderName} emoji={senderEmoji} size="xs" />
                  </div>
                )}

                <div className={cn('space-y-1', isCreator ? 'items-end' : 'items-start')}>
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700">{senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={cn(
                      'p-3 rounded-2xl text-xs leading-relaxed',
                      isCreator
                        ? 'bg-[#007aff] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-xs',
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* User Intervention Bar */}
      <form onSubmit={handleUserIntervene} className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <ShieldAlert className="w-4 h-4 text-[#007aff]" />
          <span>User Creator Intervention</span>
          <span className="text-[11px] font-normal text-slate-400">
            (Chime in to steer or resolve this discussion)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userInterventionText}
            onChange={(e) => setUserInterventionText(e.target.value)}
            placeholder="Type instructions or feedback to both people..."
            className="flex-1 px-3 py-2 cosmos-input text-xs"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={Send}
            isLoading={isSubmitting}
            disabled={!userInterventionText.trim()}
          >
            Intervene
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConversationDetailPage;
