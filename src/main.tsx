import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Automatic purge of any legacy demo data from prior testing sessions
try {
  const isPurged = localStorage.getItem('parallel_ai_clean_v3');
  if (!isPurged) {
    const keysToRemove = [
      'parallel_ai_worlds_v2',
      'parallel_ai_people_v2',
      'parallel_ai_tasks_v2',
      'parallel_ai_activities_v2',
      'parallel_ai_knowledge_notes_v2',
      'parallel_ai_memories_v2',
      'parallel_ai_knowledge_v1',
      'parallel_ai_notifications_v1',
      'parallel_ai_approvals_v1',
      'parallel_ai_chat_messages',
      'parallel_ai_conversations',
      'parallel_ai_world_experiences',
      'parallel_ai_worlds',
      'parallel_ai_people',
      'parallel_ai_tasks',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('parallel_ai_clean_v3', 'true');
  }
} catch (e) {
  console.warn('Storage purge error:', e);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
