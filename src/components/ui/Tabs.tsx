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
  if (variant === 'segmented' || variant === 'pills') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-[#131525] rounded-2xl border border-white/[0.08] overflow-x-auto max-w-full no-scrollbar gap-1',
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
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none',
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]',
                tab.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-text-muted',
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
        'flex border-b border-white/[0.08] space-x-6 overflow-x-auto no-scrollbar',
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
              'group relative flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer select-none',
              isActive ? 'text-brand-purple-light' : 'text-text-secondary hover:text-text-primary',
              tab.disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-brand-purple-light' : 'text-text-muted group-hover:text-text-secondary',
                )}
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors font-bold',
                  isActive ? 'bg-purple-500/20 text-brand-purple-light' : 'bg-white/[0.08] text-text-muted',
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple-light shadow-purple-glow rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
