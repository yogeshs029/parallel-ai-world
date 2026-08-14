import React from 'react';
import { Plus, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';

export interface HeroSectionProps {
  onCreateWorldClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCreateWorldClick }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-background-card via-background-surface to-background-deep p-6 sm:p-10 shadow-card-subtle">
      {/* Subtle warm ambient highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-brand-purple-light text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your worlds. Your people. Your intelligence.</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight font-sans">
          What do you want to create?
        </h1>

        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
          Build persistent spaces for your home, business, study, and creative projects—then
          bring them to life with intelligent people who think, remember, and get things done.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            leftIcon={Plus}
            onClick={onCreateWorldClick}
          >
            Create a World
          </Button>
          <Link to="/worlds">
            <Button variant="secondary" size="lg" rightIcon={ArrowRight}>
              View My Worlds
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
