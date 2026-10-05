import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  withArrow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      icon,
      rightIcon,
      withArrow = false,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles with smooth 150-250ms transitions, font weight, micro-elevation
    const baseStyles =
      'group relative inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 select-none focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.985] cursor-pointer';

    const variants = {
      // Primary: Deep Handloom Indigo with subtle warp sheen & elevation
      primary:
        'bg-gradient-to-b from-indigo-900 to-indigo-950 text-white shadow-craft-sm hover:shadow-craft hover:from-indigo-850 hover:to-indigo-900 focus:ring-indigo-700/40 border border-indigo-800/80 hover:-translate-y-0.5 active:translate-y-0',
      
      // Secondary: Warm Ochre Craft Accent
      secondary:
        'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 shadow-craft-sm hover:shadow-craft hover:from-amber-400 hover:to-amber-500 focus:ring-amber-500/40 border border-amber-600/40 hover:-translate-y-0.5 active:translate-y-0',
      
      // Outline: Clean White with Natural Textile Stone Border
      outline:
        'bg-white hover:bg-stone-50 text-slate-800 border border-stone-200 shadow-craft-xs hover:shadow-craft-sm hover:border-stone-300 focus:ring-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0',
      
      // Ghost: Light interactive
      ghost:
        'text-slate-700 hover:bg-stone-100/80 hover:text-slate-900 focus:ring-stone-400/30 border border-transparent',
      
      // Success: Natural Leaf Emerald
      success:
        'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-craft-sm hover:shadow-craft hover:from-emerald-500 hover:to-emerald-600 focus:ring-emerald-600/40 border border-emerald-600/60 hover:-translate-y-0.5 active:translate-y-0',
      
      // Danger: Natural Madder Red
      danger:
        'bg-gradient-to-b from-red-600 to-red-700 text-white shadow-craft-sm hover:shadow-craft hover:from-red-500 hover:to-red-600 focus:ring-red-600/40 border border-red-600/60 hover:-translate-y-0.5 active:translate-y-0',
      
      // Warning: Soft Alert Ochre
      warning:
        'bg-gradient-to-b from-amber-600 to-amber-700 text-white shadow-craft-sm hover:shadow-craft hover:from-amber-500 hover:to-amber-600 focus:ring-amber-600/40 border border-amber-600/60 hover:-translate-y-0.5 active:translate-y-0',
      
      // Accent: Warm Golden Sand
      accent:
        'bg-amber-100 hover:bg-amber-200/80 text-amber-950 border border-amber-300/80 shadow-craft-xs hover:shadow-craft-sm focus:ring-amber-500/30 hover:-translate-y-0.5 active:translate-y-0'
    };

    const sizes = {
      xs: 'text-[11px] px-2.5 py-1 gap-1.5 rounded-lg',
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-lg',
      md: 'text-xs sm:text-sm px-4.5 py-2.5 gap-2 rounded-xl',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 font-extrabold rounded-xl',
      xl: 'text-base sm:text-lg px-7 py-3.5 gap-3 font-black rounded-2xl'
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 -ml-0.5" />
            <span>{loadingText || children || 'Loading...'}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0 transition-transform duration-200">{icon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="shrink-0 transition-transform duration-200">{rightIcon}</span>}
            {withArrow && (
              <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
