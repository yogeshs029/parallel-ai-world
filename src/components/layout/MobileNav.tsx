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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 pb-safe select-none shadow-lg shadow-black/5">
      <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-2">
        {half1.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full pt-1 gap-0.5 transition-all duration-200 relative',
                isActive ? 'text-[#007aff]' : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive ? 'bg-[#007aff]/10' : 'bg-transparent',
                )}>
                  {getIcon(item.iconName, isActive)}
                </span>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#007aff]' : 'text-slate-400',
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
              className="w-11 h-11 rounded-2xl bg-[#007aff] text-white flex items-center justify-center shadow-md shadow-[#007aff]/30 transition-all duration-200 active:scale-90"
              aria-label="Create World"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {half2.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full pt-1 gap-0.5 transition-all duration-200 relative',
                isActive ? 'text-[#007aff]' : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive ? 'bg-[#007aff]/10' : 'bg-transparent',
                )}>
                  {getIcon(item.iconName, isActive)}
                </span>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-[#007aff]' : 'text-slate-400',
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
