import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'working'
  | 'available'
  | 'thinking'
  | 'offline'
  | 'todo'
  | 'in_progress'
  | 'completed'
  | 'high'
  | 'medium'
  | 'low'
  | 'primary'
  | 'neutral'
  | 'ghost'
  // Backward compat
  | 'active'
  | 'idle'
  | 'running'
  | 'warning'
  | 'error'
  | 'info'
  | 'quantum'
  | 'celestial';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    working: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    available: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    thinking: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    offline: 'bg-slate-800 text-slate-400 border-slate-700',
    todo: 'bg-slate-800/80 text-slate-300 border-slate-700',
    in_progress: 'bg-brand-purple-subtle text-purple-300 border-purple-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
    primary: 'bg-brand-purple-subtle text-purple-300 border-purple-500/30',
    neutral: 'bg-background-elevated text-text-secondary border-border',
    ghost: 'bg-transparent text-text-muted border-transparent',
    
    // Backward compat mappings
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    idle: 'bg-slate-800 text-slate-400 border-slate-700',
    running: 'bg-brand-purple-subtle text-purple-300 border-purple-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    quantum: 'bg-brand-purple-subtle text-purple-300 border-purple-500/30',
    celestial: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  const dotColors: Record<BadgeVariant, string> = {
    working: 'bg-emerald-400',
    available: 'bg-cyan-400',
    thinking: 'bg-amber-400',
    offline: 'bg-slate-500',
    todo: 'bg-slate-400',
    in_progress: 'bg-purple-400',
    completed: 'bg-emerald-400',
    high: 'bg-rose-400',
    medium: 'bg-amber-400',
    low: 'bg-slate-400',
    primary: 'bg-purple-400',
    neutral: 'bg-slate-400',
    ghost: 'bg-slate-500',
    active: 'bg-emerald-400',
    idle: 'bg-slate-500',
    running: 'bg-purple-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-blue-400',
    quantum: 'bg-purple-400',
    celestial: 'bg-amber-400',
  };

  const sizes = {
    sm: 'text-[11px] font-medium px-2.5 py-0.5 rounded-lg gap-1.5',
    md: 'text-xs font-medium px-3 py-1 rounded-lg gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none font-sans font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant],
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
};
