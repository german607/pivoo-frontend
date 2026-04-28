'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Sport, SportComplex, SkillLevel } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Card, Input, Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function CreateMatchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, post } = useApi();
  const router = useRouter();
  const t = useTranslations('createMatch');
  const tc = useTranslations('common');

  const [sports, setSports] = useState<Sport[]>([]);
  const [complexes, setComplexes] = useState<SportComplex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sportId: '',
    complexId: '',
    courtId: '',
    date: '',
    time: '',
    maxPlayers: 4,
    minPlayers: 2,
    requiredLevel: '',
    description: '',
  });

  const timeSlots = Array.from({ length: 36 }, (_, i) => {
    const totalMinutes = 6 * 60 + i * 30;
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const m = String(totalMinutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [sportsData, complexesData] = await Promise.all([
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }),
      ]);

      setSports(sportsData || []);
      setComplexes(complexesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { date, time, ...rest } = formData;
      await post('/api/v1/matches', {
        ...rest,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        maxPlayers: parseInt(formData.maxPlayers.toString()),
        minPlayers: parseInt(formData.minPlayers.toString()),
        courtId: formData.courtId || null,
        requiredLevel: formData.requiredLevel || null,
        description: formData.description || null,
      }, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });

      router.push('/matches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el partido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedComplex = complexes.find((c) => c.id === formData.complexId);
  const courts = selectedComplex?.courts || [];

  if (authLoading || isLoading) {
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('sport')}</label>
              <select
                value={formData.sportId}
                onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">{t('sportPlaceholder')}</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('complex')}</label>
              <select
                value={formData.complexId}
                onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">{t('complexPlaceholder')}</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name} ({complex.city})
                  </option>
                ))}
              </select>
            </div>

            {courts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('court')}</label>
                <select
                  value={formData.courtId}
                  onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">{t('courtPlaceholder')}</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} {court.indoor ? `(${t('indoor')})` : `(${t('outdoor')})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time')}</label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">{t('timePlaceholder')}</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('minPlayers')}
                type="number"
                min="2"
                value={formData.minPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, minPlayers: parseInt(e.target.value) })
                }
              />
              <Input
                label={t('maxPlayers')}
                type="number"
                min="2"
                value={formData.maxPlayers}
                onChange={(e) =>
                  setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('requiredLevel')}
              </label>
              <select
                value={formData.requiredLevel}
                onChange={(e) => setFormData({ ...formData, requiredLevel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('noLevel')}</option>
                <option value="BEGINNER">{t('beginner')}</option>
                <option value="INTERMEDIATE">{t('intermediate')}</option>
                <option value="ADVANCED">{t('advanced')}</option>
                <option value="PROFESSIONAL">{t('professional')}</option>
              </select>
            </div>

            <Input
              label={t('description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
                {t('submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
