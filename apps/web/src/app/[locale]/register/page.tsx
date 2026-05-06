'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Input, Button, Card } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { Mail, Lock, ArrowRight, CheckCircle, User, Building2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserRole, SportComplex } from '@pivoo/shared';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>(UserRole.PLAYER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Complex picker state
  const [complexSearch, setComplexSearch] = useState('');
  const [complexes, setComplexes] = useState<SportComplex[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<SportComplex | null>(null);
  const [loadingComplexes, setLoadingComplexes] = useState(false);

  const { register, registerComplex } = useAuth();
  const router = useRouter();
  const t = useTranslations('register');
  const tc = useTranslations('common');

  useEffect(() => {
    if (role !== UserRole.COMPLEX) return;
    setLoadingComplexes(true);
    fetch(`${process.env.NEXT_PUBLIC_COMPLEXES_API_URL}/api/v1/complexes`)
      .then((r) => r.json())
      .then((data) => setComplexes(Array.isArray(data) ? data : []))
      .catch(() => setComplexes([]))
      .finally(() => setLoadingComplexes(false));
  }, [role]);

  const filteredComplexes = complexes.filter((c) => {
    const q = complexSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('errorPasswordMatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('errorPasswordLength'));
      return;
    }
    if (role === UserRole.COMPLEX && !STRONG_PASSWORD.test(password)) {
      setError(t('errorPasswordStrong'));
      return;
    }
    if (role === UserRole.COMPLEX && !selectedComplex) {
      setError(t('errorNoComplex'));
      return;
    }

    setIsLoading(true);
    try {
      if (role === UserRole.COMPLEX) {
        await registerComplex(email, password, selectedComplex!.id);
        router.push('/complex');
      } else {
        await register(email, password, role);
        router.push('/matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordLongEnough = password.length >= 8;
  const passwordStrong = role !== UserRole.COMPLEX || STRONG_PASSWORD.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-white font-bold text-2xl hidden sm:inline">Pivoo</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-300">{t('subtitle')}</p>
        </div>

        <Card variant="elevated" padding="lg" className="bg-white bg-opacity-95 backdrop-blur">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Account type selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('accountType')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setRole(UserRole.PLAYER); setSelectedComplex(null); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === UserRole.PLAYER
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-semibold">{t('accountPlayer')}</span>
                <span className="text-xs text-center leading-tight opacity-70">{t('accountPlayerDesc')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.COMPLEX)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === UserRole.COMPLEX
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-sm font-semibold">{t('accountComplex')}</span>
                <span className="text-xs text-center leading-tight opacity-70">{t('accountComplexDesc')}</span>
              </button>
            </div>
          </div>

          {role === UserRole.PLAYER && (
            <div className="mb-6 space-y-3">
              <button
                type="button"
                onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`; }}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400 font-medium">o registrate con email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              icon={<Lock className="w-5 h-5" />}
              hint={role === UserRole.COMPLEX ? t('passwordHintStrong') : t('passwordHint')}
              required
            />

            <Input
              label={t('confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            {password.length > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${passwordLongEnough ? 'text-green-600' : 'text-gray-300'}`} />
                  <span className={passwordLongEnough ? 'text-green-700' : 'text-gray-600'}>
                    {t('checkLength')}
                  </span>
                </div>
                {role === UserRole.COMPLEX && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${passwordStrong ? 'text-green-600' : 'text-gray-300'}`} />
                    <span className={passwordStrong ? 'text-green-700' : 'text-gray-600'}>
                      {t('checkStrong')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${passwordsMatch ? 'text-green-600' : 'text-gray-300'}`} />
                  <span className={passwordsMatch ? 'text-green-700' : 'text-gray-600'}>
                    {t('checkMatch')}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={
                  !passwordLongEnough ||
                  !passwordsMatch ||
                  !passwordStrong ||
                  (role === UserRole.COMPLEX && !selectedComplex)
                }
                className="w-full"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                {t('submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              {t('alreadyAccount')}{' '}
              <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-gray-300 text-sm mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            {tc('backToHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}
