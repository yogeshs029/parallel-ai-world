import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import { WorldExperience } from '../../../types/experience';
import { World } from '../../../types';

export interface WorldFooterProps {
  world: World;
  experience: WorldExperience;
}

export const WorldFooter: React.FC<WorldFooterProps> = ({ world, experience }) => {
  if (!experience.footerConfig.enabled) return null;

  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0B16] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted font-sans shrink-0">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-purple-400" />
        <span className="font-bold text-white">{world.name}</span>
        {experience.footerConfig.customText && (
          <span>• {experience.footerConfig.customText}</span>
        )}
      </div>

      {experience.footerConfig.showReturnHome && (
        <Link
          to="/worlds"
          className="flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to My Worlds
        </Link>
      )}
    </footer>
  );
};
