'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Sport, SportComplex, SkillLevel, MatchCategory, MatchGender, MatchMode, MatchTemplate } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, MapPin, LayoutTemplate } from 'lucide-react';

const SELECT_CLS = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed';
const INPUT_CLS  = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500';
const LABEL_CLS  = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2';

const LEVEL_OPTS = [
  { value: `level:${SkillLevel.BEGINNER}`,      label: 'Principiante' },
  { value: `level:${SkillLevel.INTERMEDIATE}`,  label: 'Intermedio' },
  { value: `level:${SkillLevel.ADVANCED}`,      label: 'Avanzado' },
  { value: `level:${SkillLevel.PROFESSIONAL}`,  label: 'Profesional' },
];
const CAT_OPTS = Object.values(MatchCategory).map((c) => ({
  value: `cat:${c}`,
  label: c.charAt(0) + c.slice(1).toLowerCase(),
}));

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [templates, setTemplates] = useState<MatchTemplate[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const [complexMode, setComplexMode] = useState<'registered' | 'custom'>('registered');
  const [matchMode, setMatchMode] = useState<MatchMode>(MatchMode.INDIVIDUAL);
  const [partnerId, setPartnerId] = useState('');
  const [formData, setFormData] = useState({
    sportId: '',
    complexId: '',
    complexName: '',
    courtId: '',
    date: '',
    time: '',
    maxPlayers: 4,
    minPlayers: 4,
    requirementValue: '', // 'level:BEGINNER' | 'cat:PRIMERA' | ''
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
    if (!authLoading && !user) { router.push('/login'); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [sportsData, complexesData, templatesData] = await Promise.all([
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }),
        get<MatchTemplate[]>('/api/v1/matches/templates', { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL }).catch(() => []),
      ]);
      setSports(sportsData || []);
      setComplexes(complexesData || []);
      setTemplates(templatesData || []);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const applyTemplate = (tpl: MatchTemplate) => {
    const sport = sports.find((s) => s.id === tpl.sportId);
    setFormData((f) => ({
      ...f,
      sportId: tpl.sportId,
      complexId: tpl.complexId ?? '',
      complexName: tpl.complexName ?? '',
      courtId: tpl.courtId ?? '',
      maxPlayers: tpl.maxPlayers,
      minPlayers: tpl.minPlayers,
      requirementValue: tpl.requiredLevel ? `level:${tpl.requiredLevel}` : tpl.requiredCategory ? `cat:${tpl.requiredCategory}` : '',
      gender: tpl.gender ?? '',
      description: tpl.description ?? '',
    }));
    if (tpl.complexId) setComplexMode('registered');
    else if (tpl.complexName) setComplexMode('custom');
    if (sport) setFormData((f) => ({ ...f, sportId: tpl.sportId, maxPlayers: tpl.maxPlayers, minPlayers: tpl.minPlayers }));
    setTemplateOpen(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !formData.sportId) return;
    setSavingTemplate(true);
    try {
      const { requirementValue, complexId, complexName, date, time, ...rest } = formData;
      const requiredLevel  = requirementValue.startsWith('level:') ? requirementValue.slice(6) : undefined;
      const requiredCategory = requirementValue.startsWith('cat:') ? requirementValue.slice(4) : undefined;
      const newTpl = await post<MatchTemplate>('/api/v1/matches/templates', {
        name: templateName.trim(),
        sportId: formData.sportId,
        ...(complexMode === 'registered' && complexId ? { complexId } : {}),
        ...(complexMode === 'custom' && complexName ? { complexName } : {}),
        maxPlayers: rest.maxPlayers,
        minPlayers: rest.minPlayers,
        ...(requiredLevel ? { requiredLevel } : {}),
        ...(requiredCategory ? { requiredCategory } : {}),
        ...(rest.gender ? { gender: rest.gender } : {}),
        ...(rest.description ? { description: rest.description } : {}),
      }, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      setTemplates((prev) => [...prev, newTpl]);
      setTemplateName('');
    } catch { /* ignore */ }
    finally { setSavingTemplate(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { date, time, requirementValue, complexId, complexName, ...rest } = formData;
      const [y, mo, d] = date.split('-').map(Number);
      const [h, mi] = time.split(':').map(Number);
      const isPairs = matchMode === MatchMode.TEAM_VS_TEAM;

      const requiredLevel  = requirementValue.startsWith('level:') ? requirementValue.slice(6) : undefined;
      const requiredCategory = requirementValue.startsWith('cat:')  ? requirementValue.slice(4) : undefined;

      if (!requiredLevel && !requiredCategory) {
        setError('Elegí un nivel o categoría requerida');
        return;
      }

      await post('/api/v1/matches', {
        ...rest,
        scheduledAt: new Date(y, mo - 1, d, h, mi, 0).toISOString(),
        maxPlayers: isPairs ? 4 : rest.maxPlayers,
        minPlayers: isPairs ? 4 : rest.minPlayers,
        ...(complexMode === 'registered' && complexId ? { complexId } : {}),
        ...(complexMode === 'custom'     && complexName ? { complexName } : {}),
        courtId: formData.courtId || null,
        ...(requiredLevel    ? { requiredLevel }    : {}),
        ...(requiredCategory ? { requiredCategory } : {}),
        gender: formData.gender || null,
        description: formData.description || null,
        mode: matchMode,
        ...(isPairs && partnerId.trim() ? { partnerId: partnerId.trim() } : {}),
      }, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });

      router.push('/matches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el partido');
    } finally {
      setIsSubmitting(false); }
  };

  const selectedComplex = complexes.find((c) => c.id === formData.complexId);
  const courts = selectedComplex?.courts ?? [];
  const selectedSport = sports.find((s) => s.id === formData.sportId);
  const playerOptions = selectedSport
    ? Array.from({ length: selectedSport.maxPlayers - selectedSport.minPlayers + 1 }, (_, i) => selectedSport.minPlayers + i)
    : [];

  // Summary shown on accordion when collapsed
  const advancedSummary = [
    formData.complexId ? complexes.find((c) => c.id === formData.complexId)?.name : formData.complexName || null,
    formData.gender ? ({ MASCULINO: 'Masculino', FEMENINO: 'Femenino', MIXTO: 'Mixto' }[formData.gender] ?? null) : null,
    matchMode !== MatchMode.TEAM_VS_TEAM ? `${formData.maxPlayers} jugadores` : null,
    formData.description ? 'Con descripción' : null,
  ].filter(Boolean).join(' · ');

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

      <main className="max-w-lg mx-auto px-5 py-12">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 shadow-[0_2px_16px_rgba(0,0,0,0.4)] overflow-hidden">

          {/* Header */}
          <div className="h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
          <div className="px-7 pt-7 pb-6">
            <h1 className="text-xl font-black text-white">{t('title')}</h1>
            <p className="text-sm text-slate-400 mt-1">Los campos marcados son obligatorios.</p>
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div className="px-7 pb-5 border-b border-slate-700/60">
              <button
                type="button"
                onClick={() => setTemplateOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              >
                <LayoutTemplate className="w-4 h-4" />
                Cargar plantilla
                {templateOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
              </button>
              {templateOpen && (
                <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {templates.map((tpl) => {
                    const sportName = sports.find((s) => s.id === tpl.sportId)?.name ?? tpl.sportId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <LayoutTemplate className="w-4 h-4 text-teal-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tpl.name}</p>
                          <p className="text-xs text-slate-500 truncate">{sportName} · {tpl.maxPlayers} jugadores</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-5">

            {/* Sport */}
            <div>
              <label className={LABEL_CLS}>{t('sport')} <span className="text-teal-400">*</span></label>
              <select
                value={formData.sportId}
                onChange={(e) => {
                  const sport = sports.find((s) => s.id === e.target.value);
                  const n = sport?.maxPlayers ?? 4;
                  setFormData((f) => ({ ...f, sportId: e.target.value, maxPlayers: n, minPlayers: n }));
                }}
                className={SELECT_CLS}
                required
              >
                <option value="">{t('sportPlaceholder')}</option>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className={LABEL_CLS}>{t('modeLabel')} <span className="text-teal-400">*</span></label>
              <div className="grid grid-cols-2 rounded-xl border border-slate-600 overflow-hidden">
                {([MatchMode.INDIVIDUAL, MatchMode.TEAM_VS_TEAM] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMatchMode(m)}
                    className={`py-2.5 text-sm font-semibold transition-colors ${matchMode === m ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                  >
                    {m === MatchMode.INDIVIDUAL ? t('modeIndividual') : 'Parejas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Partner — Pairs only */}
            {matchMode === MatchMode.TEAM_VS_TEAM && (
              <div>
                <label className={LABEL_CLS}>{t('partnerLabel')}</label>
                <input
                  type="text"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder={t('partnerPlaceholder')}
                  className={INPUT_CLS}
                />
                <p className="mt-1.5 text-xs text-slate-500">{t('pairsNote')}</p>
              </div>
            )}

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>{t('date')} <span className="text-teal-400">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                  className={INPUT_CLS + ' [color-scheme:dark]'}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLS}>{t('time')} <span className="text-teal-400">*</span></label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))}
                  className={SELECT_CLS}
                  required
                >
                  <option value="">{t('timePlaceholder')}</option>
                  {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>

            {/* Level / Category — unified optgroup select */}
            <div>
              <label className={LABEL_CLS}>{t('participationReq')} <span className="text-teal-400">*</span></label>
              <select
                value={formData.requirementValue}
                onChange={(e) => setFormData((f) => ({ ...f, requirementValue: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">— Elegí nivel o categoría —</option>
                <optgroup label="Por nivel">
                  {LEVEL_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
                <optgroup label="Por categoría">
                  {CAT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              </select>
            </div>

            {/* ── Advanced options accordion ─────────────────── */}
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700/80 transition-colors text-left"
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-300">Opciones avanzadas</span>
                  {!advancedOpen && advancedSummary && (
                    <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {advancedSummary}
                    </p>
                  )}
                  {!advancedOpen && !advancedSummary && (
                    <p className="text-xs text-slate-600 mt-0.5">Complejo, género, descripción...</p>
                  )}
                </div>
                {advancedOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {advancedOpen && (
                <div className="px-4 py-4 space-y-5 border-t border-slate-700">

                  {/* Complex */}
                  <div>
                    <label className={LABEL_CLS}>{t('complex')}</label>
                    <div className="grid grid-cols-2 rounded-xl border border-slate-600 overflow-hidden mb-2">
                      {(['registered', 'custom'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setComplexMode(mode);
                            setFormData((f) => mode === 'registered'
                              ? { ...f, complexName: '' }
                              : { ...f, complexId: '', courtId: '' });
                          }}
                          className={`py-2 text-sm font-medium transition-colors ${complexMode === mode ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        >
                          {mode === 'registered' ? t('complexRegistered') : t('complexOther')}
                        </button>
                      ))}
                    </div>
                    {complexMode === 'registered' ? (
                      <select
                        value={formData.complexId}
                        onChange={(e) => setFormData((f) => ({ ...f, complexId: e.target.value }))}
                        className={SELECT_CLS}
                      >
                        <option value="">{t('complexPlaceholder')}</option>
                        {complexes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.complexName}
                        onChange={(e) => setFormData((f) => ({ ...f, complexName: e.target.value }))}
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
                        onChange={(e) => setFormData((f) => ({ ...f, courtId: e.target.value }))}
                        className={SELECT_CLS}
                      >
                        <option value="">{t('courtPlaceholder')}</option>
                        {courts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.indoor ? `(${t('indoor')})` : `(${t('outdoor')})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Players — Individual only */}
                  {matchMode !== MatchMode.TEAM_VS_TEAM && (
                    <div>
                      <label className={LABEL_CLS}>{t('totalPlayers')}</label>
                      <select
                        value={formData.maxPlayers}
                        onChange={(e) => {
                          const n = parseInt(e.target.value);
                          setFormData((f) => ({ ...f, maxPlayers: n, minPlayers: n }));
                        }}
                        className={SELECT_CLS}
                        disabled={!selectedSport}
                      >
                        {!selectedSport && <option value="">{t('selectSportFirst')}</option>}
                        {playerOptions.map((n) => <option key={n} value={n}>{t('nPlayers', { count: n })}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Gender */}
                  <div>
                    <label className={LABEL_CLS}>{t('gender')}</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value }))}
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
                      onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                      placeholder={t('descriptionPlaceholder')}
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* Save as template */}
                  {formData.sportId && (
                    <div className="pt-1 border-t border-slate-700/60">
                      <label className={LABEL_CLS + ' flex items-center gap-1.5'}>
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        Guardar como plantilla
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder='Nombre de la plantilla (ej. "Pádel martes")'
                          className={INPUT_CLS}
                        />
                        <button
                          type="button"
                          onClick={handleSaveTemplate}
                          disabled={!templateName.trim() || savingTemplate}
                          className="px-3 py-2.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                        >
                          {savingTemplate ? '...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
                {t('submit')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
                {t('cancel')}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
