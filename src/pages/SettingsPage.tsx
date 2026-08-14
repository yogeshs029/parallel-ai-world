import React, { useState } from 'react';
import { Settings, Smartphone, Palette } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { GeneralSettings } from '../features/settings/components/GeneralSettings';
import { DisplaySettings } from '../features/settings/components/DisplaySettings';
import { CapacitorBridgeStatus } from '../features/settings/components/CapacitorBridgeStatus';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    {
      id: 'general',
      label: 'System & Kernel',
      icon: Settings,
    },
    {
      id: 'display',
      label: 'Appearance',
      icon: Palette,
    },
    {
      id: 'bridge',
      label: 'Capacitor Bridge',
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="System Settings"
        subtitle="Manage kernel environment variables, appearance parameters, and cross-platform bridge diagnostics."
        breadcrumbs={[{ label: 'Settings' }]}
        badge={
          <Badge variant="quantum" size="sm">
            Core Configuration
          </Badge>
        }
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
        className="mb-6"
      />

      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'display' && <DisplaySettings />}
      {activeTab === 'bridge' && <CapacitorBridgeStatus />}
    </div>
  );
};
