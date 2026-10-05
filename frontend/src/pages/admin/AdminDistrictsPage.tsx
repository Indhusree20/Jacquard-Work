import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { districtApi } from '../../api/districtApi';
import { IDistrict } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  MapPin,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Layers,
  ShieldCheck,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AdminDistrictsPage: React.FC = () => {
  const { language, t } = useLanguage();

  const [districts, setDistricts] = useState<IDistrict[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 3-dot dropdown menu open state (stored by district ID)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Soft Deactivation / Removal Modal
  const [districtToRemove, setDistrictToRemove] = useState<IDistrict | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // "+ Add Districts" Multi-Select Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState('');
  const [selectedIdsToActivate, setSelectedIdsToActivate] = useState<string[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  // Inactive Accordion State
  const [showInactiveSection, setShowInactiveSection] = useState(true);

  const fetchDistricts = async () => {
    setIsLoading(true);
    try {
      const res = await districtApi.getAdminDistricts({ status: 'all' });
      if (res.success && res.data?.districts) {
        setDistricts(res.data.districts);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to load district catalogue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.district-action-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const activeDistricts = useMemo(
    () => districts.filter((d) => d.active),
    [districts]
  );
  const inactiveDistricts = useMemo(
    () => districts.filter((d) => !d.active),
    [districts]
  );

  // Filtered districts for main view
  const displayedDistricts = useMemo(() => {
    return districts.filter((d) => {
      // Tab filter
      if (activeTab === 'active' && !d.active) return false;
      if (activeTab === 'inactive' && d.active) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const enMatch = d.name?.en?.toLowerCase().includes(q);
        const taMatch = d.name?.ta?.toLowerCase().includes(q);
        const codeMatch = d.code?.toLowerCase().includes(q);
        return enMatch || taMatch || codeMatch;
      }
      return true;
    });
  }, [districts, activeTab, searchQuery]);

  // Candidates for the "+ Add Districts" modal (Inactive districts)
  const addModalCandidates = useMemo(() => {
    return inactiveDistricts.filter((d) => {
      if (!addModalSearch.trim()) return true;
      const q = addModalSearch.toLowerCase().trim();
      return (
        d.name?.en?.toLowerCase().includes(q) ||
        d.name?.ta?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q)
      );
    });
  }, [inactiveDistricts, addModalSearch]);

  const handleOpenAddModal = () => {
    setSelectedIdsToActivate([]);
    setAddModalSearch('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleToggleSelectCandidate = (id: string) => {
    setSelectedIdsToActivate((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCandidates = () => {
    if (selectedIdsToActivate.length === addModalCandidates.length) {
      setSelectedIdsToActivate([]);
    } else {
      setSelectedIdsToActivate(addModalCandidates.map((d) => d._id));
    }
  };

  const handleBatchActivate = async () => {
    if (selectedIdsToActivate.length === 0) return;
    setIsActivating(true);
    setErrorMessage('');
    try {
      const res = await districtApi.activateDistricts(selectedIdsToActivate);
      if (res.success) {
        setSuccessMessage(
          language === 'ta'
            ? `${selectedIdsToActivate.length} மாவட்டங்கள் வெற்றிகரமாக செயல்படுத்தப்பட்டன.`
            : `Successfully activated ${selectedIdsToActivate.length} district(s).`
        );
        setIsAddModalOpen(false);
        fetchDistricts();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to activate selected districts.'
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleConfirmSoftRemoval = async () => {
    if (!districtToRemove) return;
    setIsRemoving(true);
    setErrorMessage('');
    try {
      const res = await districtApi.deactivateDistrict(districtToRemove._id);
      if (res.success) {
        setSuccessMessage(
          language === 'ta'
            ? `"${districtToRemove.name.ta || districtToRemove.name.en}" மாவட்டம் செயலிழக்கப்பட்டது (மென்மையான நீக்கம் - பழைய பதிவுகள் பாதுகாக்கப்படுகின்றன).`
            : `"${districtToRemove.name.en}" removed from active districts (Historical records preserved).`
        );
        setDistrictToRemove(null);
        fetchDistricts();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to remove district.'
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleQuickReactivate = async (district: IDistrict) => {
    try {
      const res = await districtApi.toggleDistrictStatus(district._id, true);
      if (res.success) {
        setSuccessMessage(
          language === 'ta'
            ? `"${district.name.ta || district.name.en}" மாவட்டம் மீண்டும் செயல்படுத்தப்பட்டது.`
            : `"${district.name.en}" reactivated successfully.`
        );
        fetchDistricts();
      }
    } catch (err: any) {
      setErrorMessage('Failed to reactivate district.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-craft-xs overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'ta' ? 'நிர்வாக அமைப்புகள்' : 'Admin Settings'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'மாவட்ட மேலாண்மை' : 'District Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'ta'
              ? 'தளத்தில் எந்தெந்த மாவட்டங்கள் பயன்பாட்டில் இருக்க வேண்டும் என்பதை கட்டுப்படுத்தவும்.'
              : 'Configure which districts are active on the platform (No hard-coded district assumptions).'}
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          size="md"
          variant="primary"
          withArrow
          icon={<Plus className="w-4 h-4" />}
          className="relative z-10"
        >
          <span>{language === 'ta' ? '+ மாவட்டங்களைச் சேர்' : '+ Add Districts'}</span>
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'செயலில் உள்ள மாவட்டங்கள்' : 'Active Districts'}
            </span>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
              {activeDistricts.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'செயலற்ற மாவட்டங்கள்' : 'Inactive Districts'}
            </span>
            <h3 className="text-2xl font-black text-slate-600 mt-0.5">
              {inactiveDistricts.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'மொத்த மாஸ்டர் மாவட்டங்கள்' : 'Master Repository Total'}
            </span>
            <h3 className="text-2xl font-black text-indigo-950 mt-0.5">
              {districts.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ta' ? 'செயலில் உள்ளவை' : 'Active'} ({activeDistricts.length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inactive'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ta' ? 'செயலற்றவை' : 'Inactive'} ({inactiveDistricts.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All'} ({districts.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === 'ta'
                ? 'மாவட்டத்தை தேடுக (எ.கா. சேலம், Sal)...'
                : 'Search districts (e.g. Salem, Sal)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Districts List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-700" />
            <span>
              {activeTab === 'active'
                ? language === 'ta' ? 'செயலில் உள்ள மாவட்டங்கள் (Active Districts)' : 'Active Districts'
                : activeTab === 'inactive'
                ? language === 'ta' ? 'செயலற்ற மாவட்டங்கள் (Inactive Districts)' : 'Inactive Districts'
                : language === 'ta' ? 'அனைத்து மாவட்டங்கள் (All Districts)' : 'All Districts'}
            </span>
            <span className="text-slate-400 font-normal">({displayedDistricts.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Loading districts...</span>
          </div>
        ) : displayedDistricts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            {language === 'ta'
              ? 'மாவட்டங்கள் எதுவும் பொருந்தவில்லை.'
              : 'No districts found matching your criteria.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {displayedDistricts.map((district) => {
              const isMenuOpen = openMenuId === district._id;

              return (
                <div
                  key={district._id}
                  className={`bg-white rounded-2xl border-2 p-4 flex flex-col justify-between transition-all shadow-2xs relative ${
                    district.active
                      ? 'border-slate-200 hover:border-emerald-300'
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {district.name.en}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {district.code}
                        </span>
                      </div>
                      {district.name.ta && (
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {district.name.ta}
                        </p>
                      )}
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {district.state}
                      </span>
                    </div>

                    {/* Touch-Friendly Action Menu [ ⋮ ] */}
                    <div className="relative district-action-menu">
                      <button
                        type="button"
                        aria-label="Actions Menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : district._id);
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Mobile & Desktop Friendly Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                          {district.active ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDistrictToRemove(district);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span>{language === 'ta' ? 'மாவட்டத்தை நீக்கு' : 'Remove District'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleQuickReactivate(district);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{language === 'ta' ? 'மீண்டும் இயக்கு' : 'Reactivate District'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        district.active
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          district.active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {district.active
                        ? language === 'ta' ? 'செயலில் உள்ளது (Active)' : 'Active'
                        : language === 'ta' ? 'செயலிழக்கப்பட்டது (Inactive)' : 'Inactive'}
                    </span>

                    {!district.active && (
                      <button
                        type="button"
                        onClick={() => handleQuickReactivate(district)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                      >
                        {language === 'ta' ? 'செயல்படுத்து' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. SOFT REMOVE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {districtToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {language === 'ta'
                  ? `"${districtToRemove.name.ta || districtToRemove.name.en}" மாவட்டத்தை நீக்கவா?`
                  : `Remove "${districtToRemove.name.en}" from active districts?`}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? `இந்த மாவட்டத்தை செயலற்றதாக மாற்றுவது புதிய வேலை கோரிக்கைகளில் இதை தேர்வு செய்ய அனுமதிக்காது. ஆனால் ஏற்கனவே உள்ள பயனர்கள் மற்றும் வேலை பதிவுகள் பாதுகாக்கப்படும்.`
                  : `Are you sure you want to remove ${districtToRemove.name.en} from the active districts? Existing records and historical jobs using this district will not be deleted.`}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {language === 'ta'
                  ? 'பாதுகாப்பான மென்மையான நீக்கம் (Soft Deactivation) பயன்படுத்தப்படுகிறது.'
                  : 'Safe Soft Deactivation: Sets active = false while keeping all database references intact.'}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setDistrictToRemove(null)}
                disabled={isRemoving}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmSoftRemoval}
                isLoading={isRemoving}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {language === 'ta' ? 'மாவட்டத்தை நீக்கு' : 'Remove District'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. "+ ADD DISTRICTS" MULTI-SELECT SELECTION INTERFACE */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {language === 'ta' ? 'மாஸ்டர் களஞ்சியம்' : 'Master Repository Selection'}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {language === 'ta' ? 'செயல்படுத்த வேண்டிய மாவட்டங்களைத் தேர்வு செய்க' : 'Select Districts to Activate'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? 'ஒன்று அல்லது பல மாவட்டங்களை ஒரே நேரத்தில் செயல்படுத்தலாம்.'
                    : 'Select one or multiple districts from the available master list.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter & Select All Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    language === 'ta'
                      ? 'மாவட்டத்தை தேடுக (எ.கா. Ariyalur, Chengalpattu)...'
                      : 'Search districts (e.g. Ariyalur, Chengalpattu)...'
                  }
                  value={addModalSearch}
                  onChange={(e) => setAddModalSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs bg-white focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCandidates}
                  className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
                >
                  {selectedIdsToActivate.length === addModalCandidates.length && addModalCandidates.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <span>{language === 'ta' ? 'அனைத்தையும் தேர்வு நீக்கு' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>{language === 'ta' ? 'அனைத்தையும் தேர்வு செய்க' : 'Select All Filtered'}</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedIdsToActivate.length} {language === 'ta' ? 'தேர்வு செய்யப்பட்டுள்ளன' : 'selected'}
                </span>
              </div>
            </div>

            {/* Modal Candidates Checkbox List */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-2 flex-1 max-h-[50vh]">
              {addModalCandidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  {language === 'ta'
                    ? 'செயல்படுத்துவதற்கு புதிய மாவட்டங்கள் எதுவும் இல்லை (அனைத்தும் ஏற்கனவே செயலில் உள்ளன).'
                    : 'No matching inactive districts available to activate.'}
                </div>
              ) : (
                addModalCandidates.map((dist) => {
                  const isSelected = selectedIdsToActivate.includes(dist._id);

                  return (
                    <label
                      key={dist._id}
                      onClick={() => handleToggleSelectCandidate(dist._id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-900 border-indigo-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {dist.name.en}
                          </span>
                          {dist.name.ta && (
                            <span className="text-xs text-slate-500 ml-2">
                              ({dist.name.ta})
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {dist.code}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isActivating}
              >
                {t('common.cancel', 'Cancel')}
              </Button>

              <Button
                type="button"
                onClick={handleBatchActivate}
                disabled={selectedIdsToActivate.length === 0 || isActivating}
                isLoading={isActivating}
                className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold shadow-md"
              >
                <span>
                  {language === 'ta'
                    ? `தேர்வு செய்த (${selectedIdsToActivate.length}) மாவட்டங்களைச் சேர்`
                    : `Add Selected Districts (${selectedIdsToActivate.length})`}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
