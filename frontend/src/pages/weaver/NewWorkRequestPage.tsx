import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { serviceApi } from '../../api/serviceApi';
import { workRequestApi } from '../../api/workRequestApi';
import { IService, IServiceOptionRule, ServiceCategory } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LocationMapPicker, LocationData } from '../../components/ui/LocationMapPicker';
import { DesignFileUploader } from '../../components/ui/DesignFileUploader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Layers,
  Plus,
  Trash2,
  Lock,
  Calculator,
  ShieldAlert,
  Calendar,
  Sparkles,
  Box,
  Wrench,
  RotateCw,
  Grid,
  Check,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';

const CATEGORIES: { key: ServiceCategory | 'ALL'; labelEn: string; labelTa: string }[] = [
  { key: 'ALL', labelEn: 'All Services', labelTa: 'அனைத்து சேவைகள்' },
  { key: 'BORDER', labelEn: 'Border', labelTa: 'பார்டர்' },
  { key: 'SELF', labelEn: 'Self', labelTa: 'செல்ப்' },
  { key: 'TURNING', labelEn: 'Turning', labelTa: 'டர்னிங்' },
  { key: 'STAND', labelEn: 'Stand Fitting', labelTa: 'ஸ்டாண்ட் பொருத்துதல்' },
  { key: 'BOX', labelEn: 'Box Fitting', labelTa: 'பாக்ஸ் பொருத்துதல்' },
  { key: 'EMBOSS', labelEn: 'MBO Service', labelTa: 'MBO சேவை' }
];

export interface SelectedServiceItem {
  id: string; // unique client-side key
  serviceId: string;
  service: IService;
  optionKey: string;
  optionRule?: IServiceOptionRule;
  inputValue: number; // e.g. monai, inches, sets, 1 for fixed
  subtotal: number;
}

