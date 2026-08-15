import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Plus,
  Star,
  Phone,
  Video,
  Info,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  FileText,
  Bell,
  Archive,
  AtSign,
  CheckSquare,
  Edit3,
  Target,
  Check,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { LoadingState } from '../components/layout/LoadingState';
import { LLMConfigModal } from '../features/intelligence/components/LLMConfigModal';
import { worldService } from '../services/worldService';
import { personService } from '../services/peopleService';
import { conversationService, ChatMessage } from '../services/conversationService';
import { World, Person } from '../types';

interface ChatMessageDemo {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isUser: boolean;
  content: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
  isRead?: boolean;
}

export const ConversationsListPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'groups' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvId, setActiveConvId] = useState<string>('c-1');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'details' | 'files' | 'tasks'>('chat');
  const [inputText, setInputText] = useState('');
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);
  const [llmRefresh, setLlmRefresh] = useState(0);

  const [activeWorld, setActiveWorld] = useState<World | null>(null);
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Conversations list matching exact image
  const conversationsList = [
    {
      id: 'c-1',
      title: 'Maya ↔ Priya',
      topic: 'Website Redesign',
      time: '10:42 AM',
      unread: 2,
      lastMsg: 'Priya: I\'ve updated the requirements...',
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      ],
      partnerName: 'Maya',
      partnerRole: 'Lead Designer',
      partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      tag: 'Website Redesign',
      relatedGoal: 'Website Launch',
    },
    {
      id: 'c-2',
      title: 'Rahul (Finance)',
      topic: 'Q3 Budget Approval',
      time: '9:15 AM',
      unread: 0,
      lastMsg: 'Rahul: The financial report is ready...',
      avatars: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      ],
      partnerName: 'Rahul',
      partnerRole: 'Finance Director',
      partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      tag: 'Finance & Budget',
      relatedGoal: 'Quarterly Planning',
    },
    {
      id: 'c-3',
      title: 'Liam ↔ Maya',
      topic: 'Product Photography',
      time: 'Yesterday',
      unread: 0,
      lastMsg: 'Liam: High-res renders uploaded.',
      avatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      ],
      partnerName: 'Liam',
      partnerRole: '3D Artist & Visualizer',
      partnerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      tag: 'Product Media',
      relatedGoal: 'Catalog Expansion',
    },
    {
      id: 'c-4',
      title: 'Design Review',
      topic: 'Core Design System',
      time: 'Yesterday',
      unread: 0,
      lastMsg: 'Elena: Typography scale refined.',
      avatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      ],
      partnerName: 'Elena',
      partnerRole: 'Creative Director',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      tag: 'Design System',
      relatedGoal: 'Brand Guidelines',
    },
  ];

  const [messages, setMessages] = useState<ChatMessageDemo[]>([
    {
      id: 'm-1',
      senderId: 'maya',
      senderName: 'Maya',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isUser: false,
      content: 'Here\'s the draft outline for the new website landing page. Let me know what you think!',
      timestamp: '10:30 AM',
      isRead: true,
    },
    {
      id: 'm-2',
      senderId: 'priya',
      senderName: 'Priya',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      isUser: true,
      content: 'Love it! Especially the hero section copy. Let\'s make sure we include the eco-friendly messaging prominently.',
      timestamp: '10:31 AM',
      reactions: [{ emoji: '👍', count: 1 }],
      isRead: true,
    },
    {
      id: 'm-3',
      senderId: 'maya',
      senderName: 'Maya',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isUser: false,
      content: 'Great, thanks! I\'ll review and come back if I have any questions.',
      timestamp: '10:35 AM',
      reactions: [{ emoji: '❤️', count: 1 }],
    },
    {
      id: 'm-4',
      senderId: 'priya',
      senderName: 'Priya',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      isUser: true,
      content: 'Perfect. Also, the new campaign tagline is:\n"Crafted for Life. Inspired by Nature."\nLet me know if you need anything else.',
      timestamp: '10:37 AM',
      reactions: [{ emoji: '❤️', count: 1 }],
      isRead: true,
    },
  ]);

  useEffect(() => {
    async function initData() {
      try {
        const [worlds, people] = await Promise.all([
          worldService.getAllWorlds(),
          personService.getPeople('world-company').catch(() => []),
        ]);
        if (worlds.length > 0) setActiveWorld(worlds[0]);
        if (people.length > 0) setActivePerson(people[0]);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentConv = conversationsList.find((c) => c.id === activeConvId) || conversationsList[0];

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessageDemo = {
      id: `m-${Date.now()}`,
      senderId: 'user',
      senderName: 'Priya',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      isUser: true,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    const aiMsgId = `asst-${Date.now()}`;
    const aiMsg: ChatMessageDemo = {
      id: aiMsgId,
      senderId: currentConv.partnerName.toLowerCase(),
      senderName: currentConv.partnerName,
      senderAvatar: currentConv.partnerAvatar,
      isUser: false,
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputText('');
    setIsStreaming(true);

    const fallbackWorld: World = (activeWorld || {
      id: 'world-company',
      name: 'Acme Designs',
      description: 'A modern design studio producing sustainable wooden furniture.',
      category: 'company',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) as unknown as World;

    const fallbackPerson: Person = (activePerson || {
      id: 'person-maya',
      worldId: fallbackWorld.id,
      name: currentConv.partnerName,
      role: currentConv.partnerRole,
      description: `Lead collaborator for ${currentConv.tag} in ${fallbackWorld.name}.`,
      personality: { traits: ['Creative', 'Thoughtful', 'Focused'], communicationStyle: ['Friendly', 'Articulate'] },
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) as unknown as Person;

    // Format chat messages for LLM
    const chatHistory: ChatMessage[] = messages
      .map((m) => ({
        id: m.id,
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content: m.content,
        timestamp: m.timestamp,
      }))
      .concat([{ id: userMsg.id, role: 'user', content: userMsg.content, timestamp: userMsg.timestamp }]);

    let accumulated = '';
    try {
      await conversationService.streamChat(
        fallbackWorld,
        fallbackPerson,
        chatHistory,
        (token) => {
          accumulated += token;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: accumulated } : msg)),
          );
        },
      );
    } catch (err) {
      console.warn('Chat streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: accumulated || "I've reviewed your message. Let's make it happen!" }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const llmInfo = useMemo(() => conversationService.getActiveProviderInfo(), [llmRefresh]);

  if (isLoading) return <LoadingState message="Opening Communications..." />;

  return (
    <div className="h-[calc(100vh-80px)] min-h-[620px] w-full font-sans text-text-primary flex overflow-hidden rounded-3xl border border-white/[0.08] bg-[#090A12] shadow-2xl">
      {/* ── COLUMN 1: CONVERSATIONS LIST PANE ── */}
      <div className="w-full md:w-80 lg:w-84 border-r border-white/[0.08] bg-[#0C0D18] flex flex-col shrink-0">
        {/* Conversations Header */}
        <div className="p-4 pt-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white tracking-tight">Conversations</h2>
          <button className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs: All, Direct, Groups, Archived */}
        <div className="p-3 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'direct', 'groups', 'archived'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-[#6D28D9] text-white shadow-purple-glow'
                  : 'bg-transparent text-text-muted hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Conversations Box */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141628] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder:text-text-muted outline-none focus:border-purple-500/50"
            />
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted absolute right-3.5 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Conversations Roster Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {conversationsList.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative ${
                  isActive
                    ? 'bg-[#18192E] border border-purple-500/50 shadow-purple-glow'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {/* Overlapping or Single Avatar with Active Status Dot */}
                <div className="relative shrink-0">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#121324] bg-purple-600">
                      <img src={conv.avatars[0]} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    {conv.avatars[1] && (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#121324] bg-indigo-600">
                        <img src={conv.avatars[1]} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-[#121324]" />
                </div>

                {/* Conversation Title and Last Message */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{conv.title}</h4>
                    <span className="text-[10px] text-text-muted">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate leading-tight font-sans">
                    {conv.lastMsg}
                  </p>
                </div>

                {/* Unread Pill Badge */}
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shrink-0">
                    {conv.unread}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COLUMN 2: MAIN CHAT STREAM PANE ── */}
      <div className="flex-1 flex flex-col bg-[#090A12] min-w-0">
        {/* Main Header Bar */}
        <div className="p-3.5 px-5 border-b border-white/[0.08] bg-[#0E0F1D]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex -space-x-2 shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#0E0F1D] bg-purple-600">
                <img src={currentConv.avatars[0]} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {currentConv.avatars[1] && (
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#0E0F1D] bg-indigo-600">
                  <img src={currentConv.avatars[1]} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white truncate">{currentConv.title}</h3>
                <Star className="w-3.5 h-3.5 text-text-muted hover:text-amber-400 transition-colors cursor-pointer" />
              </div>
              <span className="text-[11px] text-text-muted truncate block font-medium">
                @ {currentConv.topic}
              </span>
            </div>
          </div>

          {/* Action Icons + LLM Status Chip Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsLlmModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                llmInfo.isConfigured
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 shadow-purple-glow'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title="Configure LLM Provider & API Keys"
            >
              <span className={`w-2 h-2 rounded-full ${llmInfo.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{llmInfo.statusLabel}</span>
              <span className="sm:hidden">LLM</span>
            </button>

            <button className="w-8 h-8 rounded-xl hover:bg-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer">
              <Video className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-xl hover:bg-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-xl hover:bg-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer">
              <Info className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-xl hover:bg-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs (Chat | Details | Files | Tasks) */}
        <div className="px-5 border-b border-white/[0.06] bg-[#0E0F1D]/50 flex items-center gap-6 text-xs font-bold text-text-muted shrink-0">
          {(['chat', 'details', 'files', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`py-2.5 capitalize transition-all border-b-2 cursor-pointer ${
                activeSubTab === tab
                  ? 'text-purple-400 border-purple-500 font-extrabold'
                  : 'border-transparent hover:text-white font-medium'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-[#090A12]">
          {/* Centered Date Header */}
          <div className="text-center my-1">
            <span className="text-[11px] font-semibold text-text-muted">Today</span>
          </div>

          {/* Messages Feed */}
          {messages.map((msg, index) => {
            const isUser = msg.isUser;
            return (
              <div key={msg.id} className="space-y-1">
                <div
                  className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                >
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`flex flex-col max-w-[80%] sm:max-w-md ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Name and Timestamp */}
                    <div className="flex items-center gap-2 text-[11px] text-text-muted pb-1 px-1 font-sans">
                      <span className="font-bold text-white">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Bubble Content */}
                    <div className="relative group flex items-center gap-2">
                      <div
                        className={`p-3.5 px-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-md ${
                          isUser
                            ? 'bg-[#482098] text-white rounded-tr-xs border border-purple-500/30'
                            : 'bg-[#181A2A] text-white rounded-tl-xs border border-white/[0.08]'
                        }`}
                      >
                        {msg.content || (
                          <span className="inline-flex items-center gap-1.5 text-purple-300 italic">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                          </span>
                        )}
                      </div>

                      {/* Smiley Reaction Icon button for incoming messages */}
                      {!isUser && (
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-white rounded-lg hover:bg-white/[0.08] cursor-pointer">
                          <Smile className="w-4 h-4" />
                        </button>
                      )}

                      {/* Double Checkmark for user messages */}
                      {isUser && (
                        <div className="flex items-center text-purple-300 text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Reaction Badges below bubble */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        {msg.reactions.map((r, i) => (
                          <div
                            key={i}
                            className="bg-[#18192E] border border-white/[0.1] px-2 py-0.5 rounded-full text-[11px] font-bold text-white flex items-center gap-1 shadow-sm"
                          >
                            <span>{r.emoji}</span>
                            <span>{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show "New messages" purple divider line after 3rd message */}
                {index === 2 && (
                  <div className="relative my-6 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-purple-500/40" />
                    </div>
                    <div className="relative bg-[#090A12] px-3 text-[11px] font-semibold text-purple-400">
                      New messages
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (Footer) */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0E0F1D] shrink-0">
          <div className="flex items-center gap-2 bg-[#14162B] border border-white/[0.1] rounded-2xl p-2 px-3 focus-within:border-purple-500/60 transition-all">
            {/* Left Action Icons */}
            <button className="p-1.5 text-text-muted hover:text-white transition-colors cursor-pointer">
              <Plus className="w-4.5 h-4.5" />
            </button>
            <button className="p-1.5 text-text-muted hover:text-white transition-colors cursor-pointer">
              <AtSign className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-text-muted hover:text-white transition-colors cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-text-muted hover:text-white transition-colors cursor-pointer">
              <CheckSquare className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-text-muted hover:text-white transition-colors cursor-pointer">
              <Smile className="w-4 h-4" />
            </button>

            {/* Input Textarea */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${currentConv.partnerName}...`}
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-text-muted py-1 px-2 font-sans"
            />

            {/* Glowing Solid Purple Microphone Button */}
            <button className="w-9 h-9 rounded-full bg-[#6D28D9] hover:bg-[#7C3AED] text-white flex items-center justify-center shadow-purple-glow transition-all cursor-pointer border border-purple-400/30 shrink-0">
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Arrow Button */}
            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !inputText.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                inputText.trim() && !isStreaming
                  ? 'bg-[#6D28D9] hover:bg-[#7C3AED] text-white shadow-purple-glow'
                  : 'bg-white/[0.08] text-text-muted'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── COLUMN 3: RIGHT CONTEXT SIDEBAR (About this conversation) ── */}
      <div className="hidden lg:flex w-72 border-l border-white/[0.08] bg-[#0C0D18] p-4 flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 font-sans">
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-text-muted">
            About this conversation
          </h3>

          {/* Participants */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Participants
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Maya"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Maya</div>
                  <div className="text-[10px] text-purple-300">Lead Designer</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                    alt="Priya"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Priya (You)</div>
                  <div className="text-[10px] text-text-muted">Product Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Tag */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Topic
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300">
              <Edit3 className="w-3 h-3" />
              <span>{currentConv.tag}</span>
            </div>
          </div>

          {/* Related Goal */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Related Goal
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300">
              <Target className="w-3 h-3" />
              <span>{currentConv.relatedGoal}</span>
            </div>
          </div>

          {/* Shared Files Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Shared Files (3)
              </span>
              <span className="text-[10px] text-purple-400 hover:underline cursor-pointer">
                View all
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141628] border border-white/[0.06] hover:border-purple-500/30 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-white truncate font-medium">landing-page-v2.fig</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141628] border border-white/[0.06] hover:border-purple-500/30 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-white truncate font-medium">brand-guidelines-2026.pdf</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141628] border border-white/[0.06] hover:border-purple-500/30 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-white truncate font-medium">hero-copy-options.docx</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions (Mute & Archive) */}
        <div className="space-y-2 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => setMuteNotifications(!muteNotifications)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Mute Notifications</span>
            </div>
            <span className={`w-8 h-4 rounded-full p-0.5 transition-colors ${muteNotifications ? 'bg-purple-600' : 'bg-white/20'}`}>
              <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${muteNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>

          <button className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/[0.04] text-xs text-text-muted hover:text-rose-400 transition-colors cursor-pointer">
            <Archive className="w-4 h-4" />
            <span>Archive Conversation</span>
          </button>
        </div>
      </div>

      {/* LLM Connection Configuration Modal */}
      <LLMConfigModal
        isOpen={isLlmModalOpen}
        onClose={() => setIsLlmModalOpen(false)}
        onConfigSaved={() => setLlmRefresh((k) => k + 1)}
      />
    </div>
  );
};

export default ConversationsListPage;
