import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { quoteApi } from '../../api/quoteApi';
import { IWorkRequest, IQuote, IJob, IJobStatusHistory } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { LocationMapViewer } from '../../components/ui/LocationMapViewer';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  MapPin,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [request, setRequest] = useState<IWorkRequest | null>(null);
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [history, setHistory] = useState<IJobStatusHistory[]>([]);
  const [job, setJob] = useState<IJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quote Action Modal
  const [selectedQuote, setSelectedQuote] = useState<IQuote | null>(null);
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Cancel Request Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await workRequestApi.getWorkRequestById(id);
      if (res.success && res.data) {
        setRequest(res.data.workRequest);
        setQuotes(res.data.quotes || []);
        setHistory(res.data.history || []);
        if (res.data.job) setJob(res.data.job);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleQuoteResponse = async () => {
    if (!selectedQuote || !actionType) return;
    setIsSubmittingAction(true);
    try {
      const res = await quoteApi.respondToQuote(
        selectedQuote._id,
        actionType,
        actionType === 'REJECT' ? rejectionReason : undefined
      );
      if (res.success) {
        setSelectedQuote(null);
        setActionType(null);
        fetchDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!id) return;
    setIsSubmittingAction(true);
    try {
      const res = await workRequestApi.cancelWorkRequest(id, cancelReason);
      if (res.success) {
        setCancelModalOpen(false);
        fetchDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading details...</div>;
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Work request not found</h3>
        <Link to="/weaver/requests">
          <Button size="sm">Back to Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 relative">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/weaver/requests')}
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

        <div className="flex items-center gap-2">
          {['REQUESTED', 'UNDER_REVIEW', 'QUOTED'].includes(request.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              Cancel Request
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress Lifecycle */}
      <Card className="border-stone-200/90 shadow-craft-xs">
        <CardContent className="p-6">
          <StatusTimeline currentStatus={request.status} history={history} />
        </CardContent>
      </Card>

      {/* Final Charges Action Banner */}
      {request.status === 'FINAL_CHARGES_PENDING_USER' && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-craft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Action Required: Master Accepted & Submitted Final Charges
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Scheduled Date: {request.finalChargeSnapshot?.selectedDate || 'Pending'} • Total: ₹{(request.finalAmount || request.finalChargeSnapshot?.finalAmount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-600">
              The assigned Jacquard Master has accepted your request and submitted final charges (Petrol & Viluthu). Please review and approve to schedule the work.
            </p>
          </div>

          <Link to={`/weaver/requests/${request._id}/confirm-final`} className="shrink-0 w-full sm:w-auto">
            <Button size="md" variant="primary" withArrow className="w-full sm:w-auto">
              <span>Review & Confirm Work</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Main Grid: Request Specs & Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specs, Designs & Location */}
        <div className="lg:col-span-7 space-y-6">
          {/* Work Specs */}
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader title="Work Specifications" />
            <CardContent className="space-y-4">
              {request.description ? (
                <p className="text-sm text-slate-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/70 font-medium">
                  {request.description}
                </p>
              ) : (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-slate-500 italic">
                  {language === 'ta'
                    ? 'கூடுதல் குறிப்பு எதுவும் வழங்கப்படவில்லை.'
                    : 'No additional work note provided.'}
                </div>
              )}

              {/* Dynamic Selected Options & Locked Pricing Snapshot Display */}
              {request.pricingSnapshot && (
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        {language === 'ta' ? 'பூட்டப்பட்ட நிலையான விலை (கட்டண விவரம்)' : 'Locked Fixed Price Snapshot'}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-200 font-mono">
                      v{request.pricingSnapshot.pricingVersion} Fixed
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
                      {language === 'ta' ? 'மொத்த கட்டணம்' : 'Total Fixed Amount'}
                    </span>
                    <span className="text-xl font-black text-indigo-950 font-mono">
                      ₹{request.pricingSnapshot.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Looms Count</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{request.quantity} Looms</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Preferred Date</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Slot</span>
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
              title={language === 'ta' ? 'வடிவமைப்பு கோப்புகள் / வரைபடங்கள்' : 'Design Graphs & Motif Files'}
              subtitle={`${request.designFiles.length} file(s) attached`}
            />
            <CardContent>
              {request.designFiles.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No design files attached.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.designFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors group"
                    >
                      {file.fileType.includes('image') ? (
                        <ImageIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-600 shrink-0" />
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900">
                          {file.fileName}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {(file.fileSize / 1024).toFixed(0)} KB • Click to open
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-900 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geolocation Map */}
          {request.location && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Loom Workshop Location</h3>
              <LocationMapViewer
                location={request.location}
                weaverName={request.weaverId?.name}
                businessName={request.weaverId?.businessName}
              />
            </div>
          )}
        </div>

        {/* Right Column: Artisan Quotations */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" />
                  <span>{language === 'ta' ? 'வரப்பெற்ற விலைப்பட்டியல்கள்' : 'Received Quotations'}</span>
                </div>
              }
              subtitle={`${quotes.length} Jacquard Master quotation(s)`}
            />
            <CardContent className="space-y-4">
              {quotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-stone-50 rounded-xl border border-stone-100">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
                  <p className="font-semibold text-slate-700">Awaiting Jacquard Master Quotes</p>
                  <p className="mt-1 text-slate-500">
                    Nearby masters in {request.location?.district} have been notified and will submit quotes shortly.
                  </p>
                </div>
              ) : (
                quotes.map((q) => (
                  <div
                    key={q._id}
                    className={`p-4 rounded-xl border transition-all ${
                      q.status === 'ACCEPTED'
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-100'
                        : q.status === 'REJECTED'
                        ? 'border-stone-200 bg-stone-50 opacity-60'
                        : 'border-amber-300 bg-white shadow-2xs'
                    }`}
                  >
                    {/* Worker Info */}
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {q.workerId?.name || 'Jacquard Master'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Experience: {q.workerId?.experienceYears || '15+'} years • Phone: {q.workerId?.phone}
                        </p>
                      </div>
                      <Badge status={q.status} />
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="py-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Base Work Charge:</span>
                        <span className="font-medium text-slate-900">₹{q.baseCharge}</span>
                      </div>
                      {q.additionalCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Fitting / Extra Materials:</span>
                          <span className="font-medium text-slate-900">₹{q.additionalCharge}</span>
                        </div>
                      )}
                      {q.travelCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Travel / Conveyance:</span>
                          <span className="font-medium text-slate-900">₹{q.travelCharge}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm text-indigo-950 pt-2 border-t border-stone-100">
                        <span>Total Quoted:</span>
                        <span className="text-base text-indigo-900 font-mono">₹{q.totalAmount}</span>
                      </div>
                    </div>

                    {q.notes && (
                      <p className="text-[11px] bg-stone-50 p-2 rounded-lg text-slate-600 mb-3 italic">
                        "{q.notes}"
                      </p>
                    )}

                    {/* Action buttons */}
                    {q.status === 'SENT' && request.status !== 'CONFIRMED' && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="success"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedQuote(q);
                            setActionType('ACCEPT');
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Accept & Confirm</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 text-xs"
                          onClick={() => {
                            setSelectedQuote(q);
                            setActionType('REJECT');
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Decline</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accept / Reject Quote Modal */}
      <Modal
        isOpen={!!selectedQuote && !!actionType}
        onClose={() => {
          setSelectedQuote(null);
          setActionType(null);
        }}
        title={actionType === 'ACCEPT' ? 'Confirm & Accept Quotation' : 'Decline Quotation'}
      >
        {selectedQuote && (
          <div className="space-y-4 text-xs sm:text-sm">
            {actionType === 'ACCEPT' ? (
              <>
                <p className="text-slate-600">
                  You are confirming the Jacquard work with{' '}
                  <strong>{selectedQuote.workerId?.name}</strong> for a total agreed charge of{' '}
                  <strong className="text-indigo-950 text-base font-mono">₹{selectedQuote.totalAmount}</strong>.
                </p>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  ✓ This will automatically book Master Artisan {selectedQuote.workerId?.name} and create
                  a confirmed Job ticket.
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-600">
                  Please specify a reason for declining the quote from {selectedQuote.workerId?.name}:
                </p>
                <textarea
                  rows={2}
                  placeholder="e.g. Rate higher than budget / schedule mismatch"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700"
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedQuote(null);
                  setActionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={actionType === 'ACCEPT' ? 'success' : 'danger'}
                onClick={handleQuoteResponse}
                isLoading={isSubmittingAction}
              >
                {actionType === 'ACCEPT' ? 'Confirm Acceptance' : 'Decline Quote'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Request Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Work Request"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Are you sure you want to cancel this work request? This will close all discussions with
            artisans.
          </p>
          <textarea
            rows={2}
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Request
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelRequest}
              isLoading={isSubmittingAction}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
