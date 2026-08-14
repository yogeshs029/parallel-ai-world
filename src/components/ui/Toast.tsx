import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ToastContext, ToastItem } from '../../hooks/useToast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = 'info', duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, type, duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'success' });
    },
    [showToast],
  );

  const error = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'error' });
    },
    [showToast],
  );

  const info = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: 'info' });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 animate-slide-up transition-all font-sans',
                isSuccess && 'bg-background-surface/95 border-emerald-500/40 text-text-primary backdrop-blur-md',
                isError && 'bg-background-surface/95 border-rose-500/40 text-text-primary backdrop-blur-md',
                !isSuccess && !isError && 'bg-background-surface/95 border-brand-purple/40 text-text-primary backdrop-blur-md',
              )}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-purple-light shrink-0 mt-0.5" />}

              <div className="flex-1 space-y-0.5">
                <h5 className="text-xs font-bold text-text-primary">{toast.title}</h5>
                {toast.description && (
                  <p className="text-[11px] text-text-secondary leading-snug">{toast.description}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-muted hover:text-text-primary p-0.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
