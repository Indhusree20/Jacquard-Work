import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { IWorkRequest } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  ShieldCheck,
  Calendar,
  Fuel,
  Wrench,
  Calculator,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  UserCheck,
  Check,
  FileText
} from 'lucide-react';

export const UserFinalConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [request, setRequest] = useState<IWorkRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await workRequestApi.getWorkRequestById(id);
      if (res.success && res.data) {
        setRequest(res.data.workRequest);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleConfirmFinal = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await workRequestApi.userConfirmFinalCharges(id);
      if (res.success) {
        setSuccessMessage(
          language === 'ta'
            ? 'இறுதி கட்டணம் மற்றும் பணி தேதி வெற்றிகரமாக உறுதி செய்யப்பட்டது! பணி அட்டவணைப்படுத்தப்பட்டுள்ளது.'
            : 'Final charges and work date successfully confirmed! The job is now scheduled.'
        );
        fetchRequest();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to confirm final charges. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-slate-500">
        <Clock className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p>{language === 'ta' ? 'விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading confirmation details...'}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">
          {language === 'ta' ? 'பணி கோரிக்கை கிடைக்கவில்லை' : 'Work Request Not Found'}
        </h2>
        <Link to="/weaver/dashboard">
          <Button size="sm">{language === 'ta' ? 'டாஷ்போர்டிற்கு திரும்பு' : 'Back to Dashboard'}</Button>
        </Link>
      </div>
    );
  }

  const snapshot = request.finalChargeSnapshot;
  const isPending = request.status === 'FINAL_CHARGES_PENDING_USER' || request.status === 'MASTER_ACCEPTED';
  const isScheduled = request.status === 'SCHEDULED' || request.status === 'USER_FINAL_CONFIRMED';
  const isExpired = request.status === 'USER_CONFIRMATION_EXPIRED';

  const baseAmount = snapshot?.baseServiceAmount ?? (request.estimatedAmount || request.pricingSnapshot?.totalAmount || 0);
  const petrol = snapshot?.petrolAllowance ?? 0;
  const viluthu = snapshot?.viluthuCharge ?? 0;
  const totalFinal = snapshot?.finalAmount ?? (baseAmount + petrol + viluthu);
  const selectedDate = snapshot?.selectedDate || request.selectedWorkDate || (request.requiredDate ? new Date(request.requiredDate).toISOString().split('T')[0] : 'N/A');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 relative">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/weaver/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'கோரிக்கைகள் பட்டியல்' : 'Back to My Requests'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500">{request.requestId}</span>
          <Badge status={request.status} />
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden">
        <ThariWatermark variant="shuttle-threads" position="top-right" size="sm" opacity={0.04} className="-mr-4 -mt-4 hidden sm:block" />
        <div className="relative z-10 space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-950 border border-indigo-200 inline-flex items-center gap-1 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
            <span>{language === 'ta' ? 'இறுதி வணிக உறுதிப்படுத்தல்' : 'Master Final Charges & Date Confirmation'}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'இறுதி கட்டணம் மற்றும் தேதி உறுதிப்படுத்தல்' : 'Confirm Final Work Charges & Date'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'ta'
              ? 'ஜாக்கார்ட் ஆசாரி நிர்ணயித்த பணி தேதி மற்றும் கூடுதல் கட்டணங்களை சரிபார்த்து உறுதிப்படுத்தவும்.'
              : 'Review the Jacquard Master’s selected work date, petrol allowance, and viluthu charges before scheduling.'}
          </p>
        </div>
      </div>

      {/* Error / Success Alerts */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-700 flex items-start gap-3 shadow-2xs animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-start gap-3 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Master Information Card */}
      <Card className="border-stone-200/90 shadow-craft-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-base shadow-craft-xs">
              <UserCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                {language === 'ta' ? 'ஒதுக்கப்பட்ட ஜாக்கார்ட் ஆசாரி' : 'Assigned Jacquard Master'}
              </span>
              <h3 className="text-base font-black text-slate-900">
                {request.assignedWorkerId?.name || (language === 'ta' ? 'ஜாக்கார்ட் ஆசாரி' : 'Jacquard Master')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {request.assignedWorkerId?.phone && `📞 ${request.assignedWorkerId.phone} • `}
                {request.assignedWorkerId?.experienceYears ? `${request.assignedWorkerId.experienceYears}+ yrs exp` : 'Verified Master'}
              </p>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 px-4 py-2.5 rounded-xl text-right self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
            <span className="text-[11px] font-bold text-slate-600 uppercase">
              {language === 'ta' ? 'தேர்வு செய்த வேலை தேதி' : 'Confirmed Work Date'}
            </span>
            <span className="text-sm font-black text-indigo-950 flex items-center gap-1.5 font-mono">
              <Calendar className="w-4 h-4 text-indigo-700" />
              {selectedDate}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Commercial Breakdown Card */}
      <Card className="border-stone-200/90 shadow-craft-xs overflow-hidden">
        <CardHeader
          title={language === 'ta' ? 'கட்டண விவர பட்டியல் (Itemized Cost Breakdown)' : 'Itemized Commercial Breakdown'}
          subtitle={
            language === 'ta'
              ? 'அடிப்படை சேவை கட்டணம் + பெட்ரோல் படி + விழுத்து கட்டணம் = இறுதி மொத்த தொகை'
              : 'Base Service Amount + Petrol Allowance + Viluthu Charge = Final Amount'
          }
        />
        <CardContent className="space-y-4">
          <div className="divide-y divide-stone-100 text-xs sm:text-sm">
            {/* Base Work Amount */}
            <div className="py-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-slate-600" />
                  {language === 'ta' ? '1. தறி வேலை அடிப்படை கட்டணம் (Base Work Amount)' : '1. Base Work Amount'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {language === 'ta'
                    ? 'நிர்வாக விலை விதிகளின் அடிப்படையில் கணக்கிடப்பட்ட நிலையான தொகை'
                    : 'Calculated directly from Admin pricing rules for requested service line items'}
                </p>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                ₹{baseAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Petrol Allowance */}
            <div className="py-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  {language === 'ta' ? '2. பெட்ரோல் / பயணப்படி (Petrol Allowance)' : '2. Petrol / Travel Allowance'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {language === 'ta'
                    ? 'ஆசாரியின் பட்டறைக்கு பயணிக்கும் தூரத்திற்கான படி'
                    : 'Conveyance allowance for Master’s on-site workshop visit'}
                </p>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                {petrol > 0 ? `₹${petrol.toLocaleString('en-IN')}` : '₹0 (Included / Nil)'}
              </span>
            </div>

            {/* Viluthu Charge */}
            <div className="py-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  {language === 'ta' ? '3. விழுத்து கட்டணம் (Viluthu Charge)' : '3. Viluthu Charge'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {language === 'ta'
                    ? 'தறி விழுத்து பொருத்துதல் மற்றும் கம்பி அமைப்பு கட்டணம்'
                    : 'Harness cords / viluthu fitting & adjustment charge'}
                </p>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                {viluthu > 0 ? `₹${viluthu.toLocaleString('en-IN')}` : '₹0 (Nil)'}
              </span>
            </div>
          </div>

          {/* Master Notes */}
          {snapshot?.notes && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-slate-700 flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-800">
                  {language === 'ta' ? 'ஆசாரி குறிப்பு (Master Notes):' : 'Master Notes:'}
                </span>
                <p className="text-slate-600 mt-0.5">{snapshot.notes}</p>
              </div>
            </div>
          )}

          {/* Grand Total Box (Clean Light Surface with Strong Hierarchy) */}
          <div className="bg-stone-50/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-stone-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-700" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">
                  {language === 'ta' ? 'இறுதி மொத்த கட்டணம் (Final Amount)' : 'Final Authoritative Amount'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'பணி முடிந்த பின் செலுத்தப்பட வேண்டிய மொத்த தொகை'
                  : 'Total commercial amount payable upon completion of physical work'}
              </p>
            </div>

            <div className="text-right self-end sm:self-center">
              <span className="text-3xl font-black text-indigo-950 font-mono">
                ₹{totalFinal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Notice */}
      {snapshot?.approvalDeadline && isPending && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 block">
              {language === 'ta' ? 'ஒப்புதல் காலக்கெடு (Approval Deadline)' : 'Approval Deadline:'}
            </span>
            <p className="leading-relaxed text-slate-700">
              {language === 'ta'
                ? `தயவுசெய்து ${new Date(snapshot.approvalDeadline).toLocaleString()} மணிக்குள் ஒப்புதலை உறுதிப்படுத்தவும். குறிப்பிட்ட நேரத்திற்குள் ஒப்புதல் அளிக்கப்படாவிட்டால், இந்த ஒதுக்கீடு ரத்து செய்யப்பட்டு வேறு ஆசாரிக்கு மீண்டும் விடுவிக்கப்படும்.`
                : `Please confirm by ${new Date(snapshot.approvalDeadline).toLocaleString()}. If not confirmed in time, this assignment will automatically expire to allow other bookings.`}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Link to={`/weaver/requests/${request._id}`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            {language === 'ta' ? 'கோரிக்கை விவரங்கள்' : 'View Full Request Specs'}
          </Button>
        </Link>

        {isPending && (
          <Button
            variant="success"
            size="lg"
            isLoading={isSubmitting}
            onClick={handleConfirmFinal}
            className="w-full sm:w-auto"
            withArrow
          >
            <span>
              {language === 'ta'
                ? `₹${totalFinal.toLocaleString('en-IN')} & ${selectedDate} தேதியை உறுதி செய்க`
                : `Accept & Confirm Work (₹${totalFinal.toLocaleString('en-IN')})`}
            </span>
          </Button>
        )}

        {isScheduled && (
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              {language === 'ta'
                ? `பணி உறுதி செய்யப்பட்டு ${selectedDate} தேதிக்கு அட்டவணைப்படுத்தப்பட்டுள்ளது.`
                : `Work confirmed & scheduled for ${selectedDate}.`}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>
              {language === 'ta'
                ? 'காலக்கெடு முடிவடைந்தது. இந்த கோரிக்கை மீண்டும் விடுவிக்கப்பட்டுள்ளது.'
                : 'Confirmation expired. This request has been released for reassignment.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
