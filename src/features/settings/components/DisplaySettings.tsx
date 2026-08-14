import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';

export const DisplaySettings: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [animations, setAnimations] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display & Notifications</CardTitle>
        <CardDescription>
          Customize visual appearance, animations, and activity notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border">
          <div>
            <div className="text-xs font-bold text-text-primary">Color Theme</div>
            <div className="text-[11px] text-text-muted">Currently using custom dark mode</div>
          </div>
          <div className="flex items-center gap-1 bg-background-deep p-1 rounded-lg border border-border">
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                theme === 'dark' ? 'bg-brand-purple text-white' : 'text-text-muted'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                theme === 'system' ? 'bg-brand-purple text-white' : 'text-text-muted'
              }`}
            >
              System
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border">
          <div>
            <div className="text-xs font-bold text-text-primary">Smooth Animations</div>
            <div className="text-[11px] text-text-muted">Enable micro-interactions and transitions</div>
          </div>
          <input
            type="checkbox"
            checked={animations}
            onChange={(e) => setAnimations(e.target.checked)}
            className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border">
          <div>
            <div className="text-xs font-bold text-text-primary">Activity Updates</div>
            <div className="text-[11px] text-text-muted">Notify when people complete tasks</div>
          </div>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
};
