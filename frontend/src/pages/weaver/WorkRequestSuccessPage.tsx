import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { IWorkRequest } from '../../types';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Layers,
  PlusCircle,
  LayoutDashboard,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Info,
  AlertCircle
} from 'lucide-react';

export const WorkRequestSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const [request, setRequest] = useState<IWorkRequest | null>(
    (location.state as any)?.workRequest || null
  );
  const [loading, setLoading] = useState(!request);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!request && id) {
      const fetchRequest = async () => {
        try {
          const res = await workRequestApi.getWorkRequestById(id);
          if (res.success && res.data) {
            setRequest(res.data.workRequest || res.data);
          } else {
            setError(
              language === 'ta'
                ? 'கோரிக்கை விவரங்களை ஏற்ற முடியவில்லை.'
                : 'Unable to load work request details.'
            );
          }
        } catch (err: any) {
          console.error('Failed to load work request details', err);
          setError(
            err.response?.data?.message ||
              (language === 'ta'
                ? 'கோரிக்கையை அணுக அனுமதி இல்லை அல்லது கிடைக்கவில்லை.'
                : 'Work request not found or you are not authorized to view it.')
          );
        } finally {
          setLoading(false);
        }
      };
      fetchRequest();
    }
  }, [id, request, language]);

  const handleCopyId = () => {
    const textToCopy = request?.requestId || id;
    if (!textToCopy) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('Fallback copy failed');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            {language === 'ta' ? 'கோரிக்கை விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading submission confirmation...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-craft">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {language === 'ta' ? 'கோரிக்கை கிடைக்கவில்லை' : 'Work Request Unavailable'}
        </h2>
        <p className="text-sm text-slate-600">{error || 'Unable to retrieve work request.'}</p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/weaver/dashboard')}
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            {t('workRequestSuccess.goToDashboard', 'Go to Dashboard')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/weaver/requests')}
            icon={<FileText className="w-4 h-4" />}
          >
            {t('workRequestSuccess.viewMyRequests', 'View My Work Requests')}
          </Button>
        </div>
      </div>
    );
  }

  const baseAmount = request.estimatedAmount || request.finalAmount || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 pt-2 animate-fade-in relative">
      {/* Main Success Confirmation Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-9 border border-stone-200/90 shadow-craft overflow-hidden">
        <ThariWatermark
          variant="craft-seal"
          position="top-right"
          size="lg"
          opacity={0.04}
          className="-mr-8 -mt-8 hidden sm:block"
        />

        {/* Top Success Badge & Icon Header */}
        <div className="text-center space-y-3 pb-6 border-b border-stone-100 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 shadow-craft-xs mb-1">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('workRequestSuccess.badge', 'Request Submitted Successfully')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('workRequestSuccess.title', 'Thank You for Your Work Request!')}
            </h1>

            <p className="text-sm font-semibold text-indigo-950">
              {t('workRequestSuccess.subtitle', 'Your work request has been submitted successfully.')}
            </p>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-0.5">
              {t(
                'workRequestSuccess.body',
                'Thank you for choosing our service. Your request has been received and is now being processed.'
              )}
            </p>
          </div>

          {/* Prominent Request ID and Initial Status Display */}
          <div className="mt-5 p-4 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block">
                {t('workRequestSuccess.requestId', 'REQUEST ID')}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-lg sm:text-xl font-black text-indigo-950 tracking-wide">
                  {request.requestId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-950 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Copy Request ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px] font-bold">
                        {t('workRequestSuccess.copied', 'Copied!')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-bold">
                        {t('workRequestSuccess.copyId', 'Copy')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block">
                  {t('workRequestSuccess.status', 'Status')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {request.status === 'REQUESTED'
                      ? t('workRequestSuccess.statusRequested', 'REQUESTED (Under Review)')
                      : request.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Submitted Request Summary */}
        <div className="py-6 space-y-4 border-b border-stone-100 relative z-10">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-700" />
            <span>{t('workRequestSuccess.summaryTitle', 'Request Submitted Successfully')}</span>
          </h3>

          <div className="space-y-3">
            {/* Service Line Items */}
            {request.items && request.items.length > 0 ? (
              <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-stone-50/50">
                {request.items.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {item.serviceName?.[language] || item.serviceName?.en || 'Service'} —{' '}
                        <span className="text-indigo-900">
                          {item.optionName?.[language] || item.optionName?.en}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.pricingModel === 'FIXED_AMOUNT'
                          ? (language === 'ta' ? 'நிலையான கட்டணம்' : 'Fixed Flat Rate')
                          : `${item.inputValue} ${item.unit} @ ₹${item.rate}/${item.unit}`}
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm text-slate-900">
                      ₹{item.subtotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-slate-800 font-semibold">
                {request.description || 'Jacquard Work Request'}
              </div>
            )}

            {/* District Location & Preferred Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {t('workRequestSuccess.location', 'District & Workshop Location')}
                </span>
                <p className="font-bold text-slate-900">
                  {request.location?.district || '—'}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {request.location?.address || request.location?.city || ''}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {t('workRequestSuccess.preferredDates', 'Preferred Work Dates')}
                </span>
                <div className="space-y-0.5 font-mono">
                  <p className="font-bold text-slate-900">
                    <span className="text-[10px] font-sans text-indigo-900 font-bold mr-1">
                      {t('workRequestSuccess.preferredDate1', 'Preferred Date 1')}:
                    </span>
                    {formatDate(request.preferredDate1 || (request.requiredDate as any))}
                  </p>
                  {request.preferredDate2 && (
                    <p className="text-slate-600 text-[11px]">
                      <span className="text-[10px] font-sans text-slate-500 mr-1">
                        {t('workRequestSuccess.preferredDate2', 'Preferred Date 2')}:
                      </span>
                      {formatDate(request.preferredDate2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Base Amount Pricing Snapshot */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">
                  {t('workRequestSuccess.baseAmount', 'Base Service Amount')}
                </span>
                <span className="text-[11px] text-indigo-700">
                  {t('workRequestSuccess.pricingSnapshotNote', 'Locked price snapshot from Admin rate configuration')}
                </span>
              </div>
              <span className="text-2xl font-black text-indigo-950 font-mono">
                ₹{baseAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Informational Next Steps Guide */}
        <div className="py-5 border-b border-stone-100 space-y-2 relative z-10">
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-bold text-amber-900 block">
                {t('workRequestSuccess.whatNextTitle', 'What Happens Next:')}
              </span>
              <ul className="text-[11px] leading-relaxed text-slate-700 space-y-1">
                <li>{t('workRequestSuccess.whatNextStep1', '1. Eligible Jacquard Masters in your district have been notified of this request.')}</li>
                <li>{t('workRequestSuccess.whatNextStep2', '2. A Master will review the request, select one of your preferred dates, and specify any necessary travel allowance.')}</li>
                <li>{t('workRequestSuccess.whatNextStep3', '3. You will review and give final approval on the final charges before the work is scheduled.')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/weaver/dashboard')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {t('workRequestSuccess.goToDashboard', 'Go to Dashboard')}
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/weaver/requests')}
              icon={<Layers className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {t('workRequestSuccess.viewMyRequests', 'View My Work Requests')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/weaver/requests/new')}
              icon={<PlusCircle className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {t('workRequestSuccess.createAnother', 'Create Another Request')}
            </Button>

            {request._id && (
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate(`/weaver/requests/${request._id}`)}
                icon={<FileText className="w-4 h-4" />}
                withArrow
                className="w-full sm:w-auto"
              >
                {t('workRequestSuccess.viewRequest', 'View Request Details')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
