import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { paymentReportApi, PaymentReportFilterParams } from '../../api/paymentReportApi';
import { workRequestApi } from '../../api/workRequestApi';
import { districtApi } from '../../api/districtApi';
import { IWorkRequest, IUnpaidSummary, IDistrict, IPaymentStatusHistory } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Banknote,
  Receipt,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Edit,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const AdminPaymentReportsPage: React.FC = () => {
  const { language } = useLanguage();

  const [records, setRecords] = useState<IWorkRequest[]>([]);
  const [unpaidSummary, setUnpaidSummary] = useState<IUnpaidSummary | null>(null);
  const [districts, setDistricts] = useState<IDistrict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [workStatusFilter, setWorkStatusFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IWorkRequest | null>(null);

  const [updatePaymentModalOpen, setUpdatePaymentModalOpen] = useState(false);
  const [updateStatusRecord, setUpdateStatusRecord] = useState<IWorkRequest | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIALLY_PAID'>('PAID');
  const [newPaymentMode, setNewPaymentMode] = useState<string>('CASH');
  const [newPaidAmount, setNewPaidAmount] = useState<number>(0);
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<IPaymentStatusHistory[]>([]);

  const fetchSummary = async () => {
    try {
      const res = await paymentReportApi.getUnpaidSummary();
      if (res.success && res.data?.summary) {
        setUnpaidSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching unpaid summary:', err);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await districtApi.getActiveDistricts();
      if (res.success && res.data?.districts) {
        setDistricts(res.data.districts);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: PaymentReportFilterParams = {
        paymentStatus: paymentStatusFilter,
        workStatus: workStatusFilter,
        district: districtFilter,
        search: searchQuery || undefined,
        page,
        limit: 15
      };

      const res = await paymentReportApi.getPaymentReports(params);
      if (res.success && res.data) {
        setRecords(res.data.records);
        setTotalCount(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Error loading payment reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [paymentStatusFilter, workStatusFilter, districtFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleOpenBreakdown = (record: IWorkRequest) => {
    setSelectedRecord(record);
    setBreakdownModalOpen(true);
  };

  const handleOpenUpdatePayment = (record: IWorkRequest) => {
    setUpdateStatusRecord(record);
    setNewPaymentStatus(record.paymentStatus === 'PAID' ? 'PAID' : 'PAID');
    setNewPaymentMode(record.paymentMode || 'CASH');
    setNewPaidAmount(record.paidAmount || record.finalAmount || record.estimatedAmount || 0);
    setUpdateNotes('');
    setUpdatePaymentModalOpen(true);
  };

  const handleOpenHistory = async (record: IWorkRequest) => {
    setSelectedRecord(record);
    try {
      const res = await paymentReportApi.getPaymentHistory(record._id);
      if (res.success && res.data) {
        setPaymentHistory(res.data.history);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    }
  };

  const handleSavePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateStatusRecord) return;

    setIsUpdating(true);
    try {
      const res = await workRequestApi.updatePaymentStatus(updateStatusRecord._id, {
        paymentStatus: newPaymentStatus,
        paymentMode: newPaymentMode,
        paidAmount: Number(newPaidAmount),
        notes: updateNotes || 'Admin payment status override'
      });

      if (res.success) {
        setUpdatePaymentModalOpen(false);
        fetchReports();
        fetchSummary();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Page Header with subtle Thari watermark */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ThariWatermark variant="shuttle-threads" position="top-right" size="sm" opacity={0.035} className="-mr-4 -mt-4 hidden sm:block" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-xs font-black shadow-2xs">
            <Receipt className="w-3.5 h-3.5 text-indigo-700" />
            <span>{language === 'ta' ? 'கட்டண கண்காணிப்பு & அறிக்கைகள்' : 'Admin Payment & Settlement Tracking'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'வேலை கட்டண அறிக்கைகள் & நிலுவை கண்காணிப்பு' : 'Work Payment & Unpaid Jobs Tracking'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'ta'
              ? 'முடிவடைந்த வேலைகளின் கட்டண நிலை (Paid / Unpaid) மற்றும் நிலுவைத் தொகைகளை கண்காணிக்கவும்.'
              : 'Track paid vs unpaid completed Jacquard jobs, outstanding balances, and worker payment logs.'}
          </p>
        </div>

        <Button
          onClick={() => {
            fetchSummary();
            fetchReports();
          }}
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          <span>{language === 'ta' ? 'புதுப்பிக்க' : 'Refresh Data'}</span>
        </Button>
      </div>

      {/* Unpaid Work Summary Cards (Refined Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Unpaid Work */}
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
              {language === 'ta' ? 'கட்டண நிலுவை வேலைகள்' : 'Unpaid Completed Jobs'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shadow-2xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-mono">
            {unpaidSummary?.totalUnpaidCompletedJobs ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed, pending settlement</span>
        </Card>

        {/* Card 2: Total Outstanding Amount */}
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
              {language === 'ta' ? 'மொத்த நிலுவைத் தொகை' : 'Outstanding Balance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shadow-2xs">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-mono">
            ₹{(unpaidSummary?.totalOutstandingCompletedAmount ?? 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Total pending payout</span>
        </Card>

        {/* Card 3: Total Paid Jobs */}
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              {language === 'ta' ? 'செலுத்தப்பட்ட வேலைகள்' : 'Settled Jobs'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2 font-mono">
            {unpaidSummary?.totalPaidJobs ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Payment confirmed</span>
        </Card>

        {/* Card 4: Total Collected Amount */}
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              {language === 'ta' ? 'மொத்த வசூல்' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{(unpaidSummary?.totalCollectedAmount ?? 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Platform settlements</span>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="border-stone-200/90 shadow-craft-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    language === 'ta'
                      ? 'கோரிக்கை எண், நெசவாளர், ஆசாரி, நகரம் மூலம் தேடுக...'
                      : 'Search by Request ID, Weaver, Worker, City...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700"
                />
              </div>
              <Button type="submit" size="sm" variant="primary">
                {language === 'ta' ? 'தேடு' : 'Search'}
              </Button>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-stone-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">UNPAID (Pending)</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </select>

              <select
                value={workStatusFilter}
                onChange={(e) => {
                  setWorkStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-stone-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Work Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="REQUESTED">REQUESTED</option>
              </select>

              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-stone-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Districts</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.name.en}>
                    {d.name.en} ({d.name.ta})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table with Light Surface */}
      <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-craft-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Request / Job</th>
                <th className="py-3.5 px-4">Weaver Client</th>
                <th className="py-3.5 px-4">Assigned Worker</th>
                <th className="py-3.5 px-4">District / City</th>
                <th className="py-3.5 px-4">Work Status</th>
                <th className="py-3.5 px-4">Bill Amount</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-700" />
                    Loading payment records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment records found matching the current filters.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isPaid = rec.paymentStatus === 'PAID';
                  const isUnpaid = rec.paymentStatus === 'UNPAID';
                  const amount = rec.finalAmount || rec.estimatedAmount || 0;

                  return (
                    <tr
                      key={rec._id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isUnpaid && rec.status === 'COMPLETED' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {rec.requestId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {rec.weaverId?.businessName || rec.weaverId?.name || 'Unknown'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {rec.weaverId?.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {rec.assignedWorkerId ? (
                          <>
                            <span className="font-bold text-slate-800 block">
                              {rec.assignedWorkerId.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {rec.assignedWorkerId.phone}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {rec.location?.district}
                        </span>
                        <span className="text-[11px] text-slate-500">{rec.location?.city}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={rec.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={rec.paymentStatus || 'UNPAID'} size="sm" />
                        {isPaid && rec.paymentMode && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            via {rec.paymentMode}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenBreakdown(rec)}
                          icon={<Eye className="w-3 h-3" />}
                        >
                          Bill
                        </Button>

                        <Button
                          size="xs"
                          variant="accent"
                          onClick={() => handleOpenUpdatePayment(rec)}
                          icon={<Edit className="w-3 h-3" />}
                        >
                          Status
                        </Button>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenHistory(rec)}
                          title="View Payment Status History"
                        >
                          Logs
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500 bg-stone-50/60">
            <span>
              Showing Page {page} of {pages} ({totalCount} total jobs)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bill Breakdown Modal */}
      {breakdownModalOpen && selectedRecord && (
        <Modal
          isOpen={breakdownModalOpen}
          onClose={() => setBreakdownModalOpen(false)}
          title={`Bill Breakdown - ${selectedRecord.requestId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Weaver</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.weaverId?.businessName || selectedRecord.weaverId?.name}
                </span>
                <span className="text-slate-500 block">{selectedRecord.weaverId?.phone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                <span className="font-bold text-slate-900">{selectedRecord.location?.district}</span>
                <span className="text-slate-500 block">{selectedRecord.location?.address}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                Itemized Service Line Items
              </h5>

              {selectedRecord.items && selectedRecord.items.length > 0 ? (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {selectedRecord.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {idx + 1}. {item.serviceName?.en} - {item.optionName?.en}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.inputValue} {item.unit} @ ₹{item.rate}/{item.unit} (Model: {item.pricingModel})
                        </span>
                      </div>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        ₹{item.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : selectedRecord.pricingSnapshot?.breakdown ? (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {selectedRecord.pricingSnapshot.breakdown.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.label.en}</span>
                      <span className="font-black text-slate-900 font-mono">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No itemized breakdown recorded.</p>
              )}
            </div>

            {/* Total */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold block">
                  Total Final Amount
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Locked Version v{selectedRecord.pricingSnapshot?.pricingVersion || 1}
                </span>
              </div>
              <span className="text-2xl font-black text-indigo-950 font-mono">
                ₹{(selectedRecord.finalAmount || selectedRecord.estimatedAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setBreakdownModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Payment Status Modal */}
      {updatePaymentModalOpen && updateStatusRecord && (
        <Modal
          isOpen={updatePaymentModalOpen}
          onClose={() => setUpdatePaymentModalOpen(false)}
          title={`Update Payment - ${updateStatusRecord.requestId}`}
        >
          <form onSubmit={handleSavePaymentStatus} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Payment Status *</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                className="w-full rounded-xl border border-stone-300 py-2.5 px-3 text-xs bg-white font-bold"
              >
                <option value="PAID">PAID (Settlement Completed)</option>
                <option value="UNPAID">UNPAID (Outstanding Pending)</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              </select>
            </div>

            {newPaymentStatus !== 'UNPAID' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 py-2 px-2 text-xs bg-white"
                  >
                    <option value="CASH">Cash (ரொக்கம்)</option>
                    <option value="ONLINE">UPI / Online Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-300 py-2 px-2 text-xs font-black bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Audit / Admin Notes
              </label>
              <textarea
                rows={2}
                placeholder="Reason or reference for status change..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUpdatePaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isUpdating}
              >
                Save Payment Status
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status History Logs Modal */}
      {historyModalOpen && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Payment Status Audit History"
        >
          <div className="space-y-3 text-xs">
            {paymentHistory.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">No payment history logged yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {paymentHistory.map((h, idx) => (
                  <div key={idx} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800">
                        {h.previousStatus} → <span className="text-indigo-900">{h.newStatus}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.timestamp || h.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {h.amount ? (
                      <p className="text-[11px] text-slate-600">
                        Amount: <strong className="font-mono">₹{h.amount}</strong> ({h.paymentMode || 'N/A'})
                      </p>
                    ) : null}
                    {h.notes && <p className="text-[11px] text-slate-500 italic">&ldquo;{h.notes}&rdquo;</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <Button size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
