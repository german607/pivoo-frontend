'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Match, Sport, SportComplex } from '@pivoo/shared';
import { MatchCard } from '@/components/MatchCard';
import { Header } from '@/components/Header';
import { Input, Button, Skeleton } from '@/components/ui';
import { Plus, Search } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const t = useTranslations('matches');
  const tc = useTranslations('common');

  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      loadSports();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      loadMatches();
    }
  }, [selectedSportId, authLoading, user]);

  const loadSports = async () => {
    try {
      const data = await get<Sport[]>('/api/v1/sports', {
        baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL,
      });
      setSports(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const query = selectedSportId ? `?sportId=${selectedSportId}` : '';
      const [data, complexes] = await Promise.all([
        get<Match[]>(`/api/v1/matches${query}`, {
          baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL,
        }),
        get<SportComplex[]>('/api/v1/complexes', {
          baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL,
        }),
      ]);
      const complexMap = new Map((complexes || []).map((c) => [c.id, c]));
      const enriched = (data || []).map((m) => {
        const c = complexMap.get(m.complexId);
        return c ? { ...m, complex: { name: c.name, city: c.city } } : m;
      });
      setMatches(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sportNameById = (id: string) =>
    sports.find((s) => s.id === id)?.name ?? '';

  const filteredMatches = matches.filter((match) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const sportName = sportNameById(match.sportId).toLowerCase();
    const desc = (match.description ?? '').toLowerCase();
    const complex = match.complex ? `${match.complex.name} ${match.complex.city}`.toLowerCase() : '';
    return sportName.includes(term) || desc.includes(term) || complex.includes(term);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">{tc('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
          <Button
            onClick={() => router.push('/matches/new')}
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
          >
            {t('createMatch')}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder={t('searchPlaceholder')}
              icon={<Search className="w-5 h-5" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSportId('')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedSportId === ''
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {t('filterAll')}
            </button>
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSportId(sport.id)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedSportId === sport.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 font-medium mb-2">{t('noMatchesTitle')}</p>
            <p className="text-gray-500 mb-6">{t('noMatchesDesc')}</p>
            <Button
              onClick={() => router.push('/matches/new')}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              {t('createMatch')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                sportName={sportNameById(match.sportId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
