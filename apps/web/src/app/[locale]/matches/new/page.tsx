'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Sport, SportComplex, SkillLevel, MatchCategory, MatchGender } from '@pivoo/shared';
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

  const [filterType, setFilterType] = useState<'level' | 'category'>('level');
  const [formData, setFormData] = useState({
    sportId: '',
    complexId: '',
    courtId: '',
    date: '',
    time: '',
    maxPlayers: 4,
    minPlayers: 2,
    requiredLevel: '',
    requiredCategory: '',
    gender: '',
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
      const { date, time, requiredLevel, requiredCategory, ...rest } = formData;
      const [y, mo, d] = date.split('-').map(Number);
      const [h, mi] = time.split(':').map(Number);
      await post('/api/v1/matches', {
        ...rest,
        scheduledAt: new Date(y, mo - 1, d, h, mi, 0).toISOString(),
        maxPlayers: parseInt(formData.maxPlayers.toString()),
        minPlayers: parseInt(formData.minPlayers.toString()),
        courtId: formData.courtId || null,
        ...(requiredLevel ? { requiredLevel } : {}),
        ...(requiredCategory ? { requiredCategory } : {}),
        gender: formData.gender || null,
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
  const selectedSport = sports.find((s) => s.id === formData.sportId);
  const playerOptions = selectedSport
    ? Array.from({ length: selectedSport.maxPlayers - selectedSport.minPlayers + 1 }, (_, i) => selectedSport.minPlayers + i)
    : [];

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
                onChange={(e) => {
                  const sport = sports.find((s) => s.id === e.target.value);
                  const defaultPlayers = sport ? sport.maxPlayers : 2;
                  setFormData({ ...formData, sportId: e.target.value, maxPlayers: defaultPlayers, minPlayers: defaultPlayers });
                }}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jugadores totales</label>
                <select
                  value={formData.maxPlayers}
                  onChange={(e) => {
                    const n = parseInt(e.target.value);
                    setFormData({ ...formData, maxPlayers: n, minPlayers: n });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                  required
                  disabled={!selectedSport}
                >
                  {!selectedSport && <option value="">Seleccioná un deporte primero</option>}
                  {playerOptions.map((n) => (
                    <option key={n} value={n}>{n} jugadores</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jugadores que faltan</label>
                <select
                  disabled={!selectedSport}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {!selectedSport && <option value="">—</option>}
                  {Array.from({ length: formData.maxPlayers - 1 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n === 1 ? '1 jugador' : `${n} jugadores`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nivel / Categoría toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requisito de participación</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => { setFilterType('level'); setFormData((f) => ({ ...f, requiredCategory: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${filterType === 'level' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Por nivel
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterType('category'); setFormData((f) => ({ ...f, requiredLevel: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${filterType === 'category' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Por categoría
                </button>
              </div>
              {filterType === 'level' ? (
                <select
                  value={formData.requiredLevel}
                  onChange={(e) => setFormData({ ...formData, requiredLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sin requisito de nivel</option>
                  <option value={SkillLevel.BEGINNER}>Principiante</option>
                  <option value={SkillLevel.INTERMEDIATE}>Intermedio</option>
                  <option value={SkillLevel.ADVANCED}>Avanzado</option>
                  <option value={SkillLevel.PROFESSIONAL}>Profesional</option>
                </select>
              ) : (
                <select
                  value={formData.requiredCategory}
                  onChange={(e) => setFormData({ ...formData, requiredCategory: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sin requisito de categoría</option>
                  {Object.values(MatchCategory).map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin restricción de género</option>
                <option value={MatchGender.MASCULINO}>Masculino</option>
                <option value={MatchGender.FEMENINO}>Femenino</option>
                <option value={MatchGender.MIXTO}>Mixto</option>
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
