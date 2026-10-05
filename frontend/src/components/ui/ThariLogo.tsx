import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface ThariLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  textPosition?: 'right' | 'bottom';
  className?: string;
  iconClassName?: string;
  showSubtitle?: boolean;
}

export const ThariLogo: React.FC<ThariLogoProps> = ({
  size = 'md',
  withText = true,
  textPosition = 'right',
  className = '',
  iconClassName = '',
  showSubtitle = true
}) => {
  const { language } = useLanguage();

  const sizeDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const titleSizes = {
    xs: 'text-xs font-black',
    sm: 'text-sm font-black',
    md: 'text-base sm:text-lg font-black',
    lg: 'text-xl sm:text-2xl font-black',
    xl: 'text-2xl sm:text-3xl font-black'
  };

  const subtitleSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  return (
    <div
      className={`inline-flex items-center ${
        textPosition === 'bottom' ? 'flex-col text-center gap-2' : 'flex-row gap-3 text-left'
      } ${className}`}
    >
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-stone-100 p-1 border border-amber-200/80 shadow-craft-xs transition-transform duration-200 ${
          sizeDimensions[size]
        } ${iconClassName}`}
      >
        <img
          src="/thari-logo.png"
          alt="Thari Handloom Logo"
          className="w-full h-full object-contain drop-shadow-sm"
          loading="eager"
        />
      </div>

      {withText && (
        <div className="leading-tight">
          <span
            className={`tracking-tight text-slate-900 block ${titleSizes[size]}`}
          >
            {language === 'ta' ? 'ஜாகார்ட் தளம்' : 'JacquardWork'}
          </span>
          {showSubtitle && (
            <span
              className={`text-amber-800 font-extrabold tracking-wider uppercase block mt-0.5 ${subtitleSizes[size]}`}
            >
              {language === 'ta' ? 'பாரம்பரிய கைத்தறி இணைப்பு' : 'Handloom Ecosystem'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
