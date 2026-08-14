import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'cosmic' | 'subtle';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, isInteractive = false, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:  'bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50',
      elevated: 'bg-white border border-slate-200 shadow-md shadow-slate-200/60',
      glass:    'bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm',
      cosmic:   'bg-white border border-slate-200/80 shadow-sm',
      subtle:   'bg-slate-50/80 border border-slate-200/60',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[18px] transition-all duration-200 relative overflow-hidden',
          variants[variant],
          isInteractive && 'hover:border-[#007aff]/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.985]',
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
      className={cn('text-sm font-bold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-600 leading-relaxed', className)} {...props}>
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
      className={cn('flex items-center p-4 pt-0 border-t border-slate-100 mt-2', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';
