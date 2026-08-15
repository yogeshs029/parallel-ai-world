import React, { useState } from 'react';
import { Plus, Sparkles, Globe, ArrowRight, Bot, Target, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export interface HeroSectionProps {
  onCreateWorldClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCreateWorldClick }) => {
  const navigate = useNavigate();
  const [commandPrompt, setCommandPrompt] = useState('');

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandPrompt.trim()) return;
    navigate(`/conversations?prompt=${encodeURIComponent(commandPrompt.trim())}`);
  };

  const quickPrompts = [
    { label: 'Website Redesign', icon: Target, action: () => navigate('/conversations') },
    { label: 'Marketing Campaign', icon: MessageSquare, action: () => navigate('/conversations') },
    { label: 'Deploy AI Agents', icon: Bot, action: () => navigate('/people') },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#121426] via-[#16182E] to-[#0D0E1A] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/50">
      {/* Background glowing space nebulas */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Headline, Quick Command Bar, and Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Welcome back, Yogesh 👋</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-sans leading-tight">
            Build worlds. Empower people.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent block sm:inline">
              Achieve anything.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans max-w-xl">
            Direct autonomous AI people who collaborate, plan strategies, and execute milestones in real time.
          </p>

          {/* Quick AI Command Launcher Bar */}
          <form onSubmit={handleCommandSubmit} className="pt-1">
            <div className="relative flex items-center bg-[#15172A]/90 border border-purple-500/40 rounded-2xl p-1.5 focus-within:border-purple-500/80 focus-within:shadow-purple-glow transition-all">
              <input
                type="text"
                value={commandPrompt}
                onChange={(e) => setCommandPrompt(e.target.value)}
                placeholder="What would you like your AI World to do today?..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-text-muted outline-none font-sans"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Tag Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              <span className="text-[11px] font-semibold text-text-muted">Quick triggers:</span>
              {quickPrompts.map((qp, i) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={qp.action}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/30 text-[11px] font-semibold text-text-secondary hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <Icon className="w-3 h-3 text-purple-400" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </form>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={onCreateWorldClick}
              className="shadow-purple-glow hover:scale-105 transition-all cursor-pointer border border-purple-400/30"
            >
              Create World
            </Button>
            <Link to="/worlds">
              <Button
                variant="secondary"
                size="md"
                className="bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.15] cursor-pointer text-xs"
              >
                Explore Worlds
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: 3D Glowing Orbit Planet Avatar Graphic */}
        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[220px] sm:min-h-[260px]">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Orbit Ring 1 */}
            <div className="absolute inset-0 rounded-full border border-purple-500/25 animate-spin-slow pointer-events-none" />

            {/* Orbit Ring 2 tilted */}
            <div
              className="absolute inset-2 rounded-full border border-indigo-500/20 pointer-events-none"
              style={{ transform: 'rotateX(60deg) rotateY(20deg)' }}
            />

            {/* Glowing Space Nebulae Core */}
            <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 blur-2xl opacity-60 animate-pulse-soft" />

            {/* Central 3D Glowing Planet Orb */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-950 p-1 shadow-purple-glow flex items-center justify-center overflow-hidden border border-purple-400/40 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />
              <Globe className="w-24 h-24 text-white/30 animate-spin-slow opacity-60" />
              <div className="absolute text-center p-2 z-10">
                <span className="text-xs font-extrabold text-white tracking-widest uppercase block drop-shadow-md">
                  PARALLEL
                </span>
                <span className="text-[9px] font-bold text-purple-200 tracking-wider">
                  AI WORLD
                </span>
              </div>
            </div>

            {/* Orbiting Avatar Nodes */}
            <div className="absolute top-1 right-2 flex flex-col items-center animate-orbit-float">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border-2 border-[#121426] shadow-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Maya"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[9px] font-bold text-purple-300 bg-[#0F101D]/90 px-1.5 py-0.2 rounded-full border border-purple-500/30 mt-0.5 shadow-sm">
                Maya
              </span>
            </div>

            <div
              className="absolute bottom-2 left-1 flex flex-col items-center animate-orbit-float"
              style={{ animationDelay: '1.5s' }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 border-2 border-[#121426] shadow-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Rahul"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[9px] font-bold text-indigo-300 bg-[#0F101D]/90 px-1.5 py-0.2 rounded-full border border-indigo-500/30 mt-0.5 shadow-sm">
                Rahul
              </span>
            </div>

            <div
              className="absolute top-1/2 -left-3 -translate-y-1/2 flex flex-col items-center animate-orbit-float"
              style={{ animationDelay: '3s' }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 border-2 border-[#121426] shadow-lg overflow-hidden flex items-center justify-center text-[10px] font-bold text-white">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                  alt="Priya"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div
              className="absolute bottom-1 right-6 flex flex-col items-center animate-orbit-float"
              style={{ animationDelay: '4.5s' }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border-2 border-[#121426] shadow-lg overflow-hidden flex items-center justify-center text-[10px] font-bold text-white">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="Alex"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
