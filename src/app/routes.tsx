import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { WorldShell } from '../components/layout/WorldShell';
import { DashboardPage } from '../pages/DashboardPage';
import { WorldsPage } from '../pages/WorldsPage';
import { WorldDetailPage } from '../pages/WorldDetailPage';
import { WorldPeoplePage } from '../pages/WorldPeoplePage';
import { PersonDetailPage } from '../pages/PersonDetailPage';
import { PersonChatPage } from '../pages/PersonChatPage';
import { WorldMemoryPage } from '../pages/WorldMemoryPage';
import { PersonMemoryPage } from '../pages/PersonMemoryPage';
import { WorldKnowledgePage } from '../pages/WorldKnowledgePage';
import { KnowledgeDetailPage } from '../pages/KnowledgeDetailPage';
import { PersonKnowledgePage } from '../pages/PersonKnowledgePage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { PeoplePage } from '../pages/PeoplePage';
import { ActivityPage } from '../pages/ActivityPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PersonCapabilitiesPage } from '../pages/PersonCapabilitiesPage';
import { WorldToolsSettingsPage } from '../pages/WorldToolsSettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  // ── 1. GLOBAL PARALLEL APPLICATION SHELL ──
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'home',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'worlds',
        element: <WorldsPage />,
      },
      {
        path: 'world',
        element: <Navigate to="/worlds" replace />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'people',
        element: <PeoplePage />,
      },
      {
        path: 'agents',
        element: <Navigate to="/people" replace />,
      },
      {
        path: 'members',
        element: <Navigate to="/people" replace />,
      },
      {
        path: 'activity',
        element: <ActivityPage />,
      },
      {
        path: 'tasks',
        element: <Navigate to="/worlds" replace />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // ── 2. LIVING WORLD ENVIRONMENT SHELL ──
  {
    path: 'world/:worldId',
    element: <WorldShell />,
    children: [
      {
        index: true,
        element: <WorldDetailPage />,
      },
      {
        path: 'memory',
        element: <WorldMemoryPage />,
      },
      {
        path: 'knowledge',
        element: <WorldKnowledgePage />,
      },
      {
        path: 'knowledge/:knowledgeId',
        element: <KnowledgeDetailPage />,
      },
      {
        path: 'people',
        element: <WorldPeoplePage />,
      },
      {
        path: 'people/:personId',
        element: <PersonDetailPage />,
      },
      {
        path: 'people/:personId/memory',
        element: <PersonMemoryPage />,
      },
      {
        path: 'people/:personId/knowledge',
        element: <PersonKnowledgePage />,
      },
      {
        path: 'people/:personId/chat',
        element: <PersonChatPage />,
      },
      {
        path: 'people/:personId/capabilities',
        element: <PersonCapabilitiesPage />,
      },
      {
        path: 'settings/tools',
        element: <WorldToolsSettingsPage />,
      },
      {
        path: 'tools',
        element: <WorldToolsSettingsPage />,
      },
    ],
  },
]);
