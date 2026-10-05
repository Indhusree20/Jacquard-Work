import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api/authApi';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Lock, Mail, ShieldAlert, Sparkles, UserCheck, Wrench, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);

        const from = (location.state as any)?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else {
          if (res.data.user.role === 'WEAVER') navigate('/weaver/dashboard');
          else if (res.data.user.role === 'JACQUARD_WORKER') navigate('/worker/dashboard');
          else navigate('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Invalid email or password. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'ta' ? 'பாரம்பரிய கைத்தறி போர்டல்' : 'Traditional Handloom Portal'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {t('auth.loginTitle', 'Sign In to Jacquard Platform')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
              {t('auth.loginSubtitle', 'Sign in to access your handloom coordination dashboard')}
            </p>
          </div>

          <Card className="shadow-craft border-stone-200/90 relative overflow-hidden bg-white/98 backdrop-blur-xs">
            <CardContent className="p-6 sm:p-8 space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2.5 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('auth.email', 'Email Address')}
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-stone-400" />}
                />

                <Input
                  label={t('auth.password', 'Password')}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-stone-400" />}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-craft-sm"
                  isLoading={isLoading}
                  loadingText={language === 'ta' ? 'உள்நுழைகிறது...' : 'Signing in...'}
                  withArrow
                >
                  {t('auth.signInBtn', 'Sign In to Account')}
                </Button>
              </form>

              {/* Demo Accounts Quick Login */}
              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-stone-700 uppercase tracking-wider mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('auth.demoAccounts', 'Quick Demo Accounts:')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('muthuswamy.weaver@gmail.com', 'Weaver@123')}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:border-indigo-600 hover:bg-indigo-50/50 text-left transition-all group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 group-hover:text-indigo-900">
                      <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Weaver</span>
                    </div>
                    <span className="text-[10px] text-stone-500 block truncate mt-0.5">Muthuswamy (Salem)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('kandasamy.jacquard@gmail.com', 'Worker@123')}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:border-amber-600 hover:bg-amber-50/50 text-left transition-all group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 group-hover:text-amber-900">
                      <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      <span>Master</span>
                    </div>
                    <span className="text-[10px] text-stone-500 block truncate mt-0.5">Kandasamy (Salem)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@jacquardwork.in', 'Admin@123456')}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-stone-800 group-hover:text-emerald-900">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Admin</span>
                    </div>
                    <span className="text-[10px] text-stone-500 block truncate mt-0.5">Primary Admin</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-stone-600">
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="font-extrabold text-indigo-900 hover:text-amber-800 underline transition-colors">
              {t('auth.registerBtn', 'Create Account')} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
