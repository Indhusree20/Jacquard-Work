import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>{t('app.name', 'Jacquard Work Management Platform')}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {t(
                'app.tagline',
                'Digitizing the business workflow and artisan coordination for Tamil Nadu traditional handloom and Jacquard weavers.'
              )}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {language === 'ta' ? 'முக்கிய கைத்தறி மண்டலங்கள்' : 'Active Handloom Clusters'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>Salem (சேலம் - அம்மாபேட்டை, குகை)</li>
              <li>Kanchipuram (காஞ்சிபுரம் பட்டு)</li>
              <li>Erode (ஈரோடு - சென்னிமலை, பவானி)</li>
              <li>Coimbatore (கோயம்புத்தூர் - சோமனூர்)</li>
              <li>Tiruppur & Namakkal (ராசிபுரம்)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {language === 'ta' ? 'சேவைகள்' : 'Jacquard Services'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>Jacquard Box Installation</li>
              <li>Design Card Punching & Lacing</li>
              <li>Harness & Cord Mounting</li>
              <li>Border Pattern Modification</li>
              <li>Loom Re-leveling & Overhaul</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>{t('app.copyright')}</p>
          <div className="flex items-center gap-4">
            <span>Tamil Nadu Handloom Digital Initiative</span>
            <span>•</span>
            <span>Version 1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
