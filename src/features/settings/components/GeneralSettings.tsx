import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const GeneralSettings: React.FC = () => {
  const [userName, setUserName] = useState('Alex');
  const [email, setEmail] = useState('alex@example.com');
  const [defaultWorld, setDefaultWorld] = useState('world-company');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <CardTitle>Profile & Preferences</CardTitle>
          <CardDescription>
            Manage your personal profile and default world configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Default Opening World</label>
            <select
              value={defaultWorld}
              onChange={(e) => setDefaultWorld(e.target.value)}
              className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
            >
              <option value="world-company">🏢 My Company</option>
              <option value="world-home">🏠 My Home</option>
              <option value="world-study">📚 My Study World</option>
              <option value="world-story">🎮 Elysium Chronicles</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xs text-brand-emerald font-medium">
            {isSaved && '✓ Preferences saved successfully'}
          </span>
          <Button variant="primary" size="sm" type="submit">
            Save Preferences
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
