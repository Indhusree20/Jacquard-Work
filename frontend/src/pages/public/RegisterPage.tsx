import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api/authApi';
import { districtApi } from '../../api/districtApi';
import { IDistrict, UserRole } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { ThariLogo } from '../../components/ui/ThariLogo';
import {
  Building2,
  Wrench,
  ShieldAlert,
  MapPin,
  Search,
  ChevronDown,
  Check,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('WEAVER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loomCount, setLoomCount] = useState<number>(4);
  const [experienceYears, setExperienceYears] = useState<number>(10);
  const [specialization, setSpecialization] = useState('Jacquard Box Setup, Card Punching');
  
  // District States
  const [activeDistricts, setActiveDistricts] = useState<IDistrict[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(true);
  const [districtsError, setDistrictsError] = useState<string | null>(null);

  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('636001');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchDistricts = async () => {
    setIsDistrictsLoading(true);
    setDistrictsError(null);
    try {
      const res = await districtApi.getActiveDistricts();
      const list = res.districts || res.data?.districts || (Array.isArray(res) ? res : []);
      setActiveDistricts(list);

      if (selectedDistrictId) {
        const stillActive = list.find((d: IDistrict) => d._id === selectedDistrictId);
        if (!stillActive) {
          setSelectedDistrictId('');
        }
      }
    } catch (err: any) {
      console.error('Error fetching active districts for registration:', err);
      setDistrictsError(
        language === 'ta'
          ? 'மாவட்டங்களை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'Unable to load districts. Please try again.'
      );
    } finally {
      setIsDistrictsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const selectedDistrict = useMemo(
    () => activeDistricts.find((d) => d._id === selectedDistrictId),
    [activeDistricts, selectedDistrictId]
  );

  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return activeDistricts;
    const query = districtSearchQuery.trim().toLowerCase();
    return activeDistricts.filter(
      (d) =>
        d.name.en.toLowerCase().includes(query) ||
        (d.name.ta && d.name.ta.toLowerCase().includes(query)) ||
        (d.code && d.code.toLowerCase().includes(query))
    );
  }, [activeDistricts, districtSearchQuery]);

  const handleSelectDistrict = (d: IDistrict) => {
    setSelectedDistrictId(d._id);
    if (!city || activeDistricts.some((item) => item.name.en === city)) {
      setCity(d.name.en);
    }
    setIsDropdownOpen(false);
    setDistrictSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage(language === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : "Passwords don't match.");
      return;
    }

    if (!selectedDistrictId || !selectedDistrict) {
      setErrorMessage(
        language === 'ta'
          ? 'தயவுசெய்து உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.'
          : 'District is required. Please select your district.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        districtId: selectedDistrict._id,
        district: selectedDistrict.name.en,
        preferredLanguage: language,
        location: {
          address: address || `${city || selectedDistrict.name.en} Handloom Area`,
          city: city || selectedDistrict.name.en,
          district: selectedDistrict.name.en,
          districtId: selectedDistrict._id,
          pincode,
          state: 'Tamil Nadu',
          lat: selectedDistrict.name.en === 'Kanchipuram' ? 12.8342 : selectedDistrict.name.en === 'Erode' ? 11.341 : 11.6643,
          lng: selectedDistrict.name.en === 'Kanchipuram' ? 79.7036 : selectedDistrict.name.en === 'Erode' ? 77.7172 : 78.146
        }
      };

      if (role === 'WEAVER') {
        payload.businessName = businessName || `${name} Weaving Works`;
        payload.loomCount = Number(loomCount) || 1;
      } else {
        payload.experienceYears = Number(experienceYears) || 5;
        payload.specialization = specialization.split(',').map((s) => s.trim());
      }

      const res = await authApi.register(payload);
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        if (role === 'WEAVER') navigate('/weaver/dashboard');
        else navigate('/worker/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Registration failed. Please check your details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <ThariLogo size="xl" textPosition="bottom" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'புதிய பதிவு' : 'New Artisan & Weaver Network'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('auth.registerTitle', 'Create Artisan / Weaver Account')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {t('auth.registerSubtitle', 'Join Tamil Nadu’s dedicated Jacquard work network')}
            </p>
          </div>

          <Card className="shadow-craft border-stone-200/90 relative bg-white/98">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2.5 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
                  {t('auth.roleSelect', 'Select Your Role')} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('WEAVER')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      role === 'WEAVER'
                        ? 'border-indigo-900 bg-indigo-50/70 shadow-craft-xs ring-2 ring-indigo-900/10'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-craft-xs ${
                        role === 'WEAVER'
                          ? 'bg-indigo-900 text-white'
                          : 'bg-stone-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-900">
                        {t('auth.weaverRole', 'Weaver / Loom Owner')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'ta' ? 'நெசவாளர் / தறி உரிமையாளர்' : 'Post work requests & manage looms'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('JACQUARD_WORKER')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      role === 'JACQUARD_WORKER'
                        ? 'border-amber-700 bg-amber-50/70 shadow-craft-xs ring-2 ring-amber-700/10'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-craft-xs ${
                        role === 'JACQUARD_WORKER'
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-slate-600'
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-900">
                        {t('auth.workerRole', 'Jacquard Master / Artisan')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'ta' ? 'ஜாகார்ட் மாஸ்டர் ஆசாரி' : 'Accept jobs, manage schedule & charges'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('auth.fullName', 'Full Name')}
                    required
                    placeholder="e.g. M. Muthuswamy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    label={t('auth.phone', 'Mobile Number')}
                    type="tel"
                    required
                    placeholder="e.g. 9842512345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Input
                  label={t('auth.email', 'Email Address')}
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* Role Specific Fields */}
                {role === 'WEAVER' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/90 shadow-2xs">
                    <Input
                      label={t('auth.businessName', 'Weaving Unit / Workshop Name')}
                      placeholder="e.g. Sri Lakshmi Silk Looms"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                    <Input
                      label={t('auth.loomCount', 'Number of Handlooms')}
                      type="number"
                      min={1}
                      value={loomCount}
                      onChange={(e) => setLoomCount(Number(e.target.value))}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 bg-amber-50/50 rounded-2xl border border-amber-200/70 shadow-2xs">
                    <Input
                      label={t('auth.experienceYears', 'Years of Experience')}
                      type="number"
                      min={1}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                    />
                    <Input
                      label={t('auth.specialization', 'Specializations (comma separated)')}
                      placeholder="e.g. Box Setup, Card Punching"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                )}

                {/* Location Cluster Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Searchable District Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{t('common.district', 'District')} *</span>
                      {selectedDistrict && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                          {selectedDistrict.code}
                        </span>
                      )}
                    </label>

                    {isDistrictsLoading ? (
                      <div className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3 text-xs text-slate-500 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-700 shrink-0" />
                        <span>{language === 'ta' ? 'மாவட்டங்கள் ஏற்றப்படுகின்றன...' : 'Loading districts...'}</span>
                      </div>
                    ) : districtsError ? (
                      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex flex-col gap-1.5">
                        <span>{districtsError}</span>
                        <button
                          type="button"
                          onClick={fetchDistricts}
                          className="self-start text-[11px] px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> {language === 'ta' ? 'மீண்டும் முயல்க' : 'Retry'}
                        </button>
                      </div>
                    ) : activeDistricts.length === 0 ? (
                      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                        <p className="font-semibold">{language === 'ta' ? 'செயலில் உள்ள மாவட்டங்கள் எதுவும் இல்லை. தயவுசெய்து நிர்வாகியைத் தொடர்பு கொள்ளவும்.' : 'No active districts available. Please contact the administrator.'}</p>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          id="district-select-btn"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`w-full rounded-xl border py-2.5 px-3.5 text-sm text-left flex items-center justify-between transition-colors bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 cursor-pointer ${
                            selectedDistrict ? 'border-indigo-700 text-slate-900 font-bold' : 'border-stone-300 text-slate-500'
                          }`}
                        >
                          <span className="truncate">
                            {selectedDistrict ? (
                              <span>
                                {selectedDistrict.name.en}{' '}
                                {selectedDistrict.name.ta && (
                                  <span className="text-slate-500 font-normal">({selectedDistrict.name.ta})</span>
                                )}
                              </span>
                            ) : (
                              <span>{language === 'ta' ? 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்' : 'Select District'}</span>
                            )}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${
                              isDropdownOpen ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Searchable Dropdown Popover */}
                        {isDropdownOpen && (
                          <div className="absolute z-50 mt-1 w-full sm:min-w-[280px] bg-white rounded-2xl shadow-craft-lg border border-stone-200 py-1.5 text-sm overflow-hidden animate-fade-in">
                            <div className="p-2 border-b border-stone-100">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  ref={searchInputRef}
                                  type="text"
                                  value={districtSearchQuery}
                                  onChange={(e) => setDistrictSearchQuery(e.target.value)}
                                  placeholder={language === 'ta' ? 'மாவட்டம் தேடுக...' : 'Search district...'}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-700 focus:bg-white"
                                />
                                {districtSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setDistrictSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
                              {filteredDistricts.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">
                                  {language === 'ta' ? 'பொருந்தும் மாவட்டங்கள் இல்லை' : 'No matching active districts'}
                                </div>
                              ) : (
                                filteredDistricts.map((d) => {
                                  const isSelected = d._id === selectedDistrictId;
                                  return (
                                    <button
                                      key={d._id}
                                      type="button"
                                      onClick={() => handleSelectDistrict(d)}
                                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50 text-indigo-950 font-bold'
                                          : 'hover:bg-stone-50 text-slate-700'
                                      }`}
                                    >
                                      <div>
                                        <span className="text-slate-900 font-semibold">{d.name.en}</span>
                                        {d.name.ta && (
                                          <span className="text-slate-500 ml-1.5">({d.name.ta})</span>
                                        )}
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-700 shrink-0 ml-2" />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Input
                      label={language === 'ta' ? 'நகரம் / பகுதி' : 'Town / Area'}
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      label={t('common.pincode', 'PIN Code')}
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('auth.password', 'Password')}
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <Input
                    label={t('auth.confirmPassword', 'Confirm Password')}
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-craft-sm mt-4"
                  isLoading={isLoading}
                  loadingText={language === 'ta' ? 'கணக்கு உருவாக்கப்படுகிறது...' : 'Creating Account...'}
                  disabled={!isDistrictsLoading && activeDistricts.length === 0}
                  withArrow
                >
                  {t('auth.registerBtn', 'Create Account & Continue')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-600">
            {t('auth.haveAccount', 'Already registered?')}{' '}
            <Link to="/login" className="font-extrabold text-indigo-900 hover:text-amber-800 underline transition-colors">
              {t('auth.signInBtn', 'Sign In')} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
