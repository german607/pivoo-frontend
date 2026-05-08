'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useRouter } from '@/navigation';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const { loginWithTokens } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      loginWithTokens(accessToken, refreshToken);
      router.replace('/');
    } else {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}
