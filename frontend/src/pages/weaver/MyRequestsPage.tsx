import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { workRequestApi } from '../../api/workRequestApi';
import { IWorkRequest } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  PlusCircle,
  Search,
  Layers,
  Calendar,
  MapPin,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const res = await workRequestApi.getWorkRequests(params);
      if (res.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const statusOptions = [
    { key: 'ALL', label: 'All Requests' },
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'QUOTED', label: 'Quoted' },
    { key: 'FINAL_CHARGES_PENDING_USER', label: 'Action Required' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Page Header */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ThariWatermark variant="shuttle-threads" position="top-right" size="sm" opacity={0.035} className="-mr-4 -mt-4 hidden sm:block" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('nav.myRequests', 'My Work Requests')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'ta'
              ? 'உங்கள் அனைத்து தறி வேலை கோரிக்கைகளின் நிலை மற்றும் விலைப்பட்டியல்கள்'
              : 'Track status, inspect quotes, and manage your posted requests'}
          </p>
        </div>

        <Link to="/weaver/requests/new" className="relative z-10">
          <Button size="md" variant="primary" withArrow icon={<PlusCircle className="w-4 h-4" />}>
            <span>{t('weaver.createRequest', 'New Request')}</span>
          </Button>
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-stone-200/90 shadow-craft-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {statusOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === opt.key
                    ? 'bg-indigo-900 text-white shadow-craft-xs'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'தேடுக...' : 'Search requests...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading work requests...</div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="w-6 h-6 text-indigo-900" />}
          title={language === 'ta' ? 'கோரிக்கைகள் எதுவும் கிடைக்கவில்லை' : 'No Work Requests Found'}
          description={language === 'ta' ? 'புதிய ஜாக்கார்ட் பணி கோரிக்கையை சமர்ப்பிக்கவும்.' : 'Submit a new Jacquard work request to get started.'}
          actionLabel={language === 'ta' ? 'புதிய கோரிக்கை உருவாக்கு' : 'Create Work Request'}
          actionHref="/weaver/requests/new"
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req._id} hoverEffect className="border-stone-200/90 shadow-craft-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 overflow-hidden flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                      {req.requestId}
                    </span>
                    <Badge status={req.status} />
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">
                    {req.workTypeId?.name ? (req.workTypeId.name[language] || req.workTypeId.name.en) : 'Jacquard Work'}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-1">{req.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {req.quantity} Loom(s)
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(req.requiredDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.location?.city || 'Salem'}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Estimated / Final
                    </span>
                    <span className="text-base sm:text-lg font-black text-indigo-950 font-mono">
                      ₹{(req.finalAmount || req.quotedAmount || req.estimatedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link to={`/weaver/requests/${req._id}`}>
                    <Button size="sm" variant="outline" withArrow>
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
