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
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background-deep disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] cursor-pointer tracking-normal font-sans';

    const variants = {
      primary:
        'bg-brand-purple text-white hover:bg-brand-purple-dark shadow-sm hover:shadow-brand-glow font-semibold',
      secondary:
        'bg-background-elevated hover:bg-background-hover text-text-primary border border-border hover:border-brand-purple/40 shadow-sm',
      outline:
        'bg-transparent hover:bg-background-surface text-text-secondary hover:text-text-primary border border-border hover:border-brand-purple/50',
      ghost:
        'bg-transparent hover:bg-background-surface text-text-secondary hover:text-text-primary',
      danger:
        'bg-brand-rose-subtle text-brand-rose hover:bg-brand-rose/20 border border-brand-rose/30',
      emerald:
        'bg-brand-emerald text-white hover:bg-emerald-600 shadow-sm hover:shadow-emerald-glow font-semibold',
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
