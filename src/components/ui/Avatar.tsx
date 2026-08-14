import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PersonStatus } from '../../types';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  emoji?: string;
  avatarBg?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: PersonStatus | 'available' | 'busy' | 'away' | 'offline' | 'working' | 'thinking' | 'active' | 'idle' | string;
  isUser?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  emoji,
  avatarBg,
  size = 'md',
  status,
  isUser = false,
  className,
  ...props
}) => {
  const sizes = {
    xs: 'h-7 w-7 text-xs',
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-14 w-14 text-xl',
    xl: 'h-18 w-18 text-2xl',
  };

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-400 ring-background shadow-[0_0_8px_#34d399]',
    busy: 'bg-amber-400 ring-background shadow-[0_0_8px_#fbbf24]',
    away: 'bg-orange-400 ring-background',
    offline: 'bg-slate-600 ring-background',
    working: 'bg-emerald-400 ring-background shadow-[0_0_8px_#34d399]',
    active: 'bg-emerald-400 ring-background shadow-[0_0_8px_#34d399]',
    thinking: 'bg-amber-400 ring-background shadow-[0_0_8px_#fbbf24]',
    idle: 'bg-slate-500 ring-background',
  };

  const getDefaultBg = (seed: string) => {
    if (avatarBg) return avatarBg;
    if (isUser) return 'from-purple-600 to-indigo-600';
    const charCode = seed.charCodeAt(0) || 0;
    if (charCode % 4 === 0) return 'from-blue-600 to-indigo-700';
    if (charCode % 4 === 1) return 'from-purple-600 to-pink-600';
    if (charCode % 4 === 2) return 'from-emerald-600 to-teal-700';
    return 'from-amber-600 to-orange-700';
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl font-bold shrink-0 bg-gradient-to-br border border-white/10 text-white shadow-sm select-none',
        getDefaultBg(name),
        sizes[size],
        className,
      )}
      {...props}
    >
      {emoji ? (
        <span className="leading-none">{emoji}</span>
      ) : isUser ? (
        <User className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      ) : (
        <span className="font-sans font-semibold tracking-tight">{initials}</span>
      )}

      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full ring-2',
            statusColors[status] || 'bg-emerald-400 ring-background',
            size === 'xs' || size === 'sm' ? 'h-2.5 w-2.5 ring-1' : 'h-3 w-3',
            (status === 'working' || status === 'busy') && 'animate-pulse',
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
