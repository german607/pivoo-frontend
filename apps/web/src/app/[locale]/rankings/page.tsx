'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { User, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

export default function RankingsPage() {
  const { isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('rankings');
  const tc = useTranslations('common');

  const [rankings, setRankings] = useState<(User & { rank: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'TENNIS');

  useEffect(() => {
    if (!authLoading) {
      loadRankings();
    }
  }, [authLoading, selectedSport]);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const data = await get<User[]>(
        `/api/v1/users/rankings?sportId=${selectedSport}&limit=50`,
        { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL }
      );

      const withRank = (data || []).map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      setRankings(withRank);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <div className="flex gap-4">
            {['TENNIS', 'PADEL'].map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSport === sport
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">{t('loadingRankings')}</p>
          </div>
        ) : rankings.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center">{t('noRankings')}</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-900">{t('colRank')}</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">{t('colPlayer')}</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900">{t('colMatches')}</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900">{t('colWon')}</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900">{t('colPoints')}</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">{t('colLevel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((user) => {
                    const stat = user.sportStats?.find((s) => s.sportId === selectedSport);
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-lg text-green-600">{user.rank}</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => router.push(`/users/${user.id}`)}
                            className="hover:underline text-gray-900 font-medium"
                          >
                            {user.name || user.username}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {stat?.matchesPlayed || 0}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {stat?.matchesWon || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                          {stat?.rankingPoints || 1000}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {stat ? SKILL_LEVEL_LABELS[stat.level] : 'BEGINNER'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
