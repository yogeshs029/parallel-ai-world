import React, { forwardRef } from 'react';
import { LucideIcon, X, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onClear?: () => void;
  isSearch?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onClear,
      isSearch = false,
      value,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const IconToUse = isSearch ? Search : LeftIcon;

    return (
      <div className="w-full flex flex-col space-y-1.5 font-sans">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {IconToUse && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
              <IconToUse className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full bg-[#15172A] text-text-primary text-sm rounded-xl border border-white/[0.1] px-3.5 py-2.5 transition-all duration-150',
              'placeholder:text-text-muted focus:outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light/25 focus:bg-[#181B32]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              IconToUse && 'pl-10',
              (RightIcon || onClear) && 'pr-10',
              error && 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/25',
              className,
            )}
            {...props}
          />
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1 rounded-lg hover:bg-white/[0.08] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!onClear && RightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-text-muted">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {!error && hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
