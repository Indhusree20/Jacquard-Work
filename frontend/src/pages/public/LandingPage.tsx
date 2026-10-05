import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileCheck2,
  CalendarCheck2,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  BadgeCheck,
  Grid,
  RotateCw,
  Wrench,
  Box
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'WEAVER') return '/weaver/dashboard';
    if (user.role === 'JACQUARD_WORKER') return '/worker/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-stone-200/90 bg-loom-pattern">
        {/* Large Subtle Thari Loom in Hero Background */}
        <ThariWatermark
          variant="loom-watermark"
          position="top-right"
          size="xl"
          opacity={0.06}
          className="-mr-12 -mt-12 hidden lg:block"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/70 text-amber-950 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {language === 'ta'
                    ? 'தமிழ்நாடு கைத்தறி & ஜாகார்ட் பணி மேலாண்மை'
                    : 'Dedicated to Tamil Nadu Handloom Weavers & Jacquard Masters'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {language === 'ta' ? (
                  <>
                    பாரம்பரிய தறி கலைக்கு <br />
                    <span className="text-indigo-900 underline decoration-amber-500 decoration-wavy decoration-2">
                      டிஜிட்டல் பணி ஒருங்கிணைப்பு
                    </span>
                  </>
                ) : (
                  <>
                    Bridging Traditional Loom Craftsmanship with{' '}
                    <span className="text-indigo-900 underline decoration-amber-500 decoration-wavy decoration-2">
                      Modern Digital Management
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {language === 'ta'
                  ? 'போன் அழைப்புகள் மற்றும் வாட்ஸ்அப் குழப்பங்களை தவிர்த்து, வேலை கோரிக்கைகள், டிசைன் வரைபடங்கள், விலைப்பட்டியல்கள் மற்றும் தறி தள ஜிபிஎஸ் வழிசெலுத்தலை ஒரே இடத்தில் நிர்வகிக்கவும்.'
                  : 'Digitizing work requests, graph card uploads, transparent admin-governed pricing, scheduling, and on-site loom navigation for Salem, Kanchipuram, Erode, Coimbatore & Tiruppur.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {isAuthenticated ? (
                  <Link to={getDashboardPath()}>
                    <Button size="lg" withArrow>
                      <span>{t('nav.dashboard', 'Go to Dashboard')}</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full" withArrow>
                        <span>{language === 'ta' ? 'இப்போதே இணையுங்கள்' : 'Get Started as Artisan / Weaver'}</span>
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full">
                        <span>{language === 'ta' ? 'உள்நுழைக' : 'Sign In'}</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-stone-200/90 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{language === 'ta' ? 'உறுதியான கைவினைஞர்' : 'Verified Masters'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{language === 'ta' ? 'ஜிபிஎஸ் வழிசெலுத்தல்' : 'Loom GPS Location'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{language === 'ta' ? 'நேர்மையான விலை' : 'Admin Controlled Pricing'}</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-craft p-6 space-y-5 relative overflow-hidden">
                <ThariWatermark variant="craft-seal" position="bottom-right" size="sm" opacity={0.04} className="-mr-4 -mt-4" />

                <div className="flex items-center justify-between pb-3 border-b border-stone-100 relative z-10">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    {language === 'ta' ? 'நேரடி தறி பணி ஒருங்கிணைப்பு' : 'Live Loom Coordination'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                    Tamil Nadu Hub
                  </span>
                </div>

                {/* Workflow Simulation steps */}
                <div className="space-y-3 text-xs relative z-10">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-900 font-black flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {language === 'ta' ? 'நெசவாளர் வேலை கோரிக்கை' : 'Weaver creates work request'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {language === 'ta'
                          ? '2 பட்டு தறிகளுக்கான ஜாகார்ட் பெட்டி அமைப்பு + டிசைன் அப்லோட்'
                          : 'Border Monai & Self Set for Silk Pit Looms + Graph design uploaded'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {language === 'ta' ? 'மாஸ்டர் ஒப்புதல் & பயணப்படி' : 'Master accepts & schedules date'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {language === 'ta'
                          ? 'சேலம் ஆசாரி கோரிக்கையை ஏற்று பணி தேதியை உறுதி செய்கிறார்'
                          : 'Salem Jacquard Master accepts with locked admin rates + petrol allowance'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-black flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {language === 'ta' ? 'தறி தளம் சரிபார்த்தல் & நிறைவு' : 'On-Site Loom Tuning & Completion'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {language === 'ta'
                          ? 'பணி முடிக்கப்பட்டு டிஜிட்டல் ரசீது வழங்கப்படுகிறது'
                          : 'Loom tuned, card punching tested, work verified and settled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-16 bg-white border-b border-stone-200/90 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'ta' ? 'ஜாக்கார்ட் தறி சேவைகள்' : 'Standardized Jacquard Loom Services'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              {language === 'ta'
                ? 'அனைத்து முக்கிய ஜாக்கார்ட் பணிகளுக்கும் நிர்ணயிக்கப்பட்ட விலை மற்றும் அளவீட்டு முறைகள்'
                : 'Deterministic measurement-based pricing rules for every handloom operation'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Sparkles, name: 'Border', desc: 'Monai-based exclusive rate' },
              { icon: Grid, name: 'Self', desc: '120/240 Kambi set pricing' },
              { icon: RotateCw, name: 'Turning', desc: 'Inch-based turning width' },
              { icon: Wrench, name: 'Stand Fitting', desc: 'Fixed flat loom setup' },
              { icon: Box, name: 'Box Fitting', desc: 'Fixed flat box alignment' },
              { icon: Layers, name: 'MBO Service', desc: 'Set-based emboss harness' },
            ].map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div key={i} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-craft-xs transition-all text-center space-y-2 group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 mx-auto flex items-center justify-center text-indigo-900 group-hover:scale-110 transition-transform shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{svc.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
