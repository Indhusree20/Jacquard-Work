import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { serviceApi } from '../../api/serviceApi';
import { IService, IServiceOptionRule, PricingModel, ServiceCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Save,
  X,
  Trash2,
  Sliders,
  DollarSign,
  Tag,
  Calculator,
  Layers
} from 'lucide-react';

const CATEGORIES: { key: ServiceCategory | 'ALL'; labelEn: string; labelTa: string }[] = [
  { key: 'ALL', labelEn: 'All Services', labelTa: 'அனைத்து சேவைகள்' },
  { key: 'BORDER', labelEn: 'Border Work', labelTa: 'பார்டர் வேலை' },
  { key: 'SELF', labelEn: 'Self', labelTa: 'செல்ப்' },
  { key: 'TURNING', labelEn: 'Turning Work', labelTa: 'டர்னிங் வேலை' },
  { key: 'STAND', labelEn: 'Stand Fitting', labelTa: 'ஸ்டாண்ட் பொருத்துதல்' },
  { key: 'BOX', labelEn: 'Box Fitting', labelTa: 'பாக்ஸ் பொருத்துதல்' },
  { key: 'EMBOSS', labelEn: 'MBO Service', labelTa: 'MBO சேவை' },
  { key: 'OTHER', labelEn: 'Other Works', labelTa: 'பிற பணிகள்' }
];

const PRICING_MODELS: { value: PricingModel; labelEn: string; labelTa: string; defaultUnit: string }[] = [
  { value: 'PER_MONAI', labelEn: 'Per Monai (₹ Rate × Monai Count)', labelTa: 'முனை ஒன்றுக்கு (₹ விலை × முனை எண்ணிக்கை)', defaultUnit: 'Monai' },
  { value: 'PER_SET', labelEn: 'Per Set (₹ Rate × Number of Sets)', labelTa: 'செட் ஒன்றுக்கு (₹ விலை × செட் எண்ணிக்கை)', defaultUnit: 'Set' },
  { value: 'PER_INCH', labelEn: 'Per Inch (₹ Rate × Width in Inches)', labelTa: 'இன்ச் ஒன்றுக்கு (₹ விலை × இன்ச் அகலம்)', defaultUnit: 'Inches' },
  { value: 'FIXED_AMOUNT', labelEn: 'Fixed Amount (Fixed Charge per Loom)', labelTa: 'நிலையான கட்டணம் (தறிக்கு நிலையான தொகை)', defaultUnit: 'Loom' }
];

