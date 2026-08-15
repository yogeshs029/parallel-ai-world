import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Globe, Users, Activity, MoreHorizontal, Target, CheckSquare, Settings, X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileNavProps {
  onCreateWorldClick?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onCreateWorldClick }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainItems = [
    { href: '/', title: 'Home', icon: Home, exact: true },
    { href: '/worlds', title: 'Worlds', icon: Globe },
    { href: '/people', title: 'People', icon: Users },
    { href: '/activity', title: 'Activity', icon: Activity },
  ];

  const secondaryItems = [
    { href: '/goals', title: 'Goals & Plans', icon: Target, desc: 'Strategic milestones & autonomous plans' },
    { href: '/tasks', title: 'Tasks Stream', icon: CheckSquare, desc: 'Running and completed tasks' },
    { href: '/settings', title: 'System Settings', icon: Settings, desc: 'AI models, keys & reset database' },
  ];

  return (
    <>
      {/* ── Slide-Up More Drawer ── */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in font-sans">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-[#0E1020] border-t border-white/[0.12] rounded-t-3xl p-5 pb-safe z-50 space-y-4 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">More Sections</h3>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-text-muted hover:text-white cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3.5 p-3.5 rounded-2xl transition-all border min-h-[48px]',
                        isActive
                          ? 'bg-purple-600/20 border-purple-500/40 text-white shadow-purple-glow'
                          : 'bg-white/[0.03] border-white/[0.06] text-text-secondary hover:bg-white/[0.08] hover:text-white',
                      )
                    }
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-text-muted truncate">{item.desc}</div>
                    </div>
                  </NavLink>
                );
              })}

              {onCreateWorldClick && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onCreateWorldClick();
                  }}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-purple-glow transition-all cursor-pointer min-h-[48px] mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New World</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Mobile Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0E1A]/95 backdrop-blur-2xl border-t border-white/[0.08] select-none shadow-2xl shadow-black/80 font-sans"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto px-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] gap-0.5 transition-all duration-200 cursor-pointer',
                    isActive ? 'text-white' : 'text-text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-glow text-white'
                          : 'bg-transparent text-text-muted',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold transition-colors',
                        isActive ? 'text-purple-300' : 'text-text-muted',
                      )}
                    >
                      {item.title}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] gap-0.5 transition-all duration-200 cursor-pointer',
              isMoreOpen ? 'text-white' : 'text-text-muted',
            )}
            aria-label="Open More Sections"
          >
            <span
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                isMoreOpen ? 'bg-purple-600/30 text-purple-300' : 'bg-transparent text-text-muted',
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-text-muted">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
