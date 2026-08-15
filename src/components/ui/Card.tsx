import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'cosmic' | 'subtle';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, isInteractive = false, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:  'bg-[#131525]/90 border border-white/[0.08] shadow-lg shadow-black/40 backdrop-blur-md text-text-primary',
      elevated: 'bg-[#17192C] border border-white/[0.12] shadow-xl shadow-black/50 text-text-primary',
      glass:    'bg-[#131525]/75 backdrop-blur-xl border border-white/[0.09] shadow-md text-text-primary',
      cosmic:   'bg-gradient-to-br from-[#16182E] to-[#0F101F] border border-purple-500/25 shadow-purple-900/20 shadow-lg text-text-primary',
      subtle:   'bg-[#0E0F1A]/80 border border-white/[0.06] text-text-primary',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[20px] transition-all duration-200 relative overflow-hidden',
          variants[variant],
          isInteractive &&
            'hover:border-purple-500/50 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer active:scale-[0.985]',
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
      className={cn('text-base font-bold text-text-primary tracking-tight font-sans', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-text-secondary leading-relaxed font-sans', className)} {...props}>
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
      className={cn('flex items-center p-4 pt-0 border-t border-white/[0.06] mt-2', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';
