import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200/85 shadow-craft-xs overflow-hidden transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-craft hover:border-indigo-200 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`p-5 sm:p-6 border-b border-stone-100/90 flex items-start justify-between gap-4 bg-stone-50/40 ${className}`}>
    <div>
      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-5 sm:p-6 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`px-5 py-4 sm:px-6 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);
