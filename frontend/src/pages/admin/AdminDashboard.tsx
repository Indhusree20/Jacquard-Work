import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../api/adminApi';
import { districtApi } from '../../api/districtApi';
import { IDistrict } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Users,
  Wrench,
  FileSpreadsheet,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  Building2,
  Activity,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [activeDistricts, setActiveDistricts] = useState<IDistrict[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, districtsRes] = await Promise.all([
          adminApi.getStats(),
          districtApi.getActiveDistricts()
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data.stats);
          setRecentActivities(statsRes.data.recentActivities || []);
        }

        if (districtsRes.success && districtsRes.data?.districts) {
          setActiveDistricts(districtsRes.data.districts);
        }
      } catch (err) {
        console.error('Error loading admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {/* Light Clean Admin Command Center Header */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-craft-xs overflow-hidden">
        <ThariWatermark
          variant="jacquard-harness"
          position="top-right"
          size="md"
          opacity={0.035}
          className="-mr-6 -mt-6 hidden sm:block"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-xs font-black shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
              <span>{t('admin.dashboardTitle', 'Handloom Administration & Monitoring')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {language === 'ta' ? 'நிர்வாக கட்டுப்பாட்டு மையம்' : 'Platform Administration Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {t(
                'admin.dashboardSubtitle',
                'Platform analytics, district clusters, work types, and artisan management.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Link to="/admin/districts">
              <Button size="sm" variant="outline" icon={<MapPin className="w-4 h-4 text-indigo-700" />}>
                <span>{language === 'ta' ? 'மாவட்டங்கள்' : 'Manage Districts'}</span>
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button size="sm" variant="primary" withArrow>
                <span>{language === 'ta' ? 'சேவைகள் விலை' : 'Services Catalogue'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              {t('admin.totalWeavers', 'Total Weavers')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{stats?.totalWeavers ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered loom owners</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
              {t('admin.totalWorkers', 'Jacquard Masters')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shadow-2xs">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-mono">{stats?.totalWorkers ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified artisans</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              {t('admin.activeJobs', 'Active Jobs')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-2 font-mono">{stats?.activeJobs ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Live on-site progress</span>
        </Card>

        <Card className="p-5 border-stone-200/85">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              {t('admin.totalCharges', 'Total Charges')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shadow-2xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 font-mono">
            ₹{stats?.totalCollected?.toLocaleString('en-IN') ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Platform transactions</span>
        </Card>
      </div>

      {/* Cluster Overview & Audit Trails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Tamil Nadu Handloom Clusters */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-900" />
                    <span>
                      {language === 'ta'
                        ? 'தமிழ்நாடு கைத்தறி மண்டலங்கள்'
                        : t('admin.districtBreakdown', 'Tamil Nadu Handloom Clusters')}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {activeDistricts.length} {language === 'ta' ? 'செயலில் உள்ளவை' : 'Active'}
                  </span>
                </div>
              }
              subtitle={
                language === 'ta'
                  ? 'நிர்வாகியால் செயல்படுத்தப்பட்ட தற்போதைய அதிகாரப்பூர்வ மாவட்டங்கள்'
                  : 'Currently activated operational clusters configured in District Management'
              }
            />
            <CardContent className="p-0">
              {activeDistricts.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    {language === 'ta'
                      ? 'தற்போது செயலில் உள்ள மாவட்டங்கள் எதுவும் இல்லை.'
                      : 'No districts are currently active. Activate districts in District Management.'}
                  </p>
                  <Link to="/admin/districts">
                    <Button size="xs" variant="outline">
                      {language === 'ta' ? 'மாவட்டங்களை இயக்க செல்க →' : 'Go to District Management →'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 text-xs">
                  <div className="p-3.5 flex items-center justify-between bg-stone-50/60 font-bold text-slate-700">
                    <span>{language === 'ta' ? 'மாவட்டம் / மண்டலம்' : 'District / Active Cluster'}</span>
                    <span>{language === 'ta' ? 'நிலை' : 'Operational Status'}</span>
                  </div>

                  {activeDistricts.map((dist) => (
                    <div
                      key={dist._id}
                      className="p-3.5 flex items-center justify-between hover:bg-stone-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <span className="font-extrabold text-slate-900 block">
                            {dist.name.en} {dist.name.ta ? `(${dist.name.ta})` : ''}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {dist.code} • {dist.state}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active Cluster
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {language === 'ta'
                    ? 'மாவட்ட மாற்றங்கள் உடனடியாக இங்கே பிரதிபலிக்கும்.'
                    : 'Changes in District Management update this list in real time.'}
                </span>
                <Link
                  to="/admin/districts"
                  className="font-bold text-indigo-900 hover:text-amber-800 flex items-center gap-1 transition-colors"
                >
                  <span>{language === 'ta' ? 'அமைப்புகளைத் திருத்து' : 'Edit Clusters'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-stone-200/90 shadow-craft-xs">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-900" />
                  <span>Recent Audit Activity Log</span>
                </div>
              }
              subtitle="Real-time system events"
            />
            <CardContent className="p-0">
              {recentActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No logs recorded.</div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
                  {recentActivities.map((log) => (
                    <div key={log._id} className="p-3.5 text-xs hover:bg-stone-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {log.userName || 'System'} ({log.userRole || 'Admin'}) • {log.entity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
