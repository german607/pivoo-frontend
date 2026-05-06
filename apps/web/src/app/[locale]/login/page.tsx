'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { Input, Button, Card } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { Mail, Lock, ArrowRight, User, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type AccountType = 'player' | 'complex';

export default function LoginPage() {
  const [accountType, setAccountType] = useState<AccountType>('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginComplex } = useAuth();
  const router = useRouter();
  const t = useTranslations('login');
  const tc = useTranslations('common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (accountType === 'complex') {
        await loginComplex(email, password);
        router.push('/complex');
      } else {
        await login(email, password);
        router.push('/matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'));
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Account type selector */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAccountType('player')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  accountType === 'player'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4" />
                Jugador
              </button>
              <button
                type="button"
                onClick={() => setAccountType('complex')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  accountType === 'complex'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Complejo
              </button>
            </div>
          </div>

          {accountType === 'player' && (
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
                  <span className="px-3 bg-white text-gray-400 font-medium">o continúa con email</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
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
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
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
              {t('noAccount')}{' '}
              <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                {t('createOne')}
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
