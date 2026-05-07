'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Sport, SportComplex, SkillLevel, MatchCategory, MatchGender } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

const SELECT_CLS = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed';
const INPUT_CLS  = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500';
const LABEL_CLS  = 'block text-sm font-medium text-slate-300 mb-2';

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

  const [complexMode, setComplexMode] = useState<'registered' | 'custom'>('registered');
  const [filterType, setFilterType] = useState<'level' | 'category'>('level');
  const [formData, setFormData] = useState({
    sportId: '',
    complexId: '',
    complexName: '',
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
      const { date, time, requiredLevel, requiredCategory, complexId, complexName, ...rest } = formData;
      const [y, mo, d] = date.split('-').map(Number);
      const [h, mi] = time.split(':').map(Number);
      await post('/api/v1/matches', {
        ...rest,
        scheduledAt: new Date(y, mo - 1, d, h, mi, 0).toISOString(),
        maxPlayers: parseInt(formData.maxPlayers.toString()),
        minPlayers: parseInt(formData.minPlayers.toString()),
        ...(complexMode === 'registered' && complexId ? { complexId } : {}),
        ...(complexMode === 'custom' && complexName ? { complexName } : {}),
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
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-400">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.3)] p-8">
          <h1 className="text-2xl font-bold text-white mb-8">{t('title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Sport */}
            <div>
              <label className={LABEL_CLS}>{t('sport')}</label>
              <select
                value={formData.sportId}
                onChange={(e) => {
                  const sport = sports.find((s) => s.id === e.target.value);
                  const defaultPlayers = sport ? sport.maxPlayers : 2;
                  setFormData({ ...formData, sportId: e.target.value, maxPlayers: defaultPlayers, minPlayers: defaultPlayers });
                }}
                className={SELECT_CLS}
                required
              >
                <option value="">{t('sportPlaceholder')}</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
            </div>

            {/* Complex */}
            <div>
              <label className={LABEL_CLS}>{t('complex')}</label>
              <div className="flex rounded-lg border border-slate-600 overflow-hidden mb-2">
                <button
                  type="button"
                  onClick={() => { setComplexMode('registered'); setFormData((f) => ({ ...f, complexName: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${complexMode === 'registered' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {t('complexRegistered')}
                </button>
                <button
                  type="button"
                  onClick={() => { setComplexMode('custom'); setFormData((f) => ({ ...f, complexId: '', courtId: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${complexMode === 'custom' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {t('complexOther')}
                </button>
              </div>
              {complexMode === 'registered' ? (
                <select
                  value={formData.complexId}
                  onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">{t('complexPlaceholder')}</option>
                  {complexes.map((complex) => (
                    <option key={complex.id} value={complex.id}>
                      {complex.name} ({complex.city})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.complexName}
                  onChange={(e) => setFormData({ ...formData, complexName: e.target.value })}
                  placeholder={t('complexCustomPlaceholder')}
                  className={INPUT_CLS}
                />
              )}
            </div>

            {/* Court */}
            {courts.length > 0 && (
              <div>
                <label className={LABEL_CLS}>{t('court')}</label>
                <select
                  value={formData.courtId}
                  onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                  className={SELECT_CLS}
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

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>{t('date')}</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={INPUT_CLS + ' [color-scheme:dark]'}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLS}>{t('time')}</label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={SELECT_CLS}
                  required
                >
                  <option value="">{t('timePlaceholder')}</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>{t('totalPlayers')}</label>
                <select
                  value={formData.maxPlayers}
                  onChange={(e) => {
                    const n = parseInt(e.target.value);
                    setFormData({ ...formData, maxPlayers: n, minPlayers: n });
                  }}
                  className={SELECT_CLS}
                  required
                  disabled={!selectedSport}
                >
                  {!selectedSport && <option value="">{t('selectSportFirst')}</option>}
                  {playerOptions.map((n) => (
                    <option key={n} value={n}>{t('nPlayers', { count: n })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>{t('spotsNeeded')}</label>
                <select
                  disabled={!selectedSport}
                  className={SELECT_CLS}
                >
                  {!selectedSport && <option value="">—</option>}
                  {Array.from({ length: formData.maxPlayers - 1 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{t('nPlayers', { count: n })}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participation requirement */}
            <div>
              <label className={LABEL_CLS}>{t('participationReq')}</label>
              <div className="flex rounded-lg border border-slate-600 overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => { setFilterType('level'); setFormData((f) => ({ ...f, requiredCategory: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${filterType === 'level' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {t('byLevel')}
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterType('category'); setFormData((f) => ({ ...f, requiredLevel: '' })); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${filterType === 'category' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {t('byCategory')}
                </button>
              </div>
              {filterType === 'level' ? (
                <select
                  value={formData.requiredLevel}
                  onChange={(e) => setFormData({ ...formData, requiredLevel: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">{t('noLevelReq')}</option>
                  <option value={SkillLevel.BEGINNER}>{t('levelBeginner')}</option>
                  <option value={SkillLevel.INTERMEDIATE}>{t('levelIntermediate')}</option>
                  <option value={SkillLevel.ADVANCED}>{t('levelAdvanced')}</option>
                  <option value={SkillLevel.PROFESSIONAL}>{t('levelProfessional')}</option>
                </select>
              ) : (
                <select
                  value={formData.requiredCategory}
                  onChange={(e) => setFormData({ ...formData, requiredCategory: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">{t('noCategoryReq')}</option>
                  {Object.values(MatchCategory).map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className={LABEL_CLS}>{t('gender')}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={SELECT_CLS}
              >
                <option value="">{t('noGenderReq')}</option>
                <option value={MatchGender.MASCULINO}>{t('genderMale')}</option>
                <option value={MatchGender.FEMENINO}>{t('genderFemale')}</option>
                <option value={MatchGender.MIXTO}>{t('genderMixed')}</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={LABEL_CLS}>{t('description')}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                className={INPUT_CLS}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-2">
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
        </div>
      </main>
    </div>
  );
}
