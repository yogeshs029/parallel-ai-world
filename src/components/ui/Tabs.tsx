import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'line' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  className,
}) => {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-background-deep rounded-xl border border-border overflow-x-auto max-w-full no-scrollbar',
          className,
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-background-elevated text-text-primary shadow-sm border border-border-bright/50'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-surface/50',
                tab.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                    isActive ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-background-card text-text-muted',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex border-b border-border space-x-6 overflow-x-auto no-scrollbar',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'group relative flex items-center gap-2 pb-3.5 text-sm font-medium transition-colors whitespace-nowrap',
              isActive ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
              tab.disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-text-secondary',
                )}
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-colors',
                  isActive ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-background-elevated text-text-muted',
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan shadow-glow-cyan" />
            )}
          </button>
        );
      })}
    </div>
  );
};
