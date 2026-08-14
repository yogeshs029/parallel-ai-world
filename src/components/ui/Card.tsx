import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'cosmic' | 'subtle';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, isInteractive = false, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:  'cosmos-card',
      elevated: 'cosmos-card bg-[rgba(28,38,60,0.92)]',
      glass:    'bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-cosmos-sm',
      cosmic:   'cosmos-card bg-gradient-to-b from-[rgba(26,36,64,0.9)] to-[rgba(16,24,48,0.85)]',
      subtle:   'bg-[rgba(14,20,36,0.5)] backdrop-blur-md border border-white/06 rounded-[20px]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[20px] transition-all duration-200 relative overflow-hidden',
          variants[variant],
          isInteractive && 'cosmos-card-interactive',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props}>
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-sm font-bold text-text-primary tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-text-secondary leading-relaxed', className)} {...props}>
      {children}
    </p>
  ),
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-2', className)} {...props}>
      {children}
    </div>
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-4 pt-0 border-t border-white/08 mt-2', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';
