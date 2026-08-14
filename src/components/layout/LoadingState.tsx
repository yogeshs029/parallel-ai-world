import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingStateProps {
  label?: string;
  message?: string;
  description?: string;
  isFullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label,
  message,
  description = 'Getting everything ready...',
  isFullScreen = false,
  className,
}) => {
  const displayLabel = label || message || 'Loading...';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        isFullScreen ? 'min-h-screen bg-background' : 'min-h-[260px] w-full',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-2xl bg-background-elevated border border-border flex items-center justify-center text-brand-purple-light shadow-sm mb-3">
        <Loader2 className="w-5 h-5 animate-spin text-brand-purple-light" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-0.5 font-sans">
        {displayLabel}
      </h3>
      <p className="text-xs text-text-muted max-w-xs font-sans">{description}</p>
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-background-surface/60 p-5 space-y-3 animate-pulse',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-background-elevated rounded w-1/3" />
        <div className="h-4 bg-background-elevated rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-background-elevated/70 rounded w-full" />
        <div className="h-3 bg-background-elevated/70 rounded w-4/5" />
      </div>
    </div>
  );
};
