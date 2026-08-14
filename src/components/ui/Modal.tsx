import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background-deep/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-background-surface border border-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col my-auto animate-slide-up',
          sizes[size],
          className,
        )}
      >
        {/* Optional Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 pb-3 border-b border-border">
            <div>
              {title && (
                <h3 id="modal-title" className="text-base font-bold text-text-primary tracking-tight font-sans">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed font-sans">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-background-elevated transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 border-t border-border bg-background-deep/40 flex items-center justify-end space-x-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