export const NewWorkRequestPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [services, setServices] = useState<IService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'ALL'>('ALL');

  // Multi-item bill line items
  const [selectedItems, setSelectedItems] = useState<SelectedServiceItem[]>([]);

  // Active selector state for adding a line item
  const [activeServiceId, setActiveServiceId] = useState<string>('');
  const [activeOptionKey, setActiveOptionKey] = useState<string>('');
  const [activeInputValue, setActiveInputValue] = useState<number>(1);

  // Preferred Dates (Two dates, No timing)
  const getInitialDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [preferredDate1, setPreferredDate1] = useState<string>(() => getInitialDate(2));
  const [preferredDate2, setPreferredDate2] = useState<string>(() => getInitialDate(4));

  // Common request fields
  const [description, setDescription] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [designFiles, setDesignFiles] = useState<File[]>([]);

  const [location, setLocation] = useState<LocationData>({
    address: user?.location?.address || '',
    landmark: user?.location?.landmark || '',
    city: user?.location?.city || '',
    district: user?.location?.district || '',
    pincode: user?.location?.pincode || '',
    state: 'Tamil Nadu',
    lat: user?.location?.lat || 11.6643,
    lng: user?.location?.lng || 78.146
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch active Jacquard services strictly from Admin Configuration
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getAllServices();
        if (res.success && res.data && res.data.length > 0) {
          const validServices = res.data.filter((s) => s.category !== ('M_POST' as any));
          setServices(validServices);
          if (validServices.length > 0) {
            const first = validServices[0];
            setActiveServiceId(first._id);
            if (first.options && first.options.length > 0) {
              setActiveOptionKey(first.options[0].optionKey);
              setDefaultInputValueForOption(first.options[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching services from Admin config:', err);
      }
    };
    fetchServices();
  }, []);

  const activeService = services.find((s) => s._id === activeServiceId);
  const activeOption = activeService?.options?.find((o) => o.optionKey === activeOptionKey) || activeService?.options?.[0];

  const setDefaultInputValueForOption = (opt?: IServiceOptionRule) => {
    if (!opt) return;
    if (opt.pricingModel === 'PER_MONAI') {
      setActiveInputValue(12);
    } else if (opt.pricingModel === 'PER_INCH') {
      setActiveInputValue(8);
    } else if (opt.pricingModel === 'PER_SET') {
      setActiveInputValue(2);
    } else {
      setActiveInputValue(1);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setActiveServiceId(serviceId);
    const svc = services.find((s) => s._id === serviceId);
    if (svc && svc.options && svc.options.length > 0) {
      const firstOpt = svc.options[0];
      setActiveOptionKey(firstOpt.optionKey);
      setDefaultInputValueForOption(firstOpt);
    }
  };

  const handleOptionChange = (optionKey: string) => {
    setActiveOptionKey(optionKey);
    const opt = activeService?.options?.find((o) => o.optionKey === optionKey);
    if (opt) {
      setDefaultInputValueForOption(opt);
    }
  };

  const calculateCurrentSubtotal = (): number => {
    if (!activeOption) return 0;
    const rate = activeOption.rate || 0;
    const val = Math.max(0, activeInputValue || 0);

    if (activeOption.pricingModel === 'FIXED_AMOUNT') {
      return rate;
    }
    return Math.round(rate * val * 100) / 100;
  };

  const handleAddItem = () => {
    if (!activeService || !activeOption) return;

    const subtotal = calculateCurrentSubtotal();
    const newItem: SelectedServiceItem = {
      id: `${activeService._id}_${activeOption.optionKey}_${Date.now()}`,
      serviceId: activeService._id,
      service: activeService,
      optionKey: activeOption.optionKey,
      optionRule: activeOption,
      inputValue: activeOption.pricingModel === 'FIXED_AMOUNT' ? 1 : activeInputValue,
      subtotal
    };

    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalBillAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const effectiveItems = selectedItems.length > 0
    ? selectedItems
    : (activeService && activeOption ? [
        {
          id: 'initial_auto',
          serviceId: activeService._id,
          service: activeService,
          optionKey: activeOption.optionKey,
          optionRule: activeOption,
          inputValue: activeOption.pricingModel === 'FIXED_AMOUNT' ? 1 : activeInputValue,
          subtotal: calculateCurrentSubtotal()
        }
      ] : []);

  const finalTotalAmount = selectedItems.length > 0 ? totalBillAmount : calculateCurrentSubtotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (effectiveItems.length === 0) {
      setErrorMessage(
        language === 'ta'
          ? 'தயவுசெய்து குறைந்தது ஒரு ஜாக்கார்ட் சேவையை சேர்க்கவும்.'
          : 'Please add at least one Jacquard service item to the work request.'
      );
      return;
    }

    if (!preferredDate1) {
      setErrorMessage(
        language === 'ta'
          ? 'முதல் விருப்ப பணியின் தேதியை தேர்வு செய்யவும்.'
          : 'Please select your first preferred work date.'
      );
      return;
    }

    if (preferredDate2 && preferredDate1 === preferredDate2) {
      setErrorMessage(
        language === 'ta'
          ? 'இரண்டாம் விருப்ப தேதி முதல் தேதியிலிருந்து மாறுபட்டதாக இருக்க வேண்டும்.'
          : 'Second preferred date must be distinct from first preferred date.'
      );
      return;
    }

    if (!location.address || !location.city || !location.district) {
      setErrorMessage(
        language === 'ta'
          ? 'முழு தறி பட்டறை முகவரி மற்றும் மாவட்ட விவரங்களை வழங்கவும்.'
          : 'Please provide complete loom workshop address and district details.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const itemsPayload = effectiveItems.map((it) => ({
        serviceId: it.serviceId,
        optionKey: it.optionKey,
        inputValue: it.inputValue
      }));

      const formData = new FormData();
      formData.append('items', JSON.stringify(itemsPayload));
      formData.append('quantity', '1');
      formData.append('description', description);
      if (additionalRequirements) {
        formData.append('additionalRequirements', additionalRequirements);
      }
      formData.append('preferredDate1', preferredDate1);
      if (preferredDate2) {
        formData.append('preferredDate2', preferredDate2);
      }
      formData.append('requiredDate', preferredDate1);
      formData.append('location', JSON.stringify(location));

      designFiles.forEach((file) => {
        formData.append('designFiles', file);
      });

      const res = await workRequestApi.createWorkRequest(formData);
      if (res.success && res.data?.workRequest) {
        navigate(`/weaver/requests/submitted/${res.data.workRequest._id}`, {
          state: { workRequest: res.data.workRequest }
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          (language === 'ta'
            ? 'வேலை கோரிக்கையை சமர்ப்பிக்க முடியவில்லை. விவரங்களை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
            : 'We could not submit your work request. Please check details and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'EMBOSS') return s.category === 'EMBOSS';
    return s.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BORDER':
        return <Sparkles className="w-4 h-4 text-purple-700" />;
      case 'SELF':
        return <Grid className="w-4 h-4 text-emerald-700" />;
      case 'TURNING':
        return <RotateCw className="w-4 h-4 text-blue-700" />;
      case 'STAND':
        return <Wrench className="w-4 h-4 text-amber-700" />;
      case 'BOX':
        return <Box className="w-4 h-4 text-rose-700" />;
      case 'EMBOSS':
        return <Layers className="w-4 h-4 text-indigo-700" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-700" />;
    }
  };

  const getDisplayServiceName = (svc: IService) => {
    if (svc.category === 'SELF') {
      return language === 'ta' ? 'செல்ப்' : 'Self';
    }
    return svc.name[language] || svc.name.en;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 relative">
      {/* Header with subtle Loom Watermark */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden">
        <ThariWatermark
          variant="shuttle-threads"
          position="top-right"
          size="md"
          opacity={0.045}
          className="-mr-6 -mt-6 hidden sm:block"
        />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'ta' ? 'நிர்வாக நிர்ணயிக்கப்பட்ட விலை விதிகள்' : 'Admin Controlled Pricing (Zero Bidding)'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'ஜாக்கார்ட் பணி கோரிக்கை உருவாக்கம்' : 'New Jacquard Work Request'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'ta'
              ? 'நிர்வாகியால் நிர்ணயிக்கப்பட்ட விலை விதிகளின் அடிப்படையில் தேவையான சேவையை தேர்வு செய்து பதிவு செய்யவும்.'
              : 'Select Jacquard services with Admin-controlled pricing rules and specify your preferred work dates.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-700 flex items-start gap-3 shadow-craft-xs animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Progressive Service & Measurement Selection Card */}
        <Card className="border-stone-200/90 shadow-craft-xs">
          <CardHeader
            title={language === 'ta' ? '1. ஜாக்கார்ட் சேவை & அளவீடு தேர்வு' : '1. Jacquard Services & Measurement'}
            subtitle={
              language === 'ta'
                ? 'சேவை தேர்வு → துணை வகை → சேவைக்குரிய அளவீடு → தானியங்கி கட்டணம்'
                : 'Service Selection → Sub-Type → Service-Specific Measurement → Live Bill'
            }
          />
          <CardContent className="space-y-5">
            {/* Category Filter Tabs */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                {language === 'ta' ? 'பிரிவு வாரியாக வடிகட்டு' : 'Filter Category'}
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.key
                        ? 'bg-indigo-900 text-white shadow-craft-xs'
                        : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ta' ? cat.labelTa : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Service Selection Cards */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                {language === 'ta' ? 'கிடைக்கும் ஜாக்கார்ட் சேவைகள் (Select Service) *' : 'Available Jacquard Services *'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredServices.map((svc) => {
                  const isSelected = svc._id === activeServiceId;
                  const defaultOpt = svc.options?.[0];
                  return (
                    <button
                      key={svc._id}
                      type="button"
                      onClick={() => handleServiceChange(svc._id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                        isSelected
                          ? 'border-indigo-900 bg-indigo-50/70 shadow-craft-xs ring-2 ring-indigo-900/10'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <div className="p-2 rounded-xl bg-white border border-stone-100 shadow-2xs">
                          {getCategoryIcon(svc.category)}
                        </div>
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-indigo-900 text-white shadow-2xs">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="text-stone-300 group-hover:text-stone-400 group-hover:translate-x-0.5 transition-all text-xs">
                            →
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1">
                          {getDisplayServiceName(svc)}
                        </div>
                        <div className="text-[11px] font-bold text-indigo-950 font-mono mt-0.5">
                          {defaultOpt
                            ? defaultOpt.pricingModel === 'FIXED_AMOUNT'
                              ? `₹${defaultOpt.rate} Flat`
                              : `₹${defaultOpt.rate}/${defaultOpt.unit}`
                            : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service & Option Configuration Box */}
            {activeService && (
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      {getCategoryIcon(activeService.category)}
                      <span>{getDisplayServiceName(activeService)}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeService.description?.[language] || activeService.description?.en}
                    </p>
                  </div>
                </div>

                {/* Sub-type / Set Type Selection */}
                {activeService.options && activeService.options.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      {activeService.category === 'SELF'
                        ? language === 'ta'
                          ? 'செட் வகை தேர்வு செய்க (Select Set Type) *'
                          : 'Select Set Type (120 Kambi / 240 Kambi) *'
                        : language === 'ta'
                        ? 'சேவை துணை வகை (Service Option / Sub-Type) *'
                        : 'Service Sub-Type / Option *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeService.options.map((opt) => {
                        const isSelected = opt.optionKey === activeOptionKey;
                        return (
                          <button
                            key={opt.optionKey}
                            type="button"
                            onClick={() => handleOptionChange(opt.optionKey)}
                            className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-indigo-900 bg-white ring-2 ring-indigo-900/10 shadow-craft-xs'
                                : 'border-stone-200 bg-white/80 hover:bg-white'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">
                                {opt.name[language] || opt.name.en}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {opt.pricingModel === 'FIXED_AMOUNT'
                                  ? language === 'ta'
                                    ? 'நிலையான கட்டணம்'
                                    : 'Fixed Flat Rate'
                                  : `${language === 'ta' ? 'அலகு' : 'Unit'}: ${opt.unit}`}
                              </span>
                            </div>
                            <span className="font-mono font-black text-xs text-indigo-950 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                              {opt.pricingModel === 'FIXED_AMOUNT' ? `₹${opt.rate}` : `₹${opt.rate}/${opt.unit}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Service-Specific Measurement Input Row */}
                {activeOption && (
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Dynamic Service-Specific Input */}
                      <div className="flex-1">
                        {activeOption.pricingModel === 'FIXED_AMOUNT' ? (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              {language === 'ta'
                                ? `நிலையான கட்டணம்: ₹${activeOption.rate} (அளவீட்டு உள்ளீடு தேவையில்லை)`
                                : `Fixed Amount: ₹${activeOption.rate} (No measurement input required)`}
                            </span>
                            <p className="text-[11px] text-indigo-800">
                              {language === 'ta'
                                ? `இந்த சேவை நிர்வாகியால் நிர்ணயிக்கப்பட்ட தறிக்கு ₹${activeOption.rate} என்ற நிலையான கட்டணத்தில் கணக்கிடப்படுகிறது.`
                                : `Billed at the Admin-configured flat amount of ₹${activeOption.rate} per loom setup.`}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-indigo-950">
                              {activeOption.pricingModel === 'PER_MONAI' && (
                                <span className="flex items-center gap-1.5">
                                  <span>{language === 'ta' ? 'முனை எண்ணிக்கை (Number of Monai) *' : 'Number of Monai *'}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                    Border Exclusive Unit
                                  </span>
                                </span>
                              )}

                              {activeOption.pricingModel === 'PER_SET' && (
                                <span className="flex items-center gap-1.5">
                                  <span>{language === 'ta' ? 'செட் எண்ணிக்கை (Number of Sets) *' : 'Number of Sets *'}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                                    {activeService.category === 'SELF' ? 'Kambi Set Pricing' : 'Set Pricing'}
                                  </span>
                                </span>
                              )}

                              {activeOption.pricingModel === 'PER_INCH' && (
                                <span className="flex items-center gap-1.5">
                                  <span>
                                    {language === 'ta' ? 'டர்னிங் அகலம் - இன்ச் (Turning Width in Inches) *' : 'Turning Width in Inches *'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                                    Inch Measurement
                                  </span>
                                </span>
                              )}
                            </label>

                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={1}
                                required
                                value={activeInputValue}
                                onChange={(e) => setActiveInputValue(Math.max(1, Number(e.target.value)))}
                                className="w-28 rounded-xl border border-indigo-300 py-2 px-3 text-sm font-black text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-600/20 shadow-2xs"
                              />
                              <div className="text-xs text-indigo-900 font-bold font-mono">
                                <span>
                                  {activeInputValue} {activeOption.unit} × ₹{activeOption.rate}/{activeOption.unit}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-indigo-700">
                              {activeOption.pricingModel === 'PER_MONAI' &&
                                (language === 'ta'
                                  ? 'குறிப்பு: முனை (Monai) கணக்கீடு பார்டர் வேலைக்கு மட்டுமே பொருந்தும்.'
                                  : 'Note: Monai measurement applies exclusively to Border services.')}
                              {activeOption.pricingModel === 'PER_SET' &&
                                (language === 'ta'
                                  ? 'குறிப்பு: செட் கணக்கீடு செல்ப் / MBO வேலைக்கு பொருந்தும் (இன்ச் அல்லது முனை அல்ல).'
                                  : 'Note: Set-based pricing applies for Self & MBO services (Never Monai or Inches).')}
                              {activeOption.pricingModel === 'PER_INCH' &&
                                (language === 'ta'
                                  ? 'குறிப்பு: டர்னிங் வேலை இன்ச் அகல கணக்கீட்டின்படி நிர்ணயிக்கப்படுகிறது.'
                                  : 'Note: Turning service is priced per inch of turning width (Never Monai or Sets).')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Subtotal & Add Button */}
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            {language === 'ta' ? 'துணைத் தொகை' : 'Subtotal'}
                          </span>
                          <span className="text-xl font-black text-indigo-950 font-mono">
                            ₹{calculateCurrentSubtotal().toLocaleString('en-IN')}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleAddItem}
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                        >
                          <span>{language === 'ta' ? 'பட்டியலில் சேர்க்க' : 'Add to Bill'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Multi-Service Line Items Table */}
            {selectedItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  {language === 'ta'
                    ? `சேர்க்கப்பட்ட சேவைகள் பட்டியல் (${selectedItems.length})`
                    : `Selected Line Items in Work Request (${selectedItems.length})`}
                </h4>

                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white shadow-craft-xs">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-slate-400 font-mono">{idx + 1}.</span>
                          <span>{getDisplayServiceName(item.service)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-900 font-semibold">
                            {item.optionRule?.name[language] || item.optionRule?.name.en}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] pl-4 font-mono">
                          {item.optionRule?.pricingModel === 'FIXED_AMOUNT' ? (
                            <span>Fixed Amount @ ₹{item.optionRule?.rate}</span>
                          ) : (
                            <span>
                              {item.inputValue} {item.optionRule?.unit} × ₹{item.optionRule?.rate}/
                              {item.optionRule?.unit} = ₹{item.subtotal}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm text-slate-900 font-mono">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Preferred Work Dates (Two Dates, No Timing) */}
        <Card className="border-stone-200/90 shadow-craft-xs">
          <CardHeader
            title={language === 'ta' ? '2. விருப்ப வேலை தேதிகள் (Preferred Work Dates)' : '2. Preferred Work Dates'}
            subtitle={
              language === 'ta'
                ? 'பணி தொடங்க இரண்டு விருப்ப தேதிகளை குறிப்பிடவும் (நேர தேர்வு இல்லை)'
                : 'Provide your primary and alternate preferred start dates (No timing slot required)'
            }
          />
          <CardContent className="space-y-4">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {language === 'ta'
                  ? 'விளக்கம்: "நான் முதல் தேதியை விரும்புகிறேன். அந்த தேதியில் இயலாவிட்டால், எனது இரண்டாம் விருப்ப தேதியை விரும்புகிறேன்."'
                  : 'Preference logic: "I prefer the 1st date. If that date is not possible, I prefer my 2nd date."'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>{language === 'ta' ? 'முதல் விருப்ப தேதி (1st Preferred Date) *' : '1st Preferred Date (First Preference) *'}</span>
                  <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Primary
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={preferredDate1}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate1(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>{language === 'ta' ? 'இரண்டாம் விருப்ப தேதி (2nd Preferred Date)' : '2nd Preferred Date (Second Preference)'}</span>
                  <span className="text-[10px] font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    Alternate (Optional)
                  </span>
                </label>
                <input
                  type="date"
                  value={preferredDate2}
                  min={preferredDate1 || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate2(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>{language === 'ta' ? 'வேலை தேவை பற்றிய விரிவான குறிப்புகள்' : 'Detailed Work Note'}</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {language === 'ta' ? 'விருப்பமானது' : 'Optional'}
                </span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  language === 'ta'
                    ? 'வேலை பற்றிய கூடுதல் விவரங்கள் அல்லது வழிமுறைகளை உள்ளிடவும் (விருப்பமானது)...'
                    : 'Enter any additional information or instructions about your work (Optional)...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Design Graph Files Upload */}
        <Card className="border-stone-200/90 shadow-craft-xs">
          <CardHeader
            title={language === 'ta' ? '3. டிசைன் வரைபடங்கள் / கார்டு கிராப் பதிவேற்றம்' : '3. Design Graph / Pattern Upload'}
            subtitle={t('weaver.designUpload', 'Upload punch graph files or pattern references (JPG, PNG, PDF)')}
          />
          <CardContent>
            <DesignFileUploader files={designFiles} onChange={setDesignFiles} />
          </CardContent>
        </Card>

        {/* Step 4: Loom / Workshop Location */}
        <Card className="border-stone-200/90 shadow-craft-xs">
          <CardHeader
            title={language === 'ta' ? '4. தறி பட்டறை இருப்பிடம் (Loom Workshop Location)' : '4. Loom Workshop Location'}
            subtitle={
              language === 'ta'
                ? 'நிர்வாகியால் அங்கீகரிக்கப்பட்ட மாவட்டங்களிலிருந்து பட்டறை இடத்தை தேர்வு செய்யவும்'
                : 'District is populated dynamically from Admin Active Districts'
            }
          />
          <CardContent>
            <LocationMapPicker value={location} onChange={setLocation} />
          </CardContent>
        </Card>

        {/* Step 5: Clean, Light Deterministic Work Summary Calculation UI */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-craft space-y-5 relative overflow-hidden">
          <ThariWatermark variant="craft-seal" position="bottom-right" size="md" opacity={0.04} className="-mr-4 -mt-4" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-2xs">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 tracking-tight">
                  {language === 'ta' ? 'கட்டண சுருக்கம் (நிர்வாக விலை)' : 'Work Summary & Calculation'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta' ? 'நிர்வாக விலை விதிகளின் அடிப்படையில் தானியங்கி கணக்கீடு' : 'Deterministic calculation from Admin pricing rules'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin Controlled (Zero Bidding)</span>
            </span>
          </div>

          <div className="space-y-4 relative z-10">
            {/* Itemized list */}
            <div className="space-y-2 divide-y divide-stone-100 text-xs">
              {effectiveItems.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between text-slate-700">
                  <span className="font-medium">
                    {getDisplayServiceName(item.service)} —{' '}
                    <span className="text-slate-900 font-bold">
                      {item.optionRule?.name[language] || item.optionRule?.name.en}
                    </span>{' '}
                    <span className="text-slate-500">
                      ({item.optionRule?.pricingModel === 'FIXED_AMOUNT'
                        ? `Fixed ₹${item.optionRule?.rate}`
                        : `${item.inputValue} ${item.optionRule?.unit} × ₹${item.optionRule?.rate}/${item.optionRule?.unit}`})
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="pt-4 border-t-2 border-stone-200 flex items-baseline justify-between bg-stone-50/60 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-extrabold block">
                  {language === 'ta' ? 'அடிப்படை சேவை கட்டணம் (Base Work Amount)' : 'Base Service Amount'}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Locked base snapshot from verified rate cards
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono">
                  ₹{finalTotalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Soft Informational Petrol & Viluthu Note */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900 block">
                  {language === 'ta' ? 'முக்கிய தகவல்:' : 'Important Charge Note:'}
                </span>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {language === 'ta'
                    ? 'மேலே காட்டப்பட்டுள்ள தொகை தறி வேலைக்கான அடிப்படை கட்டணம் ஆகும். ஆசாரி (Jacquard Master) கோரிக்கையை ஏற்றுக்கொண்டவுடன், பயண பெட்ரோல் படி (Petrol Allowance) மற்றும் விழுத்து கட்டணம் (Viluthu Charge) தேவைப்பட்டால் சேர்க்கப்பட்டு உங்கள் ஒப்புதலுக்கு அனுப்பப்படும். நீங்கள் ஒப்புக்கொண்ட பிறகே பணி உறுதி செய்யப்படும்.'
                    : 'Additional Petrol and Viluthu charges may be added after Master confirmation for your final review. The work will only be scheduled after your final approval.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
            <p className="text-[11px] text-slate-500 max-w-md">
              {language === 'ta'
                ? 'இந்த கட்டணம் நிர்வாகியால் நிர்ணயிக்கப்பட்ட விலை விதிகளின் அடிப்படையில் பூட்டப்படுகிறது.'
                : 'This base price is calculated directly from Admin configured rules and locked.'}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/weaver/dashboard')}
                className="w-full sm:w-auto"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                loadingText={language === 'ta' ? 'பதிவு செய்யப்படுகிறது...' : 'Submitting Request...'}
                disabled={finalTotalAmount <= 0}
                className="w-full sm:w-auto"
                withArrow
              >
                <span>{language === 'ta' ? 'கோரிக்கையை பதிவு செய்க' : 'Submit & Lock Request'}</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
