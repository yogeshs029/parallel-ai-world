import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: '-top-8 left-1/2 -translate-x-1/2',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -left-2 -translate-y-1/2 -translate-x-full',
    right: 'top-1/2 -right-2 -translate-y-1/2 translate-x-full',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-[11px] font-medium text-text-primary bg-background-elevated border border-border-bright rounded shadow-lg pointer-events-none whitespace-nowrap animate-fade-in',
            positions[position],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
