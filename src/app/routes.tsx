import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
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
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
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
        path: 'world/:worldId',
        element: <WorldDetailPage />,
      },
      {
        path: 'world/:worldId/memory',
        element: <WorldMemoryPage />,
      },
      {
        path: 'world/:worldId/knowledge',
        element: <WorldKnowledgePage />,
      },
      {
        path: 'world/:worldId/knowledge/:knowledgeId',
        element: <KnowledgeDetailPage />,
      },
      {
        path: 'world/:worldId/people',
        element: <WorldPeoplePage />,
      },
      {
        path: 'world/:worldId/people/:personId',
        element: <PersonDetailPage />,
      },
      {
        path: 'world/:worldId/people/:personId/memory',
        element: <PersonMemoryPage />,
      },
      {
        path: 'world/:worldId/people/:personId/knowledge',
        element: <PersonKnowledgePage />,
      },
      {
        path: 'world/:worldId/people/:personId/chat',
        element: <PersonChatPage />,
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
]);
