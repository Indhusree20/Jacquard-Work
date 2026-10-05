import React from 'react';
import { IFieldDefinition } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Layers, CheckCircle2, HelpCircle } from 'lucide-react';

interface DynamicServiceFieldsProps {
  fieldDefinitions: IFieldDefinition[];
  selectedOptions: Record<string, any>;
  onChange: (fieldKey: string, value: any) => void;
  disabled?: boolean;
}

export const DynamicServiceFields: React.FC<DynamicServiceFieldsProps> = ({
  fieldDefinitions,
  selectedOptions,
  onChange,
  disabled = false
}) => {
  const { language } = useLanguage();

  if (!fieldDefinitions || fieldDefinitions.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
        {language === 'ta'
          ? 'இந்த சேவைக்கு கூடுதல் விருப்பங்கள் தேவையில்லை.'
          : 'No specific dynamic configuration required for this service.'}
      </div>
    );
  }

  // Sort fields if needed, or render in natural order
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Layers className="w-4 h-4 text-indigo-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {language === 'ta' ? 'சேவை விவரங்கள் & அளவீடுகள்' : 'Service Options & Specifications'}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldDefinitions.map((field) => {
          const fieldLabel = field.label[language] || field.label.en || field.fieldKey;
          const helper = field.helperText?.[language] || field.helperText?.en;
          const currentValue = selectedOptions[field.fieldKey] ?? '';

          if (field.fieldType === 'RADIO' || (field.options && field.options.length <= 4 && field.fieldType === 'SELECT')) {
            return (
              <div key={field.fieldKey} className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{fieldLabel}</span>
                    {field.required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  {helper && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      {helper}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {field.options.map((opt) => {
                    const isSelected = String(currentValue) === String(opt.key);
                    const optLabel = opt.label[language] || opt.label.en || opt.key;

                    return (
                      <button
                        type="button"
                        key={opt.key}
                        disabled={disabled}
                        onClick={() => onChange(field.fieldKey, opt.key)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-indigo-950' : 'text-slate-800'
                            }`}
                          >
                            {optLabel}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </div>

                        {opt.additionalPrice && opt.additionalPrice > 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-2 self-start">
                            +₹{opt.additionalPrice}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (field.fieldType === 'SELECT') {
            return (
              <div key={field.fieldKey} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{fieldLabel}</span>
                    {field.required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  {field.unit && (
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      ({field.unit})
                    </span>
                  )}
                </div>

                <select
                  disabled={disabled}
                  required={field.required}
                  value={currentValue}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
                >
                  <option value="">
                    {language === 'ta' ? '-- தேர்வு செய்க --' : '-- Select Option --'}
                  </option>
                  {field.options.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label[language] || opt.label.en || opt.key}
                      {opt.additionalPrice ? ` (+₹${opt.additionalPrice})` : ''}
                    </option>
                  ))}
                </select>
                {helper && <p className="text-[11px] text-slate-400">{helper}</p>}
              </div>
            );
          }

          if (field.fieldType === 'NUMBER') {
            return (
              <div key={field.fieldKey} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{fieldLabel}</span>
                    {field.required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  {field.unit && (
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      ({field.unit})
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  disabled={disabled}
                  required={field.required}
                  value={currentValue}
                  onChange={(e) => onChange(field.fieldKey, Number(e.target.value))}
                  placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
                />
                {helper && <p className="text-[11px] text-slate-400">{helper}</p>}
              </div>
            );
          }

          return (
            <div key={field.fieldKey} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>{fieldLabel}</span>
                {field.required && <span className="text-red-500 font-bold">*</span>}
              </label>
              <input
                type="text"
                disabled={disabled}
                required={field.required}
                value={currentValue}
                onChange={(e) => onChange(field.fieldKey, e.target.value)}
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
              />
              {helper && <p className="text-[11px] text-slate-400">{helper}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
