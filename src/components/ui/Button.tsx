import React, { forwardRef } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-light focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C14] disabled:opacity-45 disabled:pointer-events-none active:scale-[0.96] cursor-pointer tracking-normal font-sans';

    const variants = {
      primary:
        'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-cosmos-glow hover:shadow-purple-glow font-semibold border border-purple-400/20',
      secondary:
        'bg-white/[0.07] hover:bg-white/[0.12] text-text-primary border border-white/[0.1] hover:border-purple-500/40 shadow-sm backdrop-blur-md',
      outline:
        'bg-transparent hover:bg-white/[0.07] text-text-secondary hover:text-text-primary border border-white/[0.12] hover:border-purple-500/40',
      ghost:
        'bg-transparent hover:bg-white/[0.08] text-text-secondary hover:text-text-primary',
      danger:
        'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30',
      emerald:
        'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-glow font-semibold border border-emerald-400/20',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8.5 rounded-lg',
      md: 'text-sm px-4.5 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-2.5 gap-2.5 h-11.5 rounded-xl font-semibold',
      icon: 'h-10 w-10 p-0 flex items-center justify-center rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          LeftIcon && <LeftIcon className={cn('w-4 h-4 shrink-0', size === 'sm' && 'w-3.5 h-3.5')} />
        )}
        {children}
        {!isLoading && RightIcon && (
          <RightIcon className={cn('w-4 h-4 shrink-0', size === 'sm' && 'w-3.5 h-3.5')} />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
