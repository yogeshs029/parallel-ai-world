import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Globe, Users, Activity, Settings, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { siteConfig } from '../../config/site';

export interface MobileNavProps {
  onCreateWorldClick?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onCreateWorldClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-5 h-5" />;
      case 'Globe':
        return <Globe className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      case 'Settings':
        return <Settings className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-surface/95 backdrop-blur-lg border-t border-border px-2 pb-safe select-none">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {siteConfig.mobileNav.slice(0, 2).map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-purple-light font-bold' : 'text-text-muted hover:text-text-primary',
              )
            }
          >
            {getIcon(item.iconName)}
            <span className="mt-1">{item.title}</span>
          </NavLink>
        ))}

        {/* Center Quick Create Button */}
        {onCreateWorldClick && (
          <div className="flex items-center justify-center px-2">
            <button
              onClick={onCreateWorldClick}
              className="w-10 h-10 rounded-full bg-brand-purple hover:bg-brand-purple-dark text-white flex items-center justify-center shadow-lg shadow-brand-purple/30 transition-transform active:scale-95"
              aria-label="Create World"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {siteConfig.mobileNav.slice(2).map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-purple-light font-bold' : 'text-text-muted hover:text-text-primary',
              )
            }
          >
            {getIcon(item.iconName)}
            <span className="mt-1">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
