import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { IWorkRequest } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const WeaverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await workRequestApi.getWorkRequests({ limit: 10 });
        if (res.success) setRequests(res.data.requests);
      } catch (err) {
        console.error('Error loading weaver dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingConfirmationCount = requests.filter(
    (r) => r.status === 'FINAL_CHARGES_PENDING_USER' || r.status === 'QUOTED'
  ).length;
  const inProgressCount = requests.filter((r) =>
    ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status)
  ).length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 relative pb-12">
      {/* Thari Watermark in Dashboard Header */}
      <div className="relative bg-gradient-to-r from-stone-50 via-white to-amber-50/40 rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-craft-xs overflow-hidden">
        <ThariWatermark
          variant="loom-watermark"
          position="top-right"
          size="lg"
          opacity={0.06}
          className="-mr-8 -mt-8 hidden sm:block"
        />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-xs font-black shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('weaver.dashboardTitle', 'Weaver Control Center')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {language === 'ta' ? `வணக்கம், ${user?.name}` : `Welcome, ${user?.name}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t(
              'weaver.dashboardSubtitle',
              'Manage your Jacquard setup requests, worker quotations, and loom operations.'
            )}
          </p>
          <div className="pt-2">
            <Link to="/weaver/requests/new">
              <Button size="md" withArrow>
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>{t('weaver.createRequest', 'Post New Jacquard Work Request')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row: Work Request Lifecycle */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{requests.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">In your weaving unit</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
              Action Required
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-2 font-mono">{pendingConfirmationCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Quotes / Final approvals</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-2 font-mono">{inProgressCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled on looms</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2 font-mono">{completedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified & settled</span>
        </Card>
      </div>

      {/* Main Content Grid: Work Requests & Actionable Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Work Requests (8 cols) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title={language === 'ta' ? 'சமீபத்திய வேலை கோரிக்கைகள்' : 'Recent Work Requests'}
              subtitle={language === 'ta' ? 'உங்கள் தறி வேலைகளின் நேரலை நிலை' : 'Live progress and quotation status of your requests'}
              action={
                <Link to="/weaver/requests" className="text-xs font-bold text-indigo-900 hover:text-amber-800 flex items-center gap-1 transition-colors">
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<FileSpreadsheet className="w-6 h-6 text-indigo-900" />}
                    title={language === 'ta' ? 'வேலை கோரிக்கைகள் எதுவும் இல்லை' : 'No Work Requests Yet'}
                    description={language === 'ta' ? 'உங்கள் புதிய ஜாக்கார்ட் பணி கோரிக்கையை சமர்ப்பிக்கவும்.' : 'Your submitted Jacquard work requests will appear here.'}
                    actionLabel={language === 'ta' ? 'புதிய கோரிக்கை உருவாக்கு' : 'Create Work Request'}
                    actionLink="/weaver/requests/new"
                  />
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {requests.map((req) => (
                    <Link
                      key={req._id}
                      to={
                        req.status === 'FINAL_CHARGES_PENDING_USER'
                          ? `/weaver/requests/${req._id}/confirm-final`
                          : `/weaver/requests/${req._id}`
                      }
                      className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-stone-50/80 transition-colors block group"
                    >
                      <div className="space-y-1.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {req.requestId}
                          </span>
                          <Badge status={req.status} size="sm" />
                          {req.status === 'FINAL_CHARGES_PENDING_USER' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                              Approval Needed
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
                          {req.workTypeId?.name ? (req.workTypeId.name[language] || req.workTypeId.name.en) : 'Jacquard Work'}
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
                          ₹{(req.finalAmount || req.quotedAmount || req.estimatedAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {req.finalAmount ? 'Final Total' : 'Estimated/Quote'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Handloom Guidance (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={language === 'ta' ? 'விரைவு வழிகாட்டி' : 'Weaver Workflow Steps'}
              subtitle={language === 'ta' ? 'கோரிக்கை நிலை விளக்கம்' : 'How work requests progress'}
            />
            <CardContent className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                <span className="font-bold text-indigo-950 block">1. Post Request</span>
                <p className="text-[11px] text-slate-500">
                  Select service (Border, Self, Turning, Stand, Box, MBO), enter loom specs, and attach graph designs.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                <span className="font-bold text-indigo-950 block">2. Master Acceptance</span>
                <p className="text-[11px] text-slate-500">
                  Verified Jacquard Master in your district accepts the fixed bill and selects service date.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                <span className="font-bold text-indigo-950 block">3. Final Confirmation</span>
                <p className="text-[11px] text-slate-500">
                  Review itemized Petrol & Viluthu allowances and confirm to schedule on-site work.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1 text-emerald-950">
                <span className="font-bold block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  4. Loom Tuning & Settle
                </span>
                <p className="text-[11px] text-emerald-900">
                  Master tunes the Jacquard box on-site and reports work completion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
