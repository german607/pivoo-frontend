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
