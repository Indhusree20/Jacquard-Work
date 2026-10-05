import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { jobApi } from '../../api/jobApi';
import { IWorkRequest, IJob } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  IndianRupee,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { t, language } = useLanguage();

  const [availableRequests, setAvailableRequests] = useState<IWorkRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<IJob[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(user?.isAvailable ?? true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, jobRes] = await Promise.all([
          workRequestApi.getWorkRequests({ scope: 'available', limit: 5 }),
          jobApi.getJobs({ limit: 5 })
        ]);
        if (reqRes.success) setAvailableRequests(reqRes.data.requests);
        if (jobRes.success) setActiveJobs(jobRes.data.jobs);
      } catch (err) {
        console.error('Error loading worker dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const nextState = !isAvailable;
      const res = await jobApi.toggleAvailability(nextState);
      if (res.success && res.data.user) {
        setIsAvailable(nextState);
        updateUserData(res.data.user);
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const totalEarnings = activeJobs
    .filter((j) => j.status === 'COMPLETED')
    .reduce((sum, j) => sum + j.totalAgreedAmount, 0);

  return (
    <div className="space-y-6 relative pb-12">
      {/* Master Welcome Header */}
      <div className="relative bg-gradient-to-r from-stone-50 via-white to-amber-50/40 rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-craft-xs overflow-hidden">
        <ThariWatermark
          variant="jacquard-harness"
          position="top-right"
          size="lg"
          opacity={0.06}
          className="-mr-8 -mt-8 hidden sm:block"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-black shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('worker.dashboardTitle', 'Jacquard Master Artisan Portal')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {language === 'ta' ? `வணக்கம், ${user?.name}` : `Welcome, ${user?.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t(
                'worker.dashboardSubtitle',
                'View open loom requests in your district, send quotations, and track daily schedules.'
              )}
            </p>
          </div>

          {/* Availability Switch */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-craft-xs flex items-center justify-between sm:flex-col sm:items-start gap-3 shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                Work Status
              </span>
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                {isAvailable ? 'Available for Work' : 'Currently Busy'}
              </span>
            </div>
            <Button
              size="xs"
              variant={isAvailable ? 'outline' : 'primary'}
              onClick={handleToggleAvailability}
              className="text-xs"
            >
              {isAvailable ? 'Set as Busy' : 'Set as Available'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
              Available Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-mono">{availableRequests.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">In your district clusters</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              Active Loom Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-2xs">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-2 font-mono">
            {activeJobs.filter((j) => ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'].includes(j.status)).length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Underway on-site</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              Completed Works
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2 font-mono">
            {activeJobs.filter((j) => j.status === 'COMPLETED').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Successfully tuned</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Total Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shadow-2xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-2 font-mono">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">From completed jobs</span>
        </Card>
      </div>

      {/* Main Content Grid: Available Requests & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Requests */}
        <Card>
          <CardHeader
            title={language === 'ta' ? 'கிடைக்கும் புதிய கோரிக்கைகள்' : 'Available Work Requests'}
            subtitle={language === 'ta' ? 'உங்கள் மாவட்டத்தில் புதிய தறி வேலைகள்' : 'Loom setup requests in your active district'}
            action={
              <Link to="/worker/available" className="text-xs font-bold text-indigo-900 hover:text-amber-800 flex items-center gap-1 transition-colors">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading available requests...</div>
            ) : availableRequests.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Layers className="w-6 h-6 text-amber-700" />}
                  title={language === 'ta' ? 'தற்போது புதிய கோரிக்கைகள் இல்லை' : 'No Open Requests in Cluster'}
                  description={language === 'ta' ? 'உங்கள் மாவட்டத்தில் புதிய கோரிக்கைகள் பதிவு செய்யப்படும்போது இங்கே தோன்றும்.' : 'New weaver work requests in your district will appear here.'}
                />
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {availableRequests.map((req) => (
                  <Link
                    key={req._id}
                    to={`/worker/requests/${req._id}`}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-stone-50/80 transition-colors block group"
                  >
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{req.requestId}</span>
                        <Badge status={req.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
                        {req.workTypeId?.name ? (req.workTypeId.name[language] || req.workTypeId.name.en) : 'Jacquard Service'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {req.quantity} Loom(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(req.requiredDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {req.location?.city || 'Salem'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-950 block font-mono">
                        ₹{(req.estimatedAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">Admin Base</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Loom Jobs */}
        <Card>
          <CardHeader
            title={language === 'ta' ? 'எனது நடப்பு பணிகள்' : 'My Active Jobs'}
            subtitle={language === 'ta' ? 'அட்டவணைப்படுத்தப்பட்ட தறி வேலைகள்' : 'Scheduled artisan field assignments'}
            action={
              <Link to="/worker/jobs" className="text-xs font-bold text-indigo-900 hover:text-amber-800 flex items-center gap-1 transition-colors">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading jobs...</div>
            ) : activeJobs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Wrench className="w-6 h-6 text-indigo-900" />}
                  title={language === 'ta' ? 'செயலில் உள்ள பணிகள் இல்லை' : 'No Active Assignments'}
                  description={language === 'ta' ? 'கிடைக்கும் கோரிக்கைகளை ஏற்று உங்கள் பணியை தொடங்குங்கள்.' : 'Accept open requests to schedule and begin on-site loom tuning.'}
                />
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {activeJobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/worker/jobs/${job._id}`}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-stone-50/80 transition-colors block group"
                  >
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{job.jobId}</span>
                        <Badge status={job.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
                        {job.workTypeId?.name ? (job.workTypeId.name[language] || job.workTypeId.name.en) : 'Jacquard Work'}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Weaver: {job.weaverId?.name || 'Loom Owner'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(job.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-950 block font-mono">
                        ₹{job.totalAgreedAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {job.paymentStatus}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
