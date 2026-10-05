import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { jobApi } from '../../api/jobApi';
import { IWorkRequest, IJob, WorkRequestStatus } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { Calendar, UserCheck, UserX, Filter } from 'lucide-react';

export const AdminJobsQuotesPage: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'JOBS'>('REQUESTS');
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqRes, jobRes] = await Promise.all([
          workRequestApi.getWorkRequests({ limit: 100 }),
          jobApi.getJobs({ limit: 100 })
        ]);
        if (reqRes.success) setRequests(reqRes.data.requests);
        if (jobRes.success) setJobs(jobRes.data.jobs);
      } catch (err) {
        console.error('Error loading jobs & requests for admin:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getServiceLabel = (r: IWorkRequest) => {
    if (r.items && r.items.length > 0) {
      const firstItem = r.items[0];
      const svcName = firstItem.serviceName?.[language] || firstItem.serviceName?.en || 'Service';
      const optName = firstItem.optionName?.[language] || firstItem.optionName?.en || '';
      return `${svcName}${optName ? ` (${optName})` : ''}${r.items.length > 1 ? ` +${r.items.length - 1} more` : ''}`;
    }
    if (r.workTypeId?.name) {
      return r.workTypeId.name[language] || r.workTypeId.name.en;
    }
    return r.description || 'Jacquard Work';
  };

  return (
    <div className="relative space-y-6 max-w-7xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="MONITORING • பணிகள் & கோரிக்கைகள்"
        title={language === 'ta' ? 'அனைத்து பணிகள் & கோரிக்கைகள் மேலாண்மை' : 'Work Requests & Jobs Oversight'}
        subtitle={
          language === 'ta'
            ? 'நெசவாளர்களின் கோரிக்கைகள், ஆசாரி ஏற்பு மற்றும் வேலைகளின் முழுமையான நேரலை நிலை'
            : 'Track submitted work requests, Master assignments, pricing snapshots, and active field execution.'
        }
      />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'border-indigo-900 text-indigo-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Work Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('JOBS')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'JOBS'
                ? 'border-indigo-900 text-indigo-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Confirmed & Active Jobs ({jobs.length})
          </button>
        </div>

        {/* Status Filter for Requests */}
        {activeTab === 'REQUESTS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {[
              { id: 'ALL', label: 'All' },
              { id: 'REQUESTED', label: 'Requested' },
              { id: 'MASTER_ACCEPTED', label: 'Master Accepted' },
              { id: 'FINAL_CHARGES_PENDING_USER', label: 'Pending Approval' },
              { id: 'USER_FINAL_CONFIRMED', label: 'User Confirmed' },
              { id: 'SCHEDULED', label: 'Scheduled' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-indigo-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <Card className="border-stone-200 shadow-craft-xs">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading work requests...</div>
          ) : activeTab === 'REQUESTS' ? (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 sm:p-4">Request ID</th>
                  <th className="p-3.5 sm:p-4">Weaver</th>
                  <th className="p-3.5 sm:p-4">Service</th>
                  <th className="p-3.5 sm:p-4">District</th>
                  <th className="p-3.5 sm:p-4">Preferred Dates</th>
                  <th className="p-3.5 sm:p-4">Master</th>
                  <th className="p-3.5 sm:p-4">Status</th>
                  <th className="p-3.5 sm:p-4 text-right">Base Amount</th>
                  <th className="p-3.5 sm:p-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-stone-400">
                      No work requests found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-indigo-950">
                        {r.requestId}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-stone-900">{r.weaverId?.name || 'Weaver'}</div>
                        {r.weaverId?.businessName && (
                          <div className="text-[10px] text-stone-500">{r.weaverId.businessName}</div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 max-w-[200px] truncate font-medium text-stone-800">
                        {getServiceLabel(r)}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="font-semibold text-stone-900">{r.location?.district || '—'}</span>
                        <div className="text-[10px] text-stone-500">{r.location?.city}</div>
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-[11px]">
                        <div>1st: {r.preferredDate1 ? new Date(r.preferredDate1).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
                        {r.preferredDate2 && (
                          <div className="text-stone-400">2nd: {new Date(r.preferredDate2).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {r.assignedWorkerId ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{r.assignedWorkerId.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                            <UserX className="w-3 h-3" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <Badge status={r.status} size="sm" />
                      </td>
                      <td className="p-3.5 sm:p-4 text-right font-bold text-stone-900 font-mono">
                        ₹{(r.finalAmount || r.estimatedAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 sm:p-4 text-stone-400 text-[11px] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Job ID</th>
                  <th className="p-4">Weaver</th>
                  <th className="p-4">Jacquard Master</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Agreed Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {jobs.map((j) => (
                  <tr key={j._id} className="hover:bg-stone-50/80">
                    <td className="p-4 font-mono font-bold text-stone-900">{j.jobId}</td>
                    <td className="p-4 font-semibold text-stone-800">
                      {j.weaverId?.businessName || j.weaverId?.name}
                    </td>
                    <td className="p-4 text-amber-900 font-medium">{j.workerId?.name}</td>
                    <td className="p-4">{new Date(j.scheduledDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge status={j.status} size="sm" />
                    </td>
                    <td className="p-4 text-right font-bold text-stone-900 font-mono">
                      ₹{j.totalAgreedAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
