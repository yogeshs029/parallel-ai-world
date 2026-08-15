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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      {/* High-elevation backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-fade-in z-[9999]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-[#121426] border border-white/[0.14] rounded-3xl shadow-2xl z-[10000] overflow-hidden flex flex-col my-auto max-h-[90vh] text-text-primary animate-slide-up',
          sizes[size],
          className,
        )}
      >
        {/* Sticky Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/[0.08] bg-[#121426] shrink-0 z-10">
            <div className="min-w-0 pr-2">
              {title && (
                <h3 id="modal-title" className="text-base sm:text-lg font-black text-white tracking-tight font-sans truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-secondary mt-0.5 sm:mt-1 leading-relaxed font-sans line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-white p-1.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 custom-scrollbar min-h-0 space-y-4 text-xs sm:text-sm">
          {children}
        </div>

        {/* Sticky Modal Footer */}
        {footer && (
          <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-white/[0.08] bg-[#0E101E]/95 backdrop-blur-md flex items-center justify-end space-x-2.5 shrink-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