export const AdminServiceCataloguePage: React.FC = () => {
  const { language } = useLanguage();
  const [services, setServices] = useState<IService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: { en: string; ta: string };
    code: string;
    category: ServiceCategory;
    description: { en: string; ta: string };
    active: boolean;
    options: IServiceOptionRule[];
  }>({
    name: { en: '', ta: '' },
    code: '',
    category: 'BORDER',
    description: { en: '', ta: '' },
    active: true,
    options: []
  });

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await serviceApi.getAdminServices();
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (err: any) {
      setErrorMessage('Failed to load service catalogue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingServiceId(null);
    setFormData({
      name: { en: '', ta: '' },
      code: `SVC_${Date.now().toString().slice(-4)}`,
      category: 'BORDER',
      description: { en: '', ta: '' },
      active: true,
      options: [
        {
          optionKey: 'ONE_SIDE',
          name: { en: 'One Side Option', ta: 'ஒற்றை பக்க தேர்வு' },
          pricingModel: 'PER_MONAI',
          unit: 'Monai',
          rate: 6,
          minQuantity: 1,
          active: true,
          isDefault: true
        }
      ]
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (svc: IService) => {
    setEditingServiceId(svc._id);
    setFormData({
      name: { en: svc.name.en, ta: svc.name.ta },
      code: svc.code,
      category: (svc.category as ServiceCategory) || 'BORDER',
      description: { en: svc.description?.en || '', ta: svc.description?.ta || '' },
      active: svc.active,
      options: svc.options && svc.options.length > 0
        ? JSON.parse(JSON.stringify(svc.options))
        : [
            {
              optionKey: 'DEFAULT',
              name: { en: svc.name.en, ta: svc.name.ta },
              pricingModel: 'FIXED_AMOUNT',
              unit: 'Loom',
              rate: svc.pricingConfig?.basePrice !== undefined ? svc.pricingConfig.basePrice : 0,
              active: true,
              isDefault: true
            }
          ]
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (service: IService) => {
    try {
      const res = await serviceApi.toggleServiceStatus(service._id, !service.active);
      if (res.success) {
        setServices((prev) =>
          prev.map((s) => (s._id === service._id ? { ...s, active: !service.active } : s))
        );
      }
    } catch (err: any) {
      setErrorMessage('Failed to update service status.');
    }
  };

  // Option Rules CRUD
  const handleAddOptionRule = () => {
    const newRule: IServiceOptionRule = {
      optionKey: `OPT_${Date.now().toString().slice(-4)}`,
      name: { en: 'New Sub-Type / Option', ta: 'புதிய தேர்வு / துணை வகை' },
      pricingModel: 'PER_MONAI',
      unit: 'Monai',
      rate: 6,
      minQuantity: 1,
      active: true,
      isDefault: formData.options.length === 0
    };
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, newRule]
    }));
  };

  const handleRemoveOptionRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionRuleChange = (index: number, key: keyof IServiceOptionRule, value: any) => {
    setFormData((prev) => {
      const copy = [...prev.options];
      copy[index] = { ...copy[index], [key]: value };

      // Auto set unit based on pricing model
      if (key === 'pricingModel') {
        const found = PRICING_MODELS.find((pm) => pm.value === value);
        if (found) {
          copy[index].unit = found.defaultUnit;
        }
      }

      return { ...prev, options: copy };
    });
  };

  const handleOptionRuleNameChange = (index: number, lang: 'en' | 'ta', val: string) => {
    setFormData((prev) => {
      const copy = [...prev.options];
      copy[index] = {
        ...copy[index],
        name: { ...copy[index].name, [lang]: val }
      };
      return { ...prev, options: copy };
    });
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.options.length === 0) {
      setErrorMessage('Please add at least one option / sub-type pricing rule.');
      return;
    }

    const payload: Partial<IService> = {
      name: formData.name,
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      description: formData.description,
      active: formData.active,
      options: formData.options,
      pricingConfig: {
        basePrice: formData.options[0]?.rate || 0,
        pricingType: 'PER_LOOM',
        optionAddons: [],
        matrixRules: []
      }
    };

    try {
      if (editingServiceId) {
        const res = await serviceApi.updateService(editingServiceId, payload);
        if (res.success) {
          setSuccessMessage(
            language === 'ta'
              ? 'சேவை விலை விதிகள் புதுப்பிக்கப்பட்டன (புதிய பதிப்பு உருவாக்கப்பட்டது).'
              : 'Service & dynamic pricing rules updated (New immutable version locked).'
          );
          setIsModalOpen(false);
          fetchServices();
        }
      } else {
        const res = await serviceApi.createService(payload);
        if (res.success) {
          setSuccessMessage(
            language === 'ta'
              ? 'புதிய ஜாக்கார்ட் சேவை வெற்றிகரமாக உருவாக்கப்பட்டது.'
              : 'New Jacquard service created successfully.'
          );
          setIsModalOpen(false);
          fetchServices();
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to save service. Please check fields and try again.'
      );
    }
  };

  const filteredServices = services.filter((s) =>
    selectedCategory === 'ALL' ? true : s.category === selectedCategory
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-bold shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-indigo-700" />
            <span>{language === 'ta' ? 'நிர்வாக விலை கட்டுப்பாடு' : 'Admin Dynamic Pricing Control'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'ஜாக்கார்ட் சேவை விலை விதிகள்' : 'Jacquard Service Pricing Rules'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'ta'
              ? 'முனை (Monai), செட் (Set), இன்ச் (Inch) மற்றும் நிலையான கட்டண விதிகளை நிர்வகிக்கவும்.'
              : 'Admin-controlled pricing rules for Monai, Set, Inch, and Fixed Jacquard services (Zero Bidding).'}
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="md"
          variant="primary"
          withArrow
          icon={<Plus className="w-4 h-4" />}
          className="relative z-10"
        >
          <span>{language === 'ta' ? 'புதிய சேவை சேர்க்க' : 'Add New Service'}</span>
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-700 flex items-center gap-3 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-indigo-900 text-white shadow-craft-xs'
                : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
            }`}
          >
            {language === 'ta' ? cat.labelTa : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map((svc) => (
          <div
            key={svc._id}
            className={`bg-white rounded-2xl border-2 transition-all p-5 flex flex-col justify-between shadow-xs ${
              svc.active ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              {/* Category & Status Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-100">
                    {svc.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    v{svc.version || 1}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(svc)}
                  className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                    svc.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  {svc.active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      Disabled
                    </>
                  )}
                </button>
              </div>

              {/* Service Titles */}
              <div className="mt-3 space-y-1">
                <h3 className="font-extrabold text-base text-slate-900">
                  {svc.name[language] || svc.name.en}
                </h3>
                {svc.name.ta && (
                  <p className="text-xs font-semibold text-slate-600">{svc.name.ta}</p>
                )}
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {svc.description?.[language] || svc.description?.en}
                </p>
              </div>

              {/* Dynamic Option Rules List */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Configured Option Rules ({svc.options?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {svc.options?.map((opt, i) => (
                    <div
                      key={i}
                      className="text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {opt.name[language] || opt.name.en}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Model: {opt.pricingModel} ({opt.unit})
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        ₹{opt.rate} / {opt.unit}
                      </span>
                    </div>
                  ))}
                  {(!svc.options || svc.options.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No option rules defined</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Code: {svc.code}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(svc)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-indigo-200 hover:bg-indigo-50"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'விலை விதியை திருத்து' : 'Edit Rules & Version'}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {editingServiceId ? 'Price Versioning Engine Active' : 'New Service'}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {editingServiceId
                    ? language === 'ta'
                      ? 'சேவை விருப்பங்கள் & விலை விதிகளை திருத்துக'
                      : 'Configure Dynamic Service Pricing Rules'
                    : language === 'ta'
                    ? 'புதிய ஜாக்கார்ட் சேவை & விலை விதிகள்'
                    : 'Create Jacquard Service & Pricing Rules'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmitService} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  1. Service Category & Master Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Border Service"
                      value={formData.name.en}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: { ...prev.name, en: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Name (தமிழ் / Tamil) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="எ.கா. பார்டர் சேவை"
                      value={formData.name.ta}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: { ...prev.name, ta: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Code (Unique) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingServiceId)}
                      placeholder="e.g. SERVICE_BORDER"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 font-mono disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as ServiceCategory
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
                    >
                      {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.labelEn} ({c.labelTa})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Description (English)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe what this service covers..."
                      value={formData.description.en}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: { ...prev.description, en: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Description (தமிழ் / Tamil)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="சேவையின் விவரங்கள் தமிழில்..."
                      value={formData.description.ta}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: { ...prev.description, ta: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Option Rules Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      2. Sub-Types & Dynamic Pricing Rules (Input-Based Calculation)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Configure rates per Monai, Set, Inch, or Fixed charges.
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddOptionRule}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-900 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option Rule
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                          Option Rule #{oIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionRule(oIdx)}
                          className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Option Key (e.g. ONE_SIDE_BORDER)
                          </label>
                          <input
                            type="text"
                            required
                            value={opt.optionKey}
                            onChange={(e) => handleOptionRuleChange(oIdx, 'optionKey', e.target.value.toUpperCase())}
                            className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs font-mono bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Option Name (English)
                          </label>
                          <input
                            type="text"
                            required
                            value={opt.name.en}
                            onChange={(e) => handleOptionRuleNameChange(oIdx, 'en', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Option Name (தமிழ்)
                          </label>
                          <input
                            type="text"
                            required
                            value={opt.name.ta}
                            onChange={(e) => handleOptionRuleNameChange(oIdx, 'ta', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">
                            Pricing Model *
                          </label>
                          <select
                            value={opt.pricingModel}
                            onChange={(e) => handleOptionRuleChange(oIdx, 'pricingModel', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-slate-50 font-bold text-slate-900"
                          >
                            {PRICING_MODELS.map((pm) => (
                              <option key={pm.value} value={pm.value}>
                                {pm.labelEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">
                            Unit Label (e.g. Monai, Set, Inches)
                          </label>
                          <input
                            type="text"
                            required
                            value={opt.unit}
                            onChange={(e) => handleOptionRuleChange(oIdx, 'unit', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 uppercase">
                            Rate per Unit (₹ INR) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={opt.rate}
                            onChange={(e) => handleOptionRuleChange(oIdx, 'rate', Number(e.target.value))}
                            className="w-full rounded-lg border border-emerald-300 py-1.5 px-2 text-xs font-black text-emerald-950 bg-emerald-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.options.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No option pricing rules added. Click &quot;Add Option Rule&quot; above.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingServiceId
                      ? language === 'ta'
                        ? 'விலை விதிகளை சேமி (பதிப்பு புதுப்பிப்பு)'
                        : 'Save Rules & Increment Version'
                      : language === 'ta'
                      ? 'சேவையை உருவாக்கு'
                      : 'Create Service'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
