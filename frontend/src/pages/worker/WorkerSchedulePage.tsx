import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { jobApi } from '../../api/jobApi';
import { IWorkRequest } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Wrench,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  IndianRupee,
  Navigation
} from 'lucide-react';

export const WorkerSchedulePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<IWorkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSchedule = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await jobApi.getSchedule();
      if (res.success && res.data) {
        const list = res.data.requests || res.data.jobs || [];
        setRequests(list as IWorkRequest[]);
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setErrorMessage(
        err.response?.data?.message ||
          (language === 'ta'
            ? 'அட்டவணையை ஏற்றுவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to load schedule. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const getConfirmedDate = (req: IWorkRequest): string => {
    if (req.finalChargeSnapshot?.selectedDate) {
      return req.finalChargeSnapshot.selectedDate;
    }
    if (req.selectedWorkDate) {
      return req.selectedWorkDate;
    }
    if (req.requiredDate) {
      return new Date(req.requiredDate).toISOString().split('T')[0];
    }
    return '';
  };

  const isToday = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr.startsWith(today);
  };

  const isUpcoming = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr > today;
  };

  const isPastOrCompleted = (req: IWorkRequest): boolean => {
    if (req.status === 'COMPLETED') return true;
    const dateStr = getConfirmedDate(req);
    const today = new Date().toISOString().split('T')[0];
    return Boolean(dateStr && dateStr < today);
  };

  // Filter and Sort: Primary Sort by Confirmed Date Ascending (Nearest upcoming first)
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        const confirmedDate = getConfirmedDate(req);

        // Tab filter
        if (activeTab === 'TODAY' && !isToday(confirmedDate)) return false;
        if (activeTab === 'UPCOMING' && (isToday(confirmedDate) || req.status === 'COMPLETED' || confirmedDate < new Date().toISOString().split('T')[0])) return false;
        if (activeTab === 'COMPLETED' && req.status !== 'COMPLETED') return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const reqIdMatch = req.requestId?.toLowerCase().includes(q);
          const weaverMatch =
            req.weaverId?.name?.toLowerCase().includes(q) ||
            req.weaverId?.businessName?.toLowerCase().includes(q);
          const cityMatch =
            req.location?.city?.toLowerCase().includes(q) ||
            req.location?.district?.toLowerCase().includes(q);
          const serviceMatch =
            req.pricingSnapshot?.serviceNameSnapshot?.en?.toLowerCase().includes(q) ||
            req.pricingSnapshot?.serviceNameSnapshot?.ta?.toLowerCase().includes(q) ||
            req.items?.some((it) => it.serviceName?.en?.toLowerCase().includes(q));

          return reqIdMatch || weaverMatch || cityMatch || serviceMatch;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = getConfirmedDate(a);
        const dateB = getConfirmedDate(b);
        if (dateA && dateB) {
          return dateA.localeCompare(dateB);
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [requests, activeTab, searchQuery]);

  const getServiceDisplayName = (req: IWorkRequest): string => {
    if (req.pricingSnapshot?.serviceNameSnapshot) {
      return (
        req.pricingSnapshot.serviceNameSnapshot[language] ||
        req.pricingSnapshot.serviceNameSnapshot.en
      );
    }
    if (req.items && req.items.length > 0) {
      return req.items[0].serviceName[language] || req.items[0].serviceName.en;
    }
    if (req.workTypeId?.name) {
      return req.workTypeId.name[language] || req.workTypeId.name.en;
    }
    return language === 'ta' ? 'ஜாக்கார்ட் தறி சேவை' : 'Jacquard Loom Service';
  };

  return (
    <div className="relative space-y-6 max-w-5xl mx-auto pb-16">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.04]" />

      <PageHeader
        badge={language === 'ta' ? 'பணி அட்டவணை • TIMETABLE' : 'TIMETABLE • CONFIRMED SCHEDULE'}
        title={language === 'ta' ? 'என் தறி பணி அட்டவணை' : 'My Confirmed Loom Schedule'}
        subtitle={
          language === 'ta'
            ? 'நெசவாளரால் உறுதிசெய்யப்பட்ட பணிகள், தேர்வு செய்யப்பட்ட பணி தேதி மற்றும் பயணக் கட்டண விவரங்கள்'
            : 'Confirmed handloom workshop visits and booked dates after user final acceptance (Zero Bidding)'
        }
      />

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-craft-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'ALL', labelEn: 'All Scheduled', labelTa: 'அனைத்து பணிகள்' },
            { key: 'TODAY', labelEn: 'Today', labelTa: 'இன்று' },
            { key: 'UPCOMING', labelEn: 'Upcoming', labelTa: 'வரவிருப்பவை' },
            { key: 'COMPLETED', labelEn: 'Completed', labelTa: 'முடிந்தவை' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-indigo-900 text-white shadow-craft-xs'
                  : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? tab.labelTa : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ta' ? 'கோரிக்கை எண் / நெசவாளர் / ஊர் தேடுக...' : 'Search ID, Weaver, District...'
            }
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-700 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Schedule Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-stone-200 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-700" />
            <span>{language === 'ta' ? 'அட்டவணை ஏற்றப்படுகிறது...' : 'Loading confirmed schedule...'}</span>
          </div>
        ) : errorMessage ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex flex-col items-center text-center gap-3 shadow-craft-xs">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="font-bold">{errorMessage}</span>
            <Button size="sm" variant="outline" onClick={fetchSchedule} className="mt-1">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span>{language === 'ta' ? 'மீண்டும் முயல்க' : 'Retry'}</span>
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            variant="loom"
            title={language === 'ta' ? 'திட்டமிடப்பட்ட பணிகள் எதுவும் இல்லை' : 'No scheduled work yet'}
            description={
              language === 'ta'
                ? 'நெசவாளர் இறுதி கோரிக்கை மற்றும் கட்டணத்தை உறுதிசெய்த பிறகு திட்டமிடப்பட்ட பணிகள் இங்கு தோன்றும்.'
                : 'Jobs will appear here after the user accepts the final request and charges.'
            }
            actionLabel={language === 'ta' ? 'கிடைக்கும் கோரிக்கைகளை பார்க்க' : 'Browse Available Requests'}
            actionLink="/worker/available"
          />
        ) : (
          filteredRequests.map((req) => {
            const confirmedDate = getConfirmedDate(req);
            const isVisitToday = isToday(confirmedDate);
            const baseServiceAmount = req.finalChargeSnapshot?.baseServiceAmount || req.pricingSnapshot?.totalAmount || req.estimatedAmount || 0;
            const petrol = req.finalChargeSnapshot?.petrolAllowance || 0;
            const viluthu = req.finalChargeSnapshot?.viluthuCharge || 0;
            const finalTotal = req.finalAmount || req.finalChargeSnapshot?.finalAmount || (baseServiceAmount + petrol + viluthu);

            return (
              <Card
                key={req._id}
                hoverEffect
                className={`border transition-all ${
                  isVisitToday
                    ? 'border-indigo-600 ring-2 ring-indigo-600/15 bg-white'
                    : 'border-stone-200/90 bg-white'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Meta Header: ID + Badges + Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-stone-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/80">
                        {req.requestId}
                      </span>
                      <Badge status={req.status} size="sm" />
                      
                      {/* Final Charges Accepted Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'ta' ? 'இறுதி கட்டணம் ஏற்கப்பட்டது' : 'Final Charges Accepted'}</span>
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          req.paymentStatus === 'PAID'
                            ? 'bg-emerald-100/70 text-emerald-900 border-emerald-300'
                            : 'bg-amber-100/70 text-amber-900 border-amber-300'
                        }`}
                      >
                        {req.paymentStatus === 'PAID'
                          ? language === 'ta'
                            ? 'கட்டணம் செலுத்தப்பட்டது'
                            : 'Paid'
                          : language === 'ta'
                          ? 'கட்டணம் நிலுவை'
                          : 'Payment Pending'}
                      </span>
                    </div>

                    {/* Confirmed Scheduled Date Highlight */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-950 text-xs font-black shadow-2xs">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-700" />
                      <span>
                        {language === 'ta' ? 'உறுதிசெய்த தேதி: ' : 'Scheduled Date: '}
                        {confirmedDate
                          ? new Date(confirmedDate).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Date Pending'}
                      </span>
                      {isVisitToday && (
                        <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded text-[10px] font-extrabold uppercase animate-pulse">
                          {language === 'ta' ? 'இன்று' : 'Today'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Grid: Details (Left) + Financial Breakdown & Action (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Customer Info, Location, and Service Line Items */}
                    <div className="lg:col-span-8 space-y-3.5">
                      <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{getServiceDisplayName(req)}</span>
                        </h3>
                        {req.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {req.description}
                          </p>
                        )}
                      </div>

                      {/* Customer & Location Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-stone-50/80 border border-stone-200/70 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-700" />
                            <span>{req.weaverId?.name || 'Weaver / Loom Owner'}</span>
                          </div>
                          {req.weaverId?.businessName && (
                            <p className="text-[11px] text-slate-500 pl-3.5">
                              {req.weaverId.businessName}
                            </p>
                          )}
                          {req.weaverId?.phone && (
                            <div className="pl-3.5 pt-0.5">
                              <a
                                href={`tel:${req.weaverId.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 hover:text-indigo-950 underline"
                              >
                                <Phone className="w-3 h-3 text-indigo-700" />
                                <span>{req.weaverId.phone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">
                              {req.location?.city || req.weaverId?.location?.city}, {req.location?.district || req.weaverId?.location?.district}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5 line-clamp-2">
                            {req.location?.address || req.weaverId?.location?.address} (PIN: {req.location?.pincode || req.weaverId?.location?.pincode})
                          </p>
                        </div>
                      </div>

                      {/* Line Items Details (Multi-Service breakdown) */}
                      {req.items && req.items.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            {language === 'ta' ? 'சேவை விவரங்கள் (Service Breakdown):' : 'Service Breakdown:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {req.items.map((item, itIdx) => (
                              <div
                                key={itIdx}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-slate-800 font-medium flex items-center gap-1.5"
                              >
                                <span className="font-bold text-indigo-950">{item.serviceName?.en || 'Service'}:</span>
                                <span>{item.optionName?.en}</span>
                                <span className="text-slate-500 font-mono">
                                  ({item.inputValue} {item.unit} @ ₹{item.rate}) = ₹{item.subtotal}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Confirmed Financial Breakdown Box & Action */}
                    <div className="lg:col-span-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                      <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block border-b border-amber-200/60 pb-1.5">
                        {language === 'ta' ? 'உறுதி செய்யப்பட்ட கட்டணம்' : 'Confirmed Financial Breakdown'}
                      </span>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-amber-700" />
                            <span>{language === 'ta' ? 'அடிப்படை சேவை கட்டணம்' : 'Service Charge'}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">₹{baseServiceAmount}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-amber-700" />
                            <span>{language === 'ta' ? 'பெட்ரோல் படி (Petrol)' : 'Petrol Allowance'}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">+ ₹{petrol}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-amber-700" />
                            <span>{language === 'ta' ? 'விழுது கட்டணம் (Viluthu)' : 'Viluthu Charge'}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">+ ₹{viluthu}</span>
                        </div>

                        <div className="border-t border-amber-200/90 pt-2 flex items-center justify-between font-black text-amber-950 text-sm">
                          <span>{language === 'ta' ? 'மொத்த இறுதி தொகை' : 'Final Amount'}</span>
                          <span className="text-base font-mono text-amber-900">₹{finalTotal}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link to={`/worker/requests/${req._id}`} className="block">
                          <Button size="sm" variant="primary" className="w-full text-xs font-bold shadow-craft-xs" withArrow>
                            <span>{language === 'ta' ? 'விவரங்கள் & வரைபடம் காண்க' : 'View Details & Map'}</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

