import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  badge,
  breadcrumbs,
  actions,
  className,
}) => {
  const displaySubtitle = subtitle || description;

  return (
    <div className={cn('flex flex-col space-y-3 pb-6 border-b border-border/80', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
          <Link
            to="/"
            className="hover:text-text-primary transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-text-dim" />
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-text-primary transition-colors truncate max-w-[150px] sm:max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text-secondary font-medium truncate max-w-[150px] sm:max-w-xs">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-sans">
              {title}
            </h1>
            {badge}
          </div>
          {displaySubtitle && (
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed font-sans">
              {displaySubtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
