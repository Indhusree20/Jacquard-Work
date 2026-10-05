import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageSelector: React.FC<{ variant?: 'header' | 'minimal' }> = ({
  variant = 'header'
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white/90 backdrop-blur-xs p-0.5 shadow-2xs">
      <button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'en'
            ? 'bg-indigo-900 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <span>EN</span>
      </button>
      <button
        onClick={() => setLanguage('ta')}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'ta'
            ? 'bg-amber-700 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <span>தமிழ்</span>
      </button>
    </div>
  );
};
