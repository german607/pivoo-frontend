'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Match, Sport, SportComplex } from '@pivoo/shared';
import { MatchCard } from '@/components/MatchCard';
import { Header } from '@/components/Header';
import { Input, Button, Skeleton } from '@/components/ui';
import { Plus, Search, Frown } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

export default function MatchesPage() {
  const { isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const t = useTranslations('matches');

  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');

  useEffect(() => {
    if (!authLoading) { loadSports(); loadMatches(); }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) loadMatches();
  }, [selectedSportId]);

  const loadSports = async () => {
    try {
      const data = await get<Sport[]>('/api/v1/sports', {
        baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL,
      });
      setSports(data || []);
    } catch (err) { console.error(err); }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const query = selectedSportId ? `?sportId=${selectedSportId}` : '';
      const [data, complexes] = await Promise.all([
        get<Match[]>(`/api/v1/matches${query}`, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }),
      ]);
      const complexMap = new Map((complexes || []).map((c) => [c.id, c]));
      setMatches((data || []).map((m) => {
        const c = complexMap.get(m.complexId);
        return c ? { ...m, complex: { name: c.name, city: c.city } } : m;
      }));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const sportNameById = (id: string) => sports.find((s) => s.id === id)?.name ?? '';

  const filtered = matches.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return [
      sportNameById(m.sportId),
      m.description ?? '',
      m.complex ? `${m.complex.name} ${m.complex.city}` : '',
    ].some((s) => s.toLowerCase().includes(term));
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0f172a 280px, #f8fafc 280px)' }}>
      <Header />

      {/* ── Hero banner ─────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Glow */}
        <div className="absolute right-0 top-0 w-96 h-48 bg-teal-500 opacity-10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">En vivo</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">{t('title')}</h1>
              <p className="text-slate-400 text-sm">{t('subtitle')}</p>
            </div>
            <Button
              onClick={() => router.push('/matches/new')}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              className="shrink-0"
            >
              {t('createMatch')}
            </Button>
          </div>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="sm:w-72">
              <Input
                placeholder={t('searchPlaceholder')}
                icon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/15 text-white placeholder-slate-400 focus:bg-white/15 focus:border-teal-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ id: '', name: t('filterAll') }, ...sports.map((s) => ({ id: s.id, name: s.name }))].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedSportId(opt.id)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 border',
                    selectedSportId === opt.id
                      ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/30'
                      : 'bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white'
                  )}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 py-24 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5 mx-auto">
              <Frown className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">{t('noMatchesTitle')}</p>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">{t('noMatchesDesc')}</p>
            <Button onClick={() => router.push('/matches/new')} variant="primary" icon={<Plus className="w-4 h-4" />}>
              {t('createMatch')}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              {filtered.length} partidos disponibles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((match) => (
                <MatchCard key={match.id} match={match} sportName={sportNameById(match.sportId)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
