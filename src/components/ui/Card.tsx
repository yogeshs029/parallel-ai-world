import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'cosmic' | 'subtle';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, isInteractive = false, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-background-surface border border-border shadow-card-subtle',
      elevated:
        'bg-background-card border border-border shadow-card-subtle',
      glass:
        'bg-background-surface/80 backdrop-blur-md border border-border/80 shadow-card-subtle',
      cosmic:
        'bg-background-surface border border-border hover:border-brand-purple/40 shadow-card-subtle',
      subtle:
        'bg-background-deep/60 border border-border/60',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200 relative overflow-hidden',
          variants[variant],
          isInteractive &&
            'hover:border-brand-purple/40 hover:bg-background-card hover:shadow-card-hover cursor-pointer transform hover:-translate-y-0.5',
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
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-base font-bold text-text-primary tracking-tight font-sans', className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-text-secondary leading-relaxed font-sans', className)}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-5 pt-2', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-5 pt-0 border-t border-border/60 mt-2 pt-3.5', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CardFooter.displayName = 'CardFooter';
