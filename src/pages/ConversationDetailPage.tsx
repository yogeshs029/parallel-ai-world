import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, ShieldAlert, MessageCircle } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/layout/LoadingState';
import { worldService } from '../services/worldService';
import { personService } from '../services/personService';
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
        personService.getAllPeople(),
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <h2 className="text-lg font-bold text-white">Conversation Not Found</h2>
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
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 bg-[#0F101D] border border-white/[0.08] rounded-3xl shadow-xl mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/world/${world.id}/conversations`}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-purple-300 transition-colors shrink-0 cursor-pointer"
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
              <h1 className="text-sm font-extrabold text-white truncate">
                {participants.map((p) => p.name).join(' ↔ ')}
              </h1>
              {conversation.topic && (
                <span className="cosmos-chip cosmos-chip-purple text-[10px] hidden sm:inline">
                  {conversation.topic}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted truncate">
              Exchanges: {conversation.exchangeCount} / 5 budget
            </p>
          </div>
        </div>

        <span className="cosmos-chip cosmos-chip-green text-[10px] shrink-0">
          {conversation.status}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0B0C14] rounded-3xl border border-white/[0.08] mb-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-text-muted" />
            <p className="text-sm font-semibold text-white">No messages recorded in this discussion</p>
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
                  <div className="flex items-center gap-2 px-1 text-[10px] text-text-muted">
                    <span className="font-bold text-white">{senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={cn(
                      'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-sans',
                      isCreator
                        ? 'imessage-bubble-user'
                        : 'imessage-bubble-ai',
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
      <form onSubmit={handleUserIntervene} className="bg-[#0F101D] p-3.5 rounded-3xl border border-white/[0.08] shadow-xl space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>User Creator Intervention</span>
          <span className="text-[11px] font-normal text-text-muted">
            (Chime in to steer or resolve this discussion)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userInterventionText}
            onChange={(e) => setUserInterventionText(e.target.value)}
            placeholder="Type instructions or feedback to steer..."
            className="flex-1 px-4 py-2.5 bg-[#15172A] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder:text-text-muted outline-none focus:border-purple-500/50"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={Send}
            isLoading={isSubmitting}
            disabled={!userInterventionText.trim()}
            className="shadow-purple-glow cursor-pointer"
          >
            Intervene
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConversationDetailPage;
