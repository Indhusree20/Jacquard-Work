import React from 'react';
import { ThariWatermark } from './ThariWatermark';

interface PageHeaderProps {
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  withLoomWatermark?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  subtitle,
  actions,
  className = '',
  withLoomWatermark = true
}) => {
  return (
    <div
      className={`relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      {withLoomWatermark && (
        <ThariWatermark
          variant="shuttle-threads"
          position="header-right"
          size="sm"
          opacity={0.04}
          className="-mr-6 -mt-6"
        />
      )}

      <div className="relative z-10 space-y-1.5 max-w-2xl">
        {badge && <div>{badge}</div>}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
