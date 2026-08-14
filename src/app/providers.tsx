import React, { ReactNode } from 'react';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import { ToastProvider } from '../components/ui/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
};
