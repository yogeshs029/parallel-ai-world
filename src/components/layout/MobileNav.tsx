import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Globe, Users, Activity, Settings, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { siteConfig } from '../../config/site';

export interface MobileNavProps {
  onCreateWorldClick?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onCreateWorldClick }) => {
  const navItems = siteConfig.mobileNav;

  const getIcon = (iconName: string, isActive?: boolean) => {
    const cls = cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-110');
    switch (iconName) {
      case 'Home':     return <Home className={cls} />;
      case 'Globe':    return <Globe className={cls} />;
      case 'Users':    return <Users className={cls} />;
      case 'Activity': return <Activity className={cls} />;
      case 'Settings': return <Settings className={cls} />;
      default:         return <Home className={cls} />;
    }
  };

  const half1 = navItems.slice(0, 2);
  const half2 = navItems.slice(2);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 cosmos-bottom-nav pb-safe select-none">
      <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-2">
        {/* First two items */}
        {half1.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full pt-2 gap-1 transition-all duration-200 relative',
                isActive ? 'text-[#7c9bf7]' : 'text-text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#7c9bf7]" />
                )}
                <span className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive ? 'bg-[#7c9bf7]/15' : 'bg-transparent',
                )}>
                  {getIcon(item.iconName, isActive)}
                </span>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#a5bef9]' : 'text-text-dim',
                )}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB */}
        {onCreateWorldClick && (
          <div className="flex items-center justify-center px-3">
            <button
              onClick={onCreateWorldClick}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c9bf7] to-[#7c4af7] text-white flex items-center justify-center shadow-cosmos-glow transition-all duration-200 hover:opacity-90 active:scale-90"
              aria-label="Create World"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Last two items */}
        {half2.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full pt-2 gap-1 transition-all duration-200 relative',
                isActive ? 'text-[#7c9bf7]' : 'text-text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#7c9bf7]" />
                )}
                <span className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive ? 'bg-[#7c9bf7]/15' : 'bg-transparent',
                )}>
                  {getIcon(item.iconName, isActive)}
                </span>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#a5bef9]' : 'text-text-dim',
                )}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
