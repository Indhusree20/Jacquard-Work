import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { Button } from '../ui/Button';
import { Menu, LogOut, User, Sparkles, Shield, ChevronDown } from 'lucide-react';

export const Navbar: React.FC<{ onMobileMenuToggle?: () => void }> = ({ onMobileMenuToggle }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'WEAVER') return '/weaver/dashboard';
    if (user.role === 'JACQUARD_WORKER') return '/worker/dashboard';
    if (user.role === 'ADMIN' || user.role === 'PRIMARY_ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-craft-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Handloom Emblem */}
          <div className="flex items-center gap-3">
            {isAuthenticated && onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-amber-800 flex items-center justify-center text-white shadow-craft-xs group-hover:scale-105 transition-transform">
                {/* Micro Thari Loom Vector Logo */}
                <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 3v18M20 3v18M2 6h20M2 18h20" strokeLinecap="round" />
                  <path d="M8 6v12M12 6v12M16 6v12" strokeDasharray="2 2" strokeWidth="1.5" />
                  <path d="M5 12h14" stroke="#f59e0b" strokeWidth="2.5" />
                </svg>
              </div>
              <div>
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 block leading-none">
                  {language === 'ta' ? 'ஜாகார்ட் தளம்' : 'JacquardWork'}
                </span>
                <span className="text-[10px] text-amber-800 font-bold tracking-wider uppercase block mt-0.5">
                  {language === 'ta' ? 'பாரம்பரிய கைத்தறி இணைப்பு' : 'Handloom Ecosystem'}
                </span>
              </div>
            </Link>
          </div>

          {/* Right actions: Language, Notifications, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />

            {isAuthenticated && user ? (
              <>
                <NotificationDropdown />

                {/* User menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100/80 transition-colors border border-transparent hover:border-stone-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shadow-craft-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[120px]">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-bold text-amber-800 capitalize">
                        {user.role === 'JACQUARD_WORKER' ? 'Jacquard Master' : user.role.toLowerCase()}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-craft-lg border border-stone-200/80 py-1.5 z-50 animate-fade-in"
                      onClick={() => setProfileOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        to={
                          user.role === 'WEAVER'
                            ? '/weaver/profile'
                            : user.role === 'JACQUARD_WORKER'
                            ? '/worker/profile'
                            : '/admin/users'
                        }
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-stone-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        {t('nav.profile', 'Profile & Settings')}
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-stone-100 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout', 'Sign Out')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.login', 'Sign In')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" withArrow>
                    {t('nav.register', 'Register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
