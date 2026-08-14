import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Square,
  RotateCcw,
  Sliders,
  User,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/layout/LoadingState';
import { ConfigureIntelligenceModal } from '../features/intelligence/components/ConfigureIntelligenceModal';
import { MemoryDrawer } from '../features/memory/components/MemoryDrawer';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { conversationService, ChatMessage } from '../services/conversationService';
import { World, Person } from '../types';
import { cn } from '../lib/utils';

export const PersonChatPage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLLMOnline, setIsLLMOnline] = useState<boolean | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const intelligenceDisclosure = useDisclosure(false);
  const memoryDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
      ]);
      setWorld(w);
      setPerson(p);

      let history = conversationService.getMessages(personId);
      try {
        const backendRes = await fetch(`http://127.0.0.1:8000/api/worlds/${worldId}/people/${personId}/messages`);
        if (backendRes.ok) {
          const backendMsgs = await backendRes.json();
          if (Array.isArray(backendMsgs) && backendMsgs.length > 0) {
            // Merge any backend messages not already present
            const existingContents = new Set(history.map((m) => m.content));
            for (const bm of backendMsgs) {
              if (!existingContents.has(bm.content)) {
                history.push({
                  id: bm.id || `msg-${Date.now()}`,
                  role: bm.role,
                  content: bm.content,
                  timestamp: bm.timestamp || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not read backend conversation:', e);
      }
      setMessages(history);

      // Check Ollama health
      const health = await conversationService.checkLLMHealth();
      setIsLLMOnline(health.available);
      if (!health.available) {
        setErrorBanner(
          `${p?.name || 'Your person'}'s intelligence service is currently unavailable. Ensure Ollama is running.`,
        );
      } else {
        setErrorBanner(null);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Auto resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming || !world || !person) return;

    // Reset input
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg, initialAssistantMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setErrorBanner(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    try {
      await conversationService.streamChat(
        world,
        person,
        [...messages, userMsg],
        (token) => {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg,
            ),
          );
        },
        abortController.signal,
      );

      // Save complete conversation
      const finalMessages = [
        ...messages,
        userMsg,
        { ...initialAssistantMsg, content: accumulatedContent },
      ];
      conversationService.saveMessages(person.id, finalMessages);
      setMessages(finalMessages);
    } catch (err: unknown) {
      console.error('Streaming error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        // Handled as intentional cancellation
      } else {
        const errorMsg = `${person.name} couldn't respond right now. Please check if the local AI service is running.`;
        setErrorBanner(errorMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    accumulatedContent ||
                    "I couldn't complete that thought right now. Please check if the local intelligence service is running.",
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      toast.info('Stopped generating', 'Response generation was cancelled.');
    }
  };

  const handleResetConversation = () => {
    if (!person) return;
    conversationService.clearMessages(person.id);
    setMessages([]);
    toast.info('Conversation reset', `Started a fresh conversation with ${person.name}. Long-term memories are preserved.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return <LoadingState message="Connecting to person intelligence..." />;
  }

  if (!world || !person) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <h2 className="text-xl font-bold">Person Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Return to Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';

  const starterPrompts = [
    `Tell me about yourself and what you're working on`,
    `What can you help me with in ${world.name}?`,
    person.responsibilities && person.responsibilities.length > 0
      ? `Help me with ${person.responsibilities[0]}`
      : `Let's discuss our priorities`,
    `What recommendations do you have for ${world.name}?`,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] font-sans max-w-5xl mx-auto">
      {/* Top Chat Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-background-surface border border-border shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${world.id}/people/${person.id}`}
            className="p-1.5 rounded-xl hover:bg-background-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Avatar
            name={person.name}
            emoji={personEmoji}
            size="md"
            status={isStreaming ? 'working' : 'available'}
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                {person.name}
              </h2>
              <Badge variant={isStreaming ? 'working' : 'available'} size="sm" dot>
                {isStreaming ? 'Thinking...' : 'Available'}
              </Badge>
            </div>
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <span className="text-brand-purple-light font-medium">{person.role}</span>
              <span>•</span>
              <span>{world.name}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={Brain}
            onClick={memoryDisclosure.onOpen}
            title="View what this person remembers"
            className="text-brand-purple-light hover:text-white"
          >
            <span>Memory</span>
          </Button>

          <Link to={`/world/${world.id}/people/${person.id}`}>
            <Button variant="ghost" size="sm" leftIcon={User} className="hidden sm:inline-flex">
              Profile
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={Sliders}
            onClick={intelligenceDisclosure.onOpen}
            title="Configure Intelligence"
          >
            <span className="hidden sm:inline">Intelligence</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={RotateCcw}
            onClick={handleResetConversation}
            title="Reset Conversation"
          >
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Offline Alert Banner */}
      {errorBanner && (
        <div className="my-2 p-3 bg-brand-amber-subtle border border-brand-amber/30 rounded-2xl flex items-center justify-between text-xs text-brand-amber animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={loadData}
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Welcome State when conversation is empty */}
        {messages.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fade-in max-w-lg mx-auto">
            <div className="relative">
              <Avatar name={person.name} emoji={personEmoji} size="xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background-elevated border border-border flex items-center justify-center text-xs">
                ✨
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">
                Hi, I'm {person.name}.
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {person.description || `I'm ready to help you with ${person.role} tasks in ${world.name}.`}
              </p>
            </div>

            {/* Conversation Starter Chips */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block text-center">
                Suggested conversation starters:
              </span>
              <div className="flex flex-col gap-2">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-2xl bg-background-surface hover:bg-background-elevated border border-border hover:border-brand-purple/40 text-xs text-text-secondary hover:text-text-primary text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">"{prompt}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-text-dim group-hover:text-brand-purple-light shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-3 animate-fade-in',
                  isUser ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                {!isUser && (
                  <Avatar
                    name={person.name}
                    emoji={personEmoji}
                    size="sm"
                    className="mt-0.5"
                  />
                )}

                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-sm font-sans',
                    isUser
                      ? 'bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-tr-sm'
                      : 'bg-background-surface border border-border text-text-primary rounded-tl-sm',
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1 text-text-muted italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-ping" />
                        Thinking...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-background-surface border border-border shrink-0 shadow-lg space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Talk to ${person.name}... (Press Enter to send)`}
            disabled={isStreaming}
            className="flex-1 bg-background-elevated text-text-primary text-xs sm:text-sm rounded-2xl border border-border px-4 py-3 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans max-h-36 disabled:opacity-60"
            autoFocus
          />

          {isStreaming ? (
            <Button
              variant="danger"
              size="md"
              leftIcon={Square}
              onClick={handleStopStreaming}
              className="rounded-2xl shrink-0 h-11 px-4"
              title="Stop Generating"
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={Send}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="rounded-2xl shrink-0 h-11 px-4"
              title="Send Message"
            >
              Send
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-dim px-2">
          <span>Shift + Enter for new line</span>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isLLMOnline ? 'bg-brand-emerald' : 'bg-brand-amber',
              )}
            />
            {isLLMOnline ? 'Local Intelligence Online' : 'Intelligence Offline'}
          </span>
        </div>
      </div>

      {/* Configure Intelligence Modal */}
      <ConfigureIntelligenceModal
        isOpen={intelligenceDisclosure.isOpen}
        onClose={intelligenceDisclosure.onClose}
        person={person}
        onUpdated={(updated) => setPerson(updated)}
      />

      {/* Memory Drawer */}
      <MemoryDrawer
        isOpen={memoryDisclosure.isOpen}
        onClose={memoryDisclosure.onClose}
        world={world}
        person={person}
      />
    </div>
  );
};
