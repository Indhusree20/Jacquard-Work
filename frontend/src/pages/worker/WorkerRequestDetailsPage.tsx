import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { quoteApi } from '../../api/quoteApi';
import { IWorkRequest, IQuote } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { LocationMapViewer } from '../../components/ui/LocationMapViewer';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  ArrowLeft,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  IndianRupee,
  CheckCircle2,
  ShieldCheck,
  Calculator,
  Fuel,
  Wrench,
  AlertCircle
} from 'lucide-react';

export const WorkerRequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [request, setRequest] = useState<IWorkRequest | null>(null);
  const [existingQuote, setExistingQuote] = useState<IQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Master Final Charges State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [petrolAllowance, setPetrolAllowance] = useState<number>(0);
  const [viluthuCharge, setViluthuCharge] = useState<number>(0);
  const [masterNotes, setMasterNotes] = useState<string>('');
  const [isSubmittingCharges, setIsSubmittingCharges] = useState(false);
  const [chargesSuccess, setChargesSuccess] = useState(false);
  const [chargesError, setChargesError] = useState<string | null>(null);

  const fetchRequestDetails = async () => {
    if (!id) return;
    try {
      const res = await workRequestApi.getWorkRequestById(id);
      if (res.success && res.data) {
        const req = res.data.workRequest;
        setRequest(req);

        const defaultDate = req.preferredDate1
          ? new Date(req.preferredDate1).toISOString().split('T')[0]
          : req.requiredDate
          ? new Date(req.requiredDate).toISOString().split('T')[0]
          : '';
        setSelectedDate(req.finalChargeSnapshot?.selectedDate || req.selectedWorkDate || defaultDate);
        setPetrolAllowance(req.finalChargeSnapshot?.petrolAllowance || 0);
        setViluthuCharge(req.finalChargeSnapshot?.viluthuCharge || 0);
        setMasterNotes(req.finalChargeSnapshot?.notes || '');

        if (res.data.quotes && res.data.quotes.length > 0) {
          setExistingQuote(res.data.quotes[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching request details for worker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleMasterSubmitFinalCharges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedDate) {
      setChargesError('Please select one of the preferred work dates.');
      return;
    }
    setIsSubmittingCharges(true);
    setChargesError(null);
    try {
      const res = await workRequestApi.submitMasterCharges(id, {
        selectedDate,
        petrolAllowance: Number(petrolAllowance || 0),
        viluthuCharge: Number(viluthuCharge || 0),
        notes: masterNotes
      });
      if (res.success) {
        setChargesSuccess(true);
        fetchRequestDetails();
      }
    } catch (err: any) {
      setChargesError(err.response?.data?.message || 'Failed to submit final charges.');
    } finally {
      setIsSubmittingCharges(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading details...</div>;
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Request not found</h3>
        <Link to="/worker/available">
          <Button size="sm">Back to Available Requests</Button>
        </Link>
      </div>
    );
  }

  const basePrice = request.estimatedAmount || request.pricingSnapshot?.totalAmount || 0;
  const calculatedGrandTotal = Number(basePrice) + Number(petrolAllowance || 0) + Number(viluthuCharge || 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/worker/available')}
          className="p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-slate-900">{request.requestId}</span>
            <Badge status={request.status} />
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {request.workTypeId?.name ? (request.workTypeId.name[language] || request.workTypeId.name.en) : 'Jacquard Service'}
          </h1>
        </div>
      </div>

      {/* Main Grid: Request Overview & Quote Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Request Specs & Graph Files */}
        <div className="lg:col-span-7 space-y-6">
          {/* Specs */}
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader title="Loom Work Requirements" />
            <CardContent className="space-y-4 text-xs sm:text-sm">
              {request.description ? (
                <p className="text-slate-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/70 font-medium">
                  {request.description}
                </p>
              ) : (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-slate-500 italic">
                  {language === 'ta'
                    ? 'கூடுதல் குறிப்பு எதுவும் வழங்கப்படவில்லை.'
                    : 'No additional work note provided.'}
                </div>
              )}

              {/* Fixed Guaranteed Pricing Snapshot View */}
              {request.pricingSnapshot && (
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        {language === 'ta' ? 'நிர்வாக நிர்ணயிக்கப்பட்ட விலை (பூட்டப்பட்டது)' : 'Admin Guaranteed Fixed Rate'}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-200 font-mono">
                      v{request.pricingSnapshot.pricingVersion} Snapshot
                    </span>
                  </div>

                  {/* Dynamic Options Snapshot */}
                  {request.selectedOptions && Object.keys(request.selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {Object.entries(request.selectedOptions).map(([key, val]) => (
                        <span
                          key={key}
                          className="text-[11px] font-medium bg-white text-slate-800 border border-stone-200 px-2.5 py-0.5 rounded-md"
                        >
                          <span className="text-slate-400 uppercase text-[9px] font-bold mr-1">{key}:</span>
                          {String(val)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing Breakdown Lines */}
                  {request.pricingSnapshot.breakdown && request.pricingSnapshot.breakdown.length > 0 && (
                    <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-stone-200">
                      {request.pricingSnapshot.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span>{item.label[language] || item.label.en}</span>
                          <span className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      {language === 'ta' ? 'நிர்வாக நிலையான கட்டணம்' : 'Fixed Total Amount'}
                    </span>
                    <span className="text-xl font-black text-indigo-950 font-mono">
                      ₹{request.pricingSnapshot.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Looms</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{request.quantity} Loom(s)</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Required Date</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Preferred Slot</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{request.preferredTime || 'Standard'}</span>
                </div>
              </div>

              {request.additionalRequirements && (
                <div className="text-xs pt-2">
                  <span className="font-bold text-slate-700">Additional Instructions:</span>
                  <p className="text-slate-600 mt-0.5">{request.additionalRequirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Files */}
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={language === 'ta' ? 'வடிவமைப்பு கோப்புகள் / அட்டை வரைபடங்கள்' : 'Design Graphs & Reference Files'}
              subtitle={`${request.designFiles?.length || 0} file(s) uploaded by weaver`}
            />
            <CardContent>
              {request.designFiles?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No design files attached.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.designFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-colors group"
                    >
                      {file.fileType.includes('image') ? (
                        <ImageIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-600 shrink-0" />
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-950">
                          {file.fileName}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {(file.fileSize / 1024).toFixed(0)} KB • Click to open
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-800 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details & Map */}
          {request.location && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Weaver Workshop Location</h3>
              <LocationMapViewer
                location={request.location}
                weaverName={request.weaverId?.name}
                businessName={request.weaverId?.businessName}
              />
            </div>
          )}
        </div>

        {/* Right Col: Master Acceptance & Final Charges Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-700" />
                  <span>{language === 'ta' ? 'பணி ஏற்பு & பயணப்படி விவரங்கள்' : 'Accept Request & Set Charges'}</span>
                </div>
              }
              subtitle="Select preferred work date & submit required allowance"
            />
            <CardContent className="space-y-4">
              {chargesSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {language === 'ta'
                      ? 'கட்டண விவரங்கள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டன! நெசவாளர் ஒப்புதலுக்கு காத்திருக்கிறது.'
                      : 'Charges submitted successfully! Awaiting weaver final approval.'}
                  </span>
                </div>
              )}

              {chargesError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{chargesError}</span>
                </div>
              )}

              <form onSubmit={handleMasterSubmitFinalCharges} className="space-y-4">
                {/* Step 1: Select between Weaver Preferred Dates */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    {language === 'ta' ? 'வேலை தேதியை தேர்ந்தெடுக்கவும் *' : 'Select Work Date *'}
                  </label>
                  <div className="space-y-2">
                    {request.preferredDate1 && (
                      <label
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          selectedDate === new Date(request.preferredDate1).toISOString().split('T')[0]
                            ? 'border-indigo-900 bg-indigo-50/70 shadow-2xs ring-1 ring-indigo-900'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="workDate"
                            value={new Date(request.preferredDate1).toISOString().split('T')[0]}
                            checked={selectedDate === new Date(request.preferredDate1).toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-indigo-900 focus:ring-indigo-600"
                          />
                          <span>
                            {new Date(request.preferredDate1).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded">
                          1st Preference
                        </span>
                      </label>
                    )}

                    {request.preferredDate2 && (
                      <label
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          selectedDate === new Date(request.preferredDate2).toISOString().split('T')[0]
                            ? 'border-indigo-900 bg-indigo-50/70 shadow-2xs ring-1 ring-indigo-900'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="workDate"
                            value={new Date(request.preferredDate2).toISOString().split('T')[0]}
                            checked={selectedDate === new Date(request.preferredDate2).toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-indigo-900 focus:ring-indigo-600"
                          />
                          <span>
                            {new Date(request.preferredDate2).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded">
                          2nd Preference
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Step 2: Commercial Addons */}
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Base Service Rate (Admin Locked):</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₹{basePrice.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label={language === 'ta' ? 'பெட்ரோல் படி (₹)' : 'Petrol Allowance (₹)'}
                      type="number"
                      min={0}
                      value={petrolAllowance}
                      onChange={(e) => setPetrolAllowance(Number(e.target.value))}
                      placeholder="0"
                      leftIcon={<Fuel className="w-4 h-4 text-amber-600" />}
                    />

                    <Input
                      label={language === 'ta' ? 'விழுத்து கட்டணம் (₹)' : 'Viluthu Charge (₹)'}
                      type="number"
                      min={0}
                      value={viluthuCharge}
                      onChange={(e) => setViluthuCharge(Number(e.target.value))}
                      placeholder="0"
                      leftIcon={<Wrench className="w-4 h-4 text-purple-600" />}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {language === 'ta' ? 'ஆசாரி குறிப்புகள் (Master Notes)' : 'Master Notes / Scope Details'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={
                        language === 'ta'
                          ? 'எ.கா. தறி பட்டறைக்கு காலை 9 மணிக்குள் வந்து சேருவேன்.'
                          : 'e.g. Will arrive with harness wires and tuning gauges by 9 AM.'
                      }
                      value={masterNotes}
                      onChange={(e) => setMasterNotes(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700"
                    />
                  </div>
                </div>

                {/* Grand Total Summary */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Commercial Amount
                    </span>
                    <span className="text-[10px] text-slate-400">Base + Petrol + Viluthu</span>
                  </div>
                  <span className="text-2xl font-black text-indigo-950 font-mono">
                    ₹{calculatedGrandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  isLoading={isSubmittingCharges}
                  className="w-full shadow-craft-sm"
                  withArrow
                >
                  <span>
                    {language === 'ta'
                      ? 'கோரிக்கையை ஏற்று கட்டணம் சமர்ப்பி'
                      : 'Accept & Submit Final Charges'}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
