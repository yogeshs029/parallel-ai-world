import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border bg-background-surface/40',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-background-elevated border border-border flex items-center justify-center text-accent-cyan mb-4 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-1.5">{title}</h4>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
