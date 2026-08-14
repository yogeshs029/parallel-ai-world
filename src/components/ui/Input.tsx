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
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
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
              'w-full bg-background-deep text-text-primary text-sm rounded-lg border border-border px-3.5 py-2.5 transition-all duration-150',
              'placeholder:text-text-dim focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              IconToUse && 'pl-10',
              (RightIcon || onClear) && 'pr-10',
              error && 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose',
              className,
            )}
            {...props}
          />
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1 rounded hover:bg-background-hover text-text-muted hover:text-text-primary transition-colors"
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
        {error && <span className="text-xs text-accent-rose font-medium">{error}</span>}
        {!error && hint && <span className="text-xs text-text-dim">{hint}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
