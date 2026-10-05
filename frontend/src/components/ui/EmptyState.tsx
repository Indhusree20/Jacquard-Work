import React from 'react';
import { Link } from 'react-router-dom';
import { ThariWatermark, ThariVariant } from './ThariWatermark';
import { Button } from './Button';

export type EmptyStateVariant = ThariVariant | 'loom' | 'seal' | 'harness' | 'shuttle';

interface EmptyStateProps {
  icon?: React.ReactNode | React.ElementType;
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  actionLink?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconProp,
  variant = 'craft-seal',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  actionLink,
  className = ''
}) => {
  const resolveWatermarkVariant = (v: EmptyStateVariant): ThariVariant => {
    switch (v) {
      case 'loom':
        return 'loom-watermark';
      case 'seal':
        return 'craft-seal';
      case 'harness':
        return 'jacquard-harness';
      case 'shuttle':
        return 'shuttle-threads';
      default:
        return v;
    }
  };

  const renderIcon = () => {
    if (!IconProp) return null;
    if (React.isValidElement(IconProp)) {
      return IconProp;
    }
    if (typeof IconProp === 'function' || typeof IconProp === 'object') {
      const Component = IconProp as React.ElementType;
      return <Component className="w-6 h-6 text-indigo-900" />;
    }
    return null;
  };

  return (
    <div
      className={`relative p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 overflow-hidden flex flex-col items-center justify-center space-y-3.5 ${className}`}
    >
      <ThariWatermark
        variant={resolveWatermarkVariant(variant)}
        position="background-center"
        size="sm"
        opacity={0.06}
      />

      {IconProp && (
        <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border border-stone-200/80 shadow-craft-xs flex items-center justify-center text-indigo-900">
          {renderIcon()}
        </div>
      )}

      <div className="relative z-10 space-y-1 max-w-md">
        <h4 className="text-sm sm:text-base font-bold text-stone-800 tracking-tight">{title}</h4>
        {description && (
          <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && (
        <div className="relative z-10 pt-2">
          {actionLink ? (
            <Link to={actionLink}>
              <Button size="sm" withArrow>
                {actionLabel}
              </Button>
            </Link>
          ) : actionHref ? (
            <a href={actionHref}>
              <Button size="sm" withArrow>
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button size="sm" onClick={onAction} withArrow>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
