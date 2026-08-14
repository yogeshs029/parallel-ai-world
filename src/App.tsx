import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { WorldsPage } from './pages/WorldsPage';
import { WorldDetailPage } from './pages/WorldDetailPage';
import { WorldPeoplePage } from './pages/WorldPeoplePage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { PersonChatPage } from './pages/PersonChatPage';
import { WorldMemoryPage } from './pages/WorldMemoryPage';
import { PersonMemoryPage } from './pages/PersonMemoryPage';
import { WorldKnowledgePage } from './pages/WorldKnowledgePage';
import { KnowledgeDetailPage } from './pages/KnowledgeDetailPage';
import { PersonKnowledgePage } from './pages/PersonKnowledgePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PeoplePage } from './pages/PeoplePage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RelationshipGraphPage } from './pages/RelationshipGraphPage';
import { ConversationsListPage } from './pages/ConversationsListPage';
import { ConversationDetailPage } from './pages/ConversationDetailPage';


export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />

              <Route path="worlds" element={<WorldsPage />} />
              <Route path="world" element={<Navigate to="/worlds" replace />} />
              <Route path="world/:worldId" element={<WorldDetailPage />} />
              <Route path="world/:worldId/memory" element={<WorldMemoryPage />} />
              <Route path="world/:worldId/knowledge" element={<WorldKnowledgePage />} />
              <Route path="world/:worldId/knowledge/:knowledgeId" element={<KnowledgeDetailPage />} />
              <Route path="world/:worldId/people" element={<WorldPeoplePage />} />
              <Route path="world/:worldId/people/:personId" element={<PersonDetailPage />} />
              <Route path="world/:worldId/people/:personId/memory" element={<PersonMemoryPage />} />
              <Route path="world/:worldId/people/:personId/knowledge" element={<PersonKnowledgePage />} />
              <Route path="world/:worldId/people/:personId/chat" element={<PersonChatPage />} />

              <Route path="world/:worldId/relationships" element={<RelationshipGraphPage />} />
              <Route path="world/:worldId/conversations" element={<ConversationsListPage />} />
              <Route path="world/:worldId/conversations/:conversationId" element={<ConversationDetailPage />} />

              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="agents" element={<Navigate to="/people" replace />} />
              <Route path="members" element={<Navigate to="/people" replace />} />

              <Route path="activity" element={<ActivityPage />} />
              <Route path="tasks" element={<Navigate to="/worlds" replace />} />
              <Route path="settings" element={<SettingsPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};
export default App;
