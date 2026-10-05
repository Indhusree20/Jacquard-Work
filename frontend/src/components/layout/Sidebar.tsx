import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThariWatermark } from '../ui/ThariWatermark';
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  Briefcase,
  Calendar,
  IndianRupee,
  History,
  Users,
  ShieldCheck,
  Tag,
  Layers,
  MapPin,
  BarChart3,
  X,
  User
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  if (!user) return null;

  // Weaver Navigation: Focused strictly on Work Requests and Account (No My Jobs)
  const weaverSections = [
    {
      title: language === 'ta' ? 'தறி கோரிக்கைகள்' : 'Work Requests',
      links: [
        { to: '/weaver/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: '/weaver/requests/new', label: t('nav.newRequest', 'New Work Request'), icon: PlusCircle },
        { to: '/weaver/requests', label: t('nav.myRequests', 'My Requests'), icon: FileSpreadsheet },
        { to: '/weaver/profile', label: language === 'ta' ? 'சுயவிவரம்' : 'Profile & Workshop', icon: User }
      ]
    }
  ];

  const workerSections = [
    {
      title: language === 'ta' ? 'ஆசாரி பணிகள்' : 'Master Operations',
      links: [
        { to: '/worker/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: '/worker/available', label: t('nav.availableRequests', 'Available Requests'), icon: PlusCircle },
        { to: '/worker/jobs', label: t('nav.myJobs', 'My Jobs'), icon: Briefcase },
        { to: '/worker/schedule', label: t('nav.schedule', 'Loom Schedule'), icon: Calendar },
        { to: '/worker/charges', label: t('nav.charges', 'Charges & Earnings'), icon: IndianRupee },
        { to: '/worker/history', label: t('nav.history', 'Job History'), icon: History }
      ]
    }
  ];

  const adminSections = [
    {
      title: language === 'ta' ? 'முதன்மை' : 'Overview',
      links: [
        { to: '/admin/dashboard', label: t('nav.dashboard', 'Command Center'), icon: LayoutDashboard }
      ]
    },
    {
      title: language === 'ta' ? 'வேலை மேலாண்மை' : 'Work Management',
      links: [
        { to: '/admin/jobs-quotes', label: language === 'ta' ? 'வேலைகள் & ஒப்பந்தங்கள்' : 'Work Requests & Jobs', icon: Briefcase, perm: 'MANAGE_JOBS' },
        { to: '/admin/services', label: language === 'ta' ? 'ஜாக்கார்ட் சேவைகள்' : 'Jacquard Services', icon: Layers, perm: 'MANAGE_WORK_TYPES' },
        { to: '/admin/work-types', label: language === 'ta' ? 'விலை நிர்ணய முறைகள்' : 'Pricing & Work Types', icon: Tag, perm: 'MANAGE_WORK_TYPES' },
        { to: '/admin/payment-reports', label: language === 'ta' ? 'கட்டணங்கள் & நிலுவை' : 'Payments & Unpaid', icon: IndianRupee }
      ]
    },
    {
      title: language === 'ta' ? 'மண்டலங்கள்' : 'Location Clusters',
      links: [
        { to: '/admin/districts', label: language === 'ta' ? 'மாவட்டங்கள் & தறி மையங்கள்' : 'Districts & Clusters', icon: MapPin, perm: 'MANAGE_DISTRICTS' }
      ]
    },
    {
      title: language === 'ta' ? 'பயனர்கள்' : 'Users & Access',
      links: [
        { to: '/admin/users', label: t('nav.users', 'Weavers & Artisans'), icon: Users, perm: 'MANAGE_USERS' },
        { to: '/admin/admins', label: t('nav.admins', 'Admins & RBAC'), icon: ShieldCheck, perm: 'MANAGE_ADMINS' }
      ]
    },
    {
      title: language === 'ta' ? 'அறிக்கைகள்' : 'System',
      links: [
        { to: '/admin/reports', label: t('nav.reports', 'Platform Reports'), icon: BarChart3, perm: 'VIEW_REPORTS' }
      ]
    }
  ];

  const currentSections =
    user.role === 'WEAVER'
      ? weaverSections
      : user.role === 'JACQUARD_WORKER'
      ? workerSections
      : adminSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0 shadow-craft-lg' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header (Mobile close) */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 lg:hidden bg-stone-50/50">
          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            {language === 'ta' ? 'வழிசெலுத்தல் பட்டி' : 'Navigation Menu'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="p-4 bg-gradient-to-br from-stone-50 via-white to-amber-50/30 border-b border-stone-200/70 relative overflow-hidden">
          <ThariWatermark variant="craft-seal" position="top-right" size="sm" opacity={0.05} className="-mr-4 -mt-4" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-950 to-indigo-900 text-amber-300 font-black flex items-center justify-center text-sm shadow-craft-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate leading-snug">{user.name}</p>
              <span className="inline-block text-[10px] font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full mt-0.5">
                {t(`roles.${user.role}`, user.role)}
              </span>
            </div>
          </div>
          {user.businessName && (
            <p className="text-[11px] text-slate-500 mt-2 truncate font-medium">🏛️ {user.businessName}</p>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {currentSections.map((section, sIdx) => {
            const visibleLinks = section.links.filter(
              (link: any) => !link.perm || hasPermission(link.perm)
            );
            if (visibleLinks.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {section.title && (
                  <h4 className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {section.title}
                  </h4>
                )}
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      end={link.to.endsWith('/dashboard')}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-900 text-white shadow-craft-xs'
                            : 'text-slate-600 hover:text-slate-950 hover:bg-stone-100/80'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer District Hub Status */}
        <div className="p-3.5 border-t border-stone-200/80 bg-stone-50/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">
                {language === 'ta' ? 'தமிழ்நாடு தறி நெட்வொர்க்' : 'TN Loom Network'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
