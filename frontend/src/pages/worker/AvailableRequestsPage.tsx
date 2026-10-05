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
  Layers,
  Calendar,
  MapPin,
  FileSpreadsheet,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const AvailableRequestsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvailable = async () => {
    setIsLoading(true);
    try {
      const res = await workRequestApi.getWorkRequests({ scope: 'available' });
      if (res.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Error fetching available requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Page Header */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ThariWatermark variant="jacquard-harness" position="top-right" size="sm" opacity={0.035} className="-mr-4 -mt-4 hidden sm:block" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-black shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'ta' ? 'திறந்த வேலைகள்' : 'Open Cluster Requests'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {t('nav.availableRequests', 'Available Work Requests')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'ta'
              ? 'உங்கள் மாவட்டத்தில் உள்ள நெசவாளர்களிடமிருந்து புதிய தறி வேலை கோரிக்கைகள்'
              : 'New loom work requests from weavers in your active district'}
          </p>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading open requests in your cluster...</div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-amber-800" />}
          title={language === 'ta' ? 'தற்போது புதிய கோரிக்கைகள் இல்லை' : 'No Open Requests in Cluster'}
          description={language === 'ta' ? 'உங்கள் மாவட்டத்தில் புதிய கோரிக்கைகள் பதிவு செய்யப்படும்போது இங்கே தோன்றும்.' : 'When weavers in your district post new requests, they will appear here.'}
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
                      {req.location?.city || 'Salem'} ({req.location?.district})
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Admin Base Rate
                    </span>
                    <span className="text-base sm:text-lg font-black text-indigo-950 font-mono">
                      ₹{(req.estimatedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link to={`/worker/requests/${req._id}`}>
                    <Button size="sm" variant="primary" withArrow>
                      Accept & Review
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
