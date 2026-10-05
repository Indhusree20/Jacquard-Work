import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, Clock, PlayCircle, CalendarCheck, FileCheck, CheckCircle } from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: string;
  history?: Array<{
    previousStatus: string;
    newStatus: string;
    changedBy: { name: string; role: string };
    timestamp: string;
    note?: string;
  }>;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, history = [] }) => {
  const { t } = useLanguage();

  const steps = [
    { key: 'REQUESTED', label: t('statuses.REQUESTED', 'Requested'), icon: Clock },
    { key: 'QUOTED', label: t('statuses.QUOTED', 'Quoted'), icon: FileCheck },
    { key: 'CONFIRMED', label: t('statuses.CONFIRMED', 'Confirmed'), icon: CheckCircle2 },
    { key: 'SCHEDULED', label: t('statuses.SCHEDULED', 'Scheduled'), icon: CalendarCheck },
    { key: 'IN_PROGRESS', label: t('statuses.IN_PROGRESS', 'In Progress'), icon: PlayCircle },
    { key: 'COMPLETED', label: t('statuses.COMPLETED', 'Completed'), icon: CheckCircle }
  ];

  const statusOrder = ['REQUESTED', 'UNDER_REVIEW', 'QUOTED', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  const isCompletedStep = (key: string) => {
    const stepIdx = statusOrder.indexOf(key);
    return currentIndex >= stepIdx && currentIndex !== -1;
  };

  const isCurrentActiveStep = (key: string) => {
    return currentStatus === key;
  };

  return (
    <div className="w-full py-4">
      {/* Horizontal Step Bar */}
      <div className="relative flex items-center justify-between w-full">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-indigo-900 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, (currentIndex / (steps.length - 1)) * 100))}%`
          }}
        />

        {steps.map((step, idx) => {
          const completed = isCompletedStep(step.key);
          const active = isCurrentActiveStep(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  completed
                    ? 'bg-indigo-900 border-indigo-900 text-white shadow-md scale-105'
                    : 'bg-white border-slate-300 text-slate-400'
                } ${active ? 'ring-4 ring-indigo-100 ring-offset-1' : ''}`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`mt-2 text-[10px] sm:text-xs font-semibold text-center max-w-[70px] sm:max-w-[90px] leading-tight ${
                  completed ? 'text-indigo-950 font-bold' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* History notes accordion / logs */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            {t('common.status', 'Status')} History Log
          </h4>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-100"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {h.newStatus} {h.changedBy?.name && `— ${h.changedBy.name} (${h.changedBy.role})`}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {h.note && <p className="text-slate-600 mt-1">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
