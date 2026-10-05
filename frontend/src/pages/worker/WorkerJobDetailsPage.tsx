import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { jobApi } from '../../api/jobApi';
import { workRequestApi } from '../../api/workRequestApi';
import { IJob, IJobStatusHistory, IPayment } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { LocationMapViewer } from '../../components/ui/LocationMapViewer';
import {
  ArrowLeft,
  Phone,
  CheckCircle2,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Receipt,
  ExternalLink,
  AlertCircle,
  Clock3,
  Check
} from 'lucide-react';

export const WorkerJobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [job, setJob] = useState<IJob | null>(null);
  const [history, setHistory] = useState<IJobStatusHistory[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [navigationUrl, setNavigationUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Status Action Modals
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  // Work Completion & Payment Reporting Form State
  const [reportedPaymentStatus, setReportedPaymentStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'OTHER'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const fetchJob = async () => {
    if (!id) return;
    try {
      const res = await jobApi.getJobById(id);
      if (res.success && res.data) {
        setJob(res.data.job);
        setHistory(res.data.history || []);
        setPayments(res.data.payments || []);
        if (res.data.navigationUrl) setNavigationUrl(res.data.navigationUrl);
        setPaidAmount(res.data.job.totalAgreedAmount);
      }
    } catch (err) {
      console.error('Error fetching worker job details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleStartWork = async () => {
    if (!id) return;
    setIsUpdatingStatus(true);
    try {
      const res = await jobApi.updateJobStatus(id, {
        status: 'IN_PROGRESS',
        note: 'Jacquard master arrived on-site and started loom work.'
      });
      if (res.success) fetchJob();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Work Completion & Explicit Payment Report
  const handleCompleteWorkAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsUpdatingStatus(true);
    try {
      const workRequestId = typeof job.requestId === 'object' ? job.requestId._id : job.requestId;

      const res = await workRequestApi.completeWorkRequest(workRequestId, {
        paymentStatus: reportedPaymentStatus,
        paymentMode: reportedPaymentStatus === 'PAID' ? paymentMode : undefined,
        paidAmount: reportedPaymentStatus === 'PAID' ? Number(paidAmount) : 0,
        paymentDate: reportedPaymentStatus === 'PAID' ? paymentDate : undefined,
        completionNotes: completionNotes || 'Work completed on-site.'
      });

      if (res.success) {
        setCompleteModalOpen(false);
        fetchJob();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting work completion report.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-stone-500">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="text-base font-bold text-stone-800">Job not found</h3>
        <Link to="/worker/jobs">
          <Button size="sm">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const workRequest = job.requestId as any;
  const lineItems = workRequest?.items || [];

  return (
    <div className="relative space-y-6 max-w-5xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/worker/jobs')}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-stone-900">{job.jobId}</span>
              <Badge status={job.status} />
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  workRequest?.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {workRequest?.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT UNPAID'}
              </span>
            </div>
            <h1 className="text-xl font-black text-stone-900 mt-1">
              {job.workTypeId?.name ? (job.workTypeId.name[language] || job.workTypeId.name.en) : 'Jacquard Service Work'}
            </h1>
          </div>
        </div>

        {/* Action Controls for Status */}
        <div className="flex items-center gap-2">
          {['CONFIRMED', 'SCHEDULED'].includes(job.status) && (
            <Button
              size="md"
              variant="secondary"
              className="font-bold shadow-xs"
              onClick={handleStartWork}
              isLoading={isUpdatingStatus}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              <span>{t('worker.startWork', 'Start Work at Loom')}</span>
            </Button>
          )}

          {job.status === 'IN_PROGRESS' && (
            <Button
              size="md"
              variant="success"
              className="font-bold shadow-xs"
              onClick={() => setCompleteModalOpen(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>{language === 'ta' ? 'பணி நிறைவு & கட்டண அறிக்கை' : 'Complete Work & Report Payment'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <Card>
        <CardContent className="p-6">
          <StatusTimeline currentStatus={job.status} history={history} />
        </CardContent>
      </Card>

      {/* Main Grid: Work Requirements & Location Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Weaver Contact & Loom Location */}
          <Card className="border-amber-200/80">
            <CardHeader title="Weaver Client & Workshop Contact" />
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 text-xs">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    {job.weaverId?.businessName || job.weaverId?.name}
                  </h3>
                  <p className="text-stone-600 mt-0.5">Contact Person: {job.weaverId?.name}</p>
                  <p className="text-indigo-900 font-semibold mt-1">📞 {job.weaverId?.phone}</p>
                </div>

                <a
                  href={`tel:${job.weaverId?.phone}`}
                  className="p-2.5 rounded-xl bg-indigo-900 text-white hover:bg-indigo-800 transition-colors shadow-2xs"
                  title="Call Weaver"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {workRequest?.location && (
                <LocationMapViewer
                  location={workRequest.location}
                  weaverName={job.weaverId?.name}
                  businessName={job.weaverId?.businessName}
                  phone={job.weaverId?.phone}
                />
              )}
            </CardContent>
          </Card>

          {/* Work Requirements & Line Items */}
          <Card>
            <CardHeader title="Loom Setup & Work Specification" />
            <CardContent className="space-y-4 text-xs sm:text-sm">
              <p className="p-4 bg-stone-50/80 rounded-xl border border-stone-200/70 font-medium text-stone-800">
                {workRequest?.description || 'Jacquard setup'}
              </p>

              {/* Multi-Service Line Items breakdown */}
              {lineItems.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-stone-700 text-xs uppercase tracking-wider">
                    Service Line Items
                  </h5>
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white text-xs shadow-2xs">
                    {lineItems.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-900 block">
                            {idx + 1}. {item.serviceName?.en} - {item.optionName?.en}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {item.inputValue} {item.unit} @ ₹{item.rate}/{item.unit}
                          </span>
                        </div>
                        <span className="font-black text-stone-900 font-mono">
                          ₹{item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workRequest?.designFiles?.length > 0 && (
                <div>
                  <h5 className="font-bold text-stone-700 text-xs uppercase tracking-wider mb-2">
                    Design Files / Punch Graphs
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workRequest.designFiles.map((f: any, idx: number) => (
                      <a
                        key={idx}
                        href={f.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition-colors text-xs shadow-2xs"
                      >
                        {f.fileType?.includes('image') ? (
                          <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        <span className="font-bold text-stone-800 truncate flex-1">{f.fileName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charges & Payment Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-stone-200/90 shadow-xs">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-800" />
                  <span>Fixed Bill & Payment Status</span>
                </div>
              }
            />
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone-700 font-medium">Total Fixed Bill:</span>
                  <span className="font-black text-xl text-stone-900 font-mono">
                    ₹{workRequest?.finalAmount || job.totalAgreedAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/60">
                  <span className="text-stone-700 font-medium">Payment Status:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                      workRequest?.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {workRequest?.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                {workRequest?.paymentStatus === 'PAID' && (
                  <div className="pt-2 text-[11px] text-stone-600 space-y-1">
                    <p>Mode: <strong className="text-stone-900">{workRequest.paymentMode || 'CASH'}</strong></p>
                    <p>Paid Amount: <strong className="text-emerald-700 font-mono">₹{workRequest.paidAmount}</strong></p>
                  </div>
                )}
              </div>

              {job.status === 'IN_PROGRESS' && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950">
                  <p className="font-bold">Ready to complete work?</p>
                  <p className="text-[11px] text-indigo-800 mt-1">
                    Click &quot;Complete Work &amp; Report Payment&quot; to report completion and whether payment is Paid or Unpaid.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="mt-3 w-full font-bold"
                    onClick={() => setCompleteModalOpen(true)}
                  >
                    Complete Work &amp; Report Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Work Completion & Payment Reporting Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={language === 'ta' ? 'பணி நிறைவு & கட்டண அறிக்கை' : 'Work Completion & Payment Report'}
      >
        <form onSubmit={handleCompleteWorkAndPayment} className="space-y-4 text-xs sm:text-sm">
          <p className="text-stone-600 text-xs">
            Confirm on-site work completion and report the customer&apos;s payment status accurately.
          </p>

          {/* Payment Status Switch */}
          <div className="space-y-2">
            <label className="block font-bold text-stone-800 text-xs">
              {language === 'ta' ? 'கட்டணம் பெறப்பட்டதா? *' : 'Has Payment Been Collected? *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportedPaymentStatus('PAID')}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-xs transition-all ${
                  reportedPaymentStatus === 'PAID'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{language === 'ta' ? 'ஆம் - கட்டணம் செலுத்தப்பட்டது (PAID)' : 'YES - Paid'}</span>
              </button>

              <button
                type="button"
                onClick={() => setReportedPaymentStatus('UNPAID')}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-xs transition-all ${
                  reportedPaymentStatus === 'UNPAID'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <Clock3 className="w-4 h-4 text-amber-600" />
                <span>{language === 'ta' ? 'இல்லை - நிலுவை (UNPAID)' : 'NO - Unpaid (Pending)'}</span>
              </button>
            </div>
          </div>

          {/* If PAID: Collect payment mode and amount */}
          {reportedPaymentStatus === 'PAID' ? (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-300 py-2 px-2.5 text-xs bg-white font-bold"
                  >
                    <option value="CASH">Cash (நேரடி ரொக்கம்)</option>
                    <option value="ONLINE">Online UPI / GPay / NetBanking</option>
                    <option value="OTHER">Other / Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-300 py-2 px-2.5 text-xs font-black text-stone-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 py-2 px-2.5 text-xs bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Work Completed, Payment Unpaid
              </p>
              <p className="text-[11px] text-amber-800 mt-1">
                The job will be marked as <strong>COMPLETED</strong>, and recorded as <strong>UNPAID</strong> in the platform system. You or Admin can record payment receipt later once collected.
              </p>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 text-xs mb-1">
              Work Notes / Loom Testing Confirmation
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Card setup mounted and tested on loom with sample weave."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              type="submit"
              isLoading={isUpdatingStatus}
              className="font-bold"
            >
              Submit Completion &amp; Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
