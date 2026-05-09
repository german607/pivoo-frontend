'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Match, Sport, SportComplex, SkillLevel, MatchCategory, MatchGender, MatchMode, UserSportStats, UserGender } from '@pivoo/shared';
import { sortByRelevance, getRecommendedIds } from '@/utils/matchScore';
import { MatchCard } from '@/components/MatchCard';
import { MyMatchesDrawer } from '@/components/MyMatchesDrawer';
import { Header } from '@/components/Header';
import { Input, Button, Skeleton } from '@/components/ui';
import { Plus, Search, Frown, SlidersHorizontal, X, ChevronRight, CalendarDays } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
};

const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino', FEMENINO: 'Femenino', MIXTO: 'Mixto',
};

const SELECT_CLASS = 'px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-150 focus:outline-none appearance-none bg-slate-800 border-slate-700 text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30';

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const t = useTranslations('matches');

  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [complexes, setComplexes] = useState<SportComplex[]>([]);
  const [userStats, setUserStats] = useState<UserSportStats[]>([]);
  const [userGender, setUserGender] = useState<UserGender | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myMatchesOpen, setMyMatchesOpen] = useState(false);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'' | 'today' | 'thisWeek' | 'thisMonth'>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateExpanded, setDateExpanded] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'' | MatchMode.INDIVIDUAL | MatchMode.TEAM_VS_TEAM>('');

  useEffect(() => {
    if (!authLoading) loadSports();
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) loadMatches();
  }, [authLoading, selectedSportId, selectedComplexId]);

  const loadSports = async () => {
    try {
      const data = await get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL });
      setSports(data || []);
    } catch { /* ignore */ }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSportId) params.set('sportId', selectedSportId);
      if (selectedComplexId) params.set('complexId', selectedComplexId);
      const query = params.toString() ? `?${params}` : '';

      const [data, complexData, profileData] = await Promise.all([
        get<Match[]>(`/api/v1/matches${query}`, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }),
        user
          ? get<{ sportStats: UserSportStats[]; gender: string | null }>('/api/v1/users/me', { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const freshComplexes = complexData || [];
      setComplexes(freshComplexes);
      setUserStats(profileData?.sportStats ?? []);
      setUserGender((profileData?.gender as UserGender) ?? null);
      const complexMap = new Map(freshComplexes.map((c) => [c.id, c]));
      setMatches((data || []).map((m) => {
        const c = m.complexId ? complexMap.get(m.complexId) : undefined;
        return c ? { ...m, complex: { name: c.name, city: c.city } } : m;
      }));
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const sportNameById = (id: string) => sports.find((s) => s.id === id)?.name ?? '';

  const filtered = matches.filter((m) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = [
        sportNameById(m.sportId),
        m.description ?? '',
        m.complex ? `${m.complex.name} ${m.complex.city}` : '',
      ].some((s) => s.toLowerCase().includes(term));
      if (!match) return false;
    }

    // Auto gender filter: exclude incompatible matches when user has gender set
    if (userGender && m.gender && m.gender !== MatchGender.MIXTO) {
      if ((m.gender as string) !== (userGender as string)) return false;
    }

    if (selectedMode && m.mode !== selectedMode) return false;
    if (selectedGender && m.gender !== selectedGender) return false;
    if (selectedLevel && m.requiredLevel !== selectedLevel) return false;
    if (selectedCategory && m.requiredCategory !== selectedCategory) return false;

    const matchDate = new Date(m.scheduledAt);
    if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00');
      const end = new Date(selectedDate + 'T23:59:59');
      if (matchDate < d || matchDate > end) return false;
    } else if (selectedDateFilter) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (selectedDateFilter === 'today') {
        const end = new Date(startOfDay.getTime() + 86400000 - 1);
        if (matchDate < startOfDay || matchDate > end) return false;
      } else if (selectedDateFilter === 'thisWeek') {
        const dayOfWeek = startOfDay.getDay() === 0 ? 6 : startOfDay.getDay() - 1;
        const monday = new Date(startOfDay.getTime() - dayOfWeek * 86400000);
        const sunday = new Date(monday.getTime() + 7 * 86400000 - 1);
        if (matchDate < monday || matchDate > sunday) return false;
      } else if (selectedDateFilter === 'thisMonth') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        if (matchDate < firstDay || matchDate > lastDay) return false;
      }
    }

    return true;
  });

  const activeFilterCount = [selectedSportId, selectedComplexId, selectedGender, selectedLevel, selectedCategory, selectedDateFilter, selectedDate, selectedMode]
    .filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSportId('');
    setSelectedComplexId('');
    setSelectedGender('');
    setSelectedLevel('');
    setSelectedCategory('');
    setSelectedDateFilter('');
    setSelectedDate('');
    setDateExpanded(false);
    setSearchTerm('');
    setSelectedMode('');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
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
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                onClick={() => router.push('/matches/new')}
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
              >
                {t('createMatch')}
              </Button>
              {user && (
                <button
                  onClick={() => setMyMatchesOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 hover:border-violet-500/50 rounded-xl transition-all duration-150"
                >
                  <CalendarDays className="w-4 h-4" />
                  Mis partidos
                </button>
              )}
            </div>
          </div>

          {/* Search + filter button */}
          <div className="mt-8 flex gap-3">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder={t('searchPlaceholder')}
                icon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/15 text-white placeholder-slate-400 focus:bg-white/15 focus:border-teal-400"
              />
            </div>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150',
                filtersOpen || activeFilterCount > 0
                  ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/30'
                  : 'bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible filter panel */}
          {filtersOpen && (
            <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deporte</span>
                <select value={selectedSportId} onChange={(e) => setSelectedSportId(e.target.value)} className={SELECT_CLASS}>
                  <option value="">Todos</option>
                  {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complejo</span>
                <select value={selectedComplexId} onChange={(e) => setSelectedComplexId(e.target.value)} className={SELECT_CLASS}>
                  <option value="">Todos</option>
                  {complexes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modo</span>
                <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value as any)} className={SELECT_CLASS}>
                  <option value="">Todos</option>
                  <option value={MatchMode.INDIVIDUAL}>Individual</option>
                  <option value={MatchMode.TEAM_VS_TEAM}>Parejas</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Género</span>
                <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className={SELECT_CLASS}>
                  <option value="">Cualquiera</option>
                  {Object.values(MatchGender).map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nivel</span>
                <select value={selectedLevel} onChange={(e) => { setSelectedLevel(e.target.value); if (e.target.value) setSelectedCategory(''); }} className={SELECT_CLASS}>
                  <option value="">Cualquiera</option>
                  {Object.values(SkillLevel).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</span>
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); if (e.target.value) setSelectedLevel(''); }} className={SELECT_CLASS}>
                  <option value="">Cualquiera</option>
                  {Object.values(MatchCategory).map((cat) => <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-1.5">
                <button
                  onClick={() => setDateExpanded((v) => !v)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-150 whitespace-nowrap',
                    (selectedDateFilter || selectedDate)
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                  )}
                >
                  Fecha
                  <ChevronRight className={cn('w-3 h-3 transition-transform duration-200', dateExpanded && 'rotate-90')} />
                </button>
                <div className={cn(
                  'flex items-center gap-1.5 overflow-hidden transition-all duration-200',
                  dateExpanded ? 'max-w-[600px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
                )}>
                  {(['today', 'thisWeek', 'thisMonth'] as const).map((val) => {
                    const label = val === 'today' ? 'Hoy' : val === 'thisWeek' ? 'Esta semana' : 'Este mes';
                    const active = selectedDateFilter === val && !selectedDate;
                    return (
                      <button
                        key={val}
                        onClick={() => { setSelectedDateFilter(active ? '' : val); setSelectedDate(''); }}
                        className={cn(
                          'px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-150 whitespace-nowrap',
                          active
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedDateFilter(''); }}
                    className={cn(SELECT_CLASS, 'text-slate-300 [color-scheme:dark]')}
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="flex flex-col gap-1 justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded-xl transition-all duration-150"
                  >
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-slate-800 rounded-2xl border border-slate-700 py-24 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center mb-5 mx-auto">
              <Frown className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-100 mb-2">{t('noMatchesTitle')}</p>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">{t('noMatchesDesc')}</p>
            <Button onClick={() => router.push('/matches/new')} variant="primary" icon={<Plus className="w-4 h-4" />}>
              {t('createMatch')}
            </Button>
          </div>
        ) : (() => {
          const sorted = sortByRelevance(filtered, userStats, userGender);
          const recommendedIds = getRecommendedIds(filtered, userStats, userGender);
          const hasPersonalization = userStats.length > 0;
          return (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                {sorted.length} partidos disponibles
                {hasPersonalization && (
                  <span className="ml-2 text-teal-500 normal-case font-medium">· ordenados por relevancia</span>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sorted.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    sportName={sportNameById(match.sportId)}
                    recommended={recommendedIds.has(match.id)}
                  />
                ))}
              </div>
            </>
          );
        })()}
      </main>

      <MyMatchesDrawer
        open={myMatchesOpen}
        onClose={() => setMyMatchesOpen(false)}
        sports={sports}
      />
    </div>
  );
}
