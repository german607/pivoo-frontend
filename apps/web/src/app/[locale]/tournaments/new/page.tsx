'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Sport, TournamentFormat, UserRole } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Input, Button, Card } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Trophy } from 'lucide-react';

interface RankingRow {
  position: number;
  points: number;
}

export default function CreateTournamentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, put } = useApi();
  const router = useRouter();
  const t = useTranslations('createTournament');

  const [sports, setSports] = useState<Sport[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sportId: '',
    format: TournamentFormat.SINGLE_ELIMINATION,
    maxParticipants: 8,
    registrationDeadline: '',
    startDate: '',
    description: '',
  });

  const [rankingConfig, setRankingConfig] = useState<RankingRow[]>([
    { position: 1, points: 100 },
    { position: 2, points: 60 },
    { position: 3, points: 40 },
    { position: 4, points: 20 },
  ]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== UserRole.COMPLEX) { router.push('/tournaments'); return; }
      loadSports();
    }
  }, [user, authLoading]);

  const loadSports = async () => {
    try {
      const data = await get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL });
      setSports(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const setField = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addRankingRow = () => {
    const next = rankingConfig.length + 1;
    setRankingConfig((prev) => [...prev, { position: next, points: 0 }]);
  };

  const updateRankingRow = (index: number, points: number) => {
    setRankingConfig((prev) => prev.map((r, i) => (i === index ? { ...r, points } : r)));
  };

  const removeRankingRow = (index: number) => {
    setRankingConfig((prev) =>
      prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const TAPI = { baseUrl: process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL };
      const payload = {
        name: form.name,
        sportId: form.sportId,
        format: form.format,
        maxParticipants: form.maxParticipants,
        startDate: new Date(form.startDate).toISOString(),
        registrationDeadline: form.registrationDeadline
          ? new Date(form.registrationDeadline).toISOString()
          : undefined,
        description: form.description || undefined,
      };
      const created = await post<{ id: string }>('/api/v1/tournaments', payload, TAPI);
      // Set ranking points via separate PUT endpoint
      if (rankingConfig.length > 0) {
        await put(`/api/v1/tournaments/${created.id}/ranking-points`, { points: rankingConfig }, TAPI);
      }
      router.push(`/tournaments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el torneo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Información general</h2>
            <div className="space-y-4">
              <Input
                label={t('name')}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder={t('namePlaceholder')}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">{t('sport')} *</label>
                  <select
                    value={form.sportId}
                    onChange={(e) => setField('sportId', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">{t('sportPlaceholder')}</option>
                    {sports.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">{t('format')} *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setField('format', e.target.value as TournamentFormat)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value={TournamentFormat.SINGLE_ELIMINATION}>{t('formatSingleElim')}</option>
                    <option value={TournamentFormat.ROUND_ROBIN}>{t('formatRoundRobin')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{t('maxParticipants')} *</label>
                <input
                  type="number"
                  min={4}
                  max={128}
                  value={form.maxParticipants}
                  onChange={(e) => setField('maxParticipants', parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{t('description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none"
                />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Fechas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('registrationDeadline')}
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => setField('registrationDeadline', e.target.value)}
              />
              <Input
                label={t('startDate')}
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                required
              />
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('rankingConfig')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('rankingConfigDesc')}</p>

            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-semibold text-gray-500 uppercase px-1">
                <span>{t('position')}</span>
                <span>{t('points')}</span>
                <span />
              </div>
              {rankingConfig.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-sm">
                    {ordinal(row.position)}
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={row.points}
                    onChange={(e) => updateRankingRow(i, parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeRankingRow(i)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={addRankingRow}
            >
              {t('addPosition')}
            </Button>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push('/tournaments')}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} size="lg">
              {t('submit')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function ordinal(n: number) {
  const suffixes = ['º', 'º', 'º'];
  return `${n}${suffixes[Math.min(n - 1, 2)] ?? 'º'}`;
}
