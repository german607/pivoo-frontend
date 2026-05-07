'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import {
  User, Match, Sport, MatchStatus, Team,
  SkillLevel, MatchCategory, SKILL_LEVEL_LABELS,
} from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Input, Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
  MapPin, Clock, Users, Trophy, Plus, Minus,
  CheckCircle2, XCircle, Pencil, X, Check, Camera,
  Globe, Phone, CalendarDays,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { SportIcon, SPORT_EMOJI_STR } from '@/components/SportIcon';

// ── Constants ────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  OPEN:        'bg-violet-500/20 text-violet-300 border border-violet-400/30',
  FULL:        'bg-amber-500/20 text-amber-300 border border-amber-400/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
  COMPLETED:   'bg-slate-500/20 text-slate-300 border border-slate-400/30',
  CANCELLED:   'bg-red-500/20 text-red-300 border border-red-400/30',
};

const STATUS_KEY: Record<string, string> = {
  OPEN:        'matchStatusOpen',
  FULL:        'matchStatusFull',
  IN_PROGRESS: 'matchStatusInProgress',
  COMPLETED:   'matchStatusCompleted',
  CANCELLED:   'matchStatusCancelled',
};

const TEAM_KEY: Record<string, 'teamA' | 'teamB'> = { TEAM_A: 'teamA', TEAM_B: 'teamB' };
const TEAM_WINS_KEY: Record<string, 'teamAWins' | 'teamBWins'> = { TEAM_A: 'teamAWins', TEAM_B: 'teamBWins' };

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: 'Primera', SEGUNDA: 'Segunda', TERCERA: 'Tercera', CUARTA: 'Cuarta',
  QUINTA: 'Quinta', SEXTA: 'Sexta', SEPTIMA: 'Septima', OCTAVA: 'Octava',
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     'bg-slate-500/20 text-slate-300 border-slate-500/40',
  INTERMEDIATE: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ADVANCED:     'bg-amber-500/20 text-amber-300 border-amber-500/40',
  PROFESSIONAL: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};


const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras', 'México',
  'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay',
  'Venezuela', 'Puerto Rico',
  'Alemania', 'Australia', 'Austria', 'Bélgica', 'Canadá', 'China', 'Corea del Sur',
  'Croacia', 'Dinamarca', 'Estados Unidos', 'Finlandia', 'Francia', 'Grecia',
  'Hungría', 'India', 'Italia', 'Japón', 'Marruecos', 'Noruega', 'Nueva Zelanda',
  'Países Bajos', 'Polonia', 'Portugal', 'Reino Unido', 'República Checa',
  'Rumania', 'Rusia', 'Sudáfrica', 'Suecia', 'Suiza', 'Turquía', 'Ucrania',
].sort((a, b) => a.localeCompare(b, 'es'));

// ── CountrySelect ─────────────────────────────────────────────

function CountrySelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const filtered = query.trim()
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  const handleSelect = (country: string) => {
    onChange(country);
    setQuery(country);
    setOpen(false);
  };

  const handleBlurClear = () => {
    if (!COUNTRIES.includes(query)) {
      setQuery(value);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlurClear}
        placeholder={placeholder}
        autoComplete="off"
        className={DARK_INPUT}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-slate-700 border border-slate-600 rounded-xl shadow-xl py-1">
          {filtered.map((country) => (
            <li
              key={country}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(country); }}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer transition-colors',
                country === value
                  ? 'bg-teal-500/20 text-teal-300 font-semibold'
                  : 'text-slate-200 hover:bg-slate-600',
              )}
            >
              {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DARK_SELECT = 'w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-white rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 [color-scheme:dark]';
const DARK_INPUT  = 'w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30';

// ── BirthDatePicker ───────────────────────────────────────────

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function BirthDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const selYear  = parts[0] ?? '';
  const selMonth = parts[1] ?? '';
  const selDay   = parts[2] ?? '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const maxDay = selYear && selMonth
    ? daysInMonth(Number(selMonth), Number(selYear))
    : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const update = (y: string, m: string, d: string) => {
    if (!y && !m && !d) { onChange(''); return; }
    if (y && m && d) {
      const clamped = Math.min(Number(d), daysInMonth(Number(m), Number(y)));
      onChange(`${y}-${m.padStart(2, '0')}-${String(clamped).padStart(2, '0')}`);
    }
  };

  const SELECT = cn(DARK_SELECT, 'text-sm');

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={selDay} onChange={(e) => update(selYear, selMonth, e.target.value)} className={SELECT}>
        <option value="">Día</option>
        {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select value={selMonth} onChange={(e) => update(selYear, e.target.value, selDay)} className={SELECT}>
        <option value="">Mes</option>
        {months.map((m) => <option key={m} value={String(m)}>{MONTHS[m - 1]}</option>)}
      </select>
      <select value={selYear} onChange={(e) => update(e.target.value, selMonth, selDay)} className={SELECT}>
        <option value="">Año</option>
        {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  );
}

// ── Result form ──────────────────────────────────────────────

interface SetRow { teamAScore: string; teamBScore: string }

function ResultForm({ matchId, onSaved }: { matchId: string; onSaved: () => void }) {
  const { post } = useApi();
  const t = useTranslations('profile');
  const MAPI = { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL };
  const [sets, setSets] = useState<SetRow[]>([{ teamAScore: '', teamBScore: '' }]);
  const [winner, setWinner] = useState<Team | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateSet = (i: number, field: keyof SetRow, val: string) =>
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winner) { setError(t('selectWinner')); return; }
    const validSets = sets.filter((s) => s.teamAScore !== '' && s.teamBScore !== '');
    setSaving(true); setError('');
    try {
      await post(`/api/v1/matches/${matchId}/result`, {
        winnerTeam: winner,
        sets: validSets.map((s, i) => ({ setNumber: i + 1, teamAScore: Number(s.teamAScore), teamBScore: Number(s.teamBScore) })),
      }, MAPI);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700 space-y-4">
      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('saveResult')}</p>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
          <span>{t('setOptional')}</span>
          <span className="text-center">{t('teamAShort')}</span>
          <span className="text-center">{t('teamBShort')}</span>
        </div>
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-bold text-slate-400 pl-1">Set {i + 1}</span>
            <input type="number" min="0" value={s.teamAScore}
              onChange={(e) => updateSet(i, 'teamAScore', e.target.value)}
              className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500" placeholder="0" />
            <input type="number" min="0" value={s.teamBScore}
              onChange={(e) => updateSet(i, 'teamBScore', e.target.value)}
              className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500" placeholder="0" />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          {sets.length < 5 && (
            <button type="button" onClick={() => setSets((p) => [...p, { teamAScore: '', teamBScore: '' }])}
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium">
              <Plus className="w-3 h-3" /> {t('addSet')}
            </button>
          )}
          {sets.length > 1 && (
            <button type="button" onClick={() => setSets((p) => p.slice(0, -1))}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-medium ml-auto">
              <Minus className="w-3 h-3" /> {t('removeSet')}
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {([Team.TEAM_A, Team.TEAM_B] as const).map((team) => (
          <button key={team} type="button" onClick={() => setWinner(winner === team ? '' : team)}
            className={cn(
              'flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-150',
              winner === team ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400'
            )}>
            {t(TEAM_WINS_KEY[team])}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" variant="primary" isLoading={saving} className="w-full">{t('saveResult')}</Button>
    </form>
  );
}

// ── MyMatchCard ──────────────────────────────────────────────

function MyMatchCard({ match, sportName, isAdmin, onResultSaved }: {
  match: Match; sportName: string; isAdmin: boolean; onResultSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const t = useTranslations('profile');
  const now = new Date();
  const matchDate = new Date(match.scheduledAt);
  const isPast = matchDate < now;
  const canRecord = isAdmin && !match.result && match.status !== MatchStatus.CANCELLED;
  const statusCls = STATUS_CLS[match.status] ?? STATUS_CLS.OPEN;
  const statusText = STATUS_KEY[match.status] ? t(STATUS_KEY[match.status] as Parameters<typeof t>[0]) : match.status;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <SportIcon sport={sportName} className="w-5 h-[23px]" />
          <span className="text-sm font-bold text-white">{sportName}</span>
        </div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', statusCls)}>{statusText}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className={cn('text-xs font-medium', !isPast && 'text-teal-400')}>
            {matchDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {(match.complex?.name || match.complexName) && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">{match.complex?.name ?? match.complexName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs">{match.participants.length} / {match.maxPlayers} jugadores</span>
        </div>
        {match.result && (
          <div className="mt-2 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{t('winner')} {t(TEAM_KEY[match.result.winnerTeam])}</span>
            </div>
            {(match.result.sets as { setNumber: number; teamAScore: number; teamBScore: number }[]).length > 0 && (
              <div className="flex gap-2">
                {(match.result.sets as { setNumber: number; teamAScore: number; teamBScore: number }[]).map((s) => (
                  <div key={s.setNumber} className="flex flex-col items-center bg-slate-700/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Set {s.setNumber}</span>
                    <span className="text-sm font-black text-white">{s.teamAScore}–{s.teamBScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {canRecord && (
          <div className="mt-2 pt-3 border-t border-slate-700">
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors">
              {showForm ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {showForm ? t('cancel') : t('saveResult')}
            </button>
            {showForm && <ResultForm matchId={match.id} onSaved={() => { setShowForm(false); onResultSaved(); }} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SportStatCard ─────────────────────────────────────────────

function SportStatCard({ stat, sportName, onSaved }: {
  stat: User['sportStats'][number]; sportName: string; onSaved: () => void;
}) {
  const { patch } = useApi();
  const t = useTranslations('profile');
  const UAPI = { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL };
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState(stat.level);
  const [category, setCategory] = useState<string>(stat.category ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await patch(`/api/v1/users/me/stats/${stat.sportId}`, {
        level,
        ...(category ? { category } : { category: null }),
      }, UAPI);
      setEditing(false);
      onSaved();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setLevel(stat.level);
    setCategory(stat.category ?? '');
    setEditing(false);
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/50 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <SportIcon sport={sportName} className="w-6 h-[28px]" />
          <span className="text-sm font-bold text-white">{sportName}</span>
        </div>
        <button
          onClick={() => editing ? handleCancel() : setEditing(true)}
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150',
            editing
              ? 'text-slate-400 border-slate-600 hover:text-slate-200'
              : 'text-teal-400 border-teal-500/30 hover:border-teal-500/60 hover:text-teal-300'
          )}>
          {editing ? <><X className="w-3 h-3" /> {t('cancel')}</> : <><Pencil className="w-3 h-3" /> {t('editBtn')}</>}
        </button>
      </div>

      <div className="p-5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={cn('inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border', LEVEL_COLOR[stat.level])}>
            {SKILL_LEVEL_LABELS[stat.level] ?? stat.level}
          </span>
          {stat.category && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40">
              Cat. {CATEGORY_LABEL[stat.category] ?? stat.category}
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('matchesPlayed'), value: stat.matchesPlayed },
            { label: t('matchesWon'),   value: stat.matchesWon },
            { label: t('matchesLost'),  value: stat.matchesPlayed - stat.matchesWon },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-700/40 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Ranking bar */}
        <div className="mt-3 bg-slate-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">{t('rankingPoints')}</span>
          <span className="text-base font-black text-teal-400">{stat.rankingPoints} pts</span>
        </div>

        {/* Inline edit form */}
        {editing && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('levelLabel')}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as SkillLevel)} className={DARK_SELECT}>
                {Object.values(SkillLevel).map((l) => (
                  <option key={l} value={l}>{SKILL_LEVEL_LABELS[l] ?? l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('categoryLabel')} <span className="font-normal normal-case text-slate-500">{t('categoryOptional')}</span>
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={DARK_SELECT}>
                <option value="">{t('noCategory')}</option>
                {Object.values(MatchCategory).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-xl transition-colors duration-150 disabled:opacity-60">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Check className="w-4 h-4" /> {t('saveChanges')}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AddSportCard ─────────────────────────────────────────────

function AddSportCard({ availableSports, onSaved }: { availableSports: Sport[]; onSaved: () => void }) {
  const { patch } = useApi();
  const t = useTranslations('profile');
  const UAPI = { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL };
  const [open, setOpen] = useState(false);
  const [sportId, setSportId] = useState('');
  const [level, setLevel] = useState<SkillLevel>(SkillLevel.BEGINNER);
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!sportId) return;
    setSaving(true);
    try {
      await patch(`/api/v1/users/me/stats/${sportId}`, { level, ...(category ? { category } : {}) }, UAPI);
      setOpen(false); setSportId(''); setLevel(SkillLevel.BEGINNER); setCategory('');
      onSaved();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800/60 border border-dashed border-slate-600 hover:border-teal-500/60 hover:bg-slate-800 text-slate-400 hover:text-teal-400 rounded-2xl text-sm font-semibold transition-all duration-150">
        <Plus className="w-4 h-4" /> {t('addSport')}
      </button>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl border border-teal-500/30 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/50 border-b border-slate-700/60">
        <span className="text-sm font-bold text-white">{t('addSport')}</span>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('sportLabel')}</label>
          <select value={sportId} onChange={(e) => setSportId(e.target.value)} className={DARK_SELECT}>
            <option value="">{t('selectSport')}</option>
            {availableSports.map((s) => (
              <option key={s.id} value={s.id}>{SPORT_EMOJI_STR[s.name] ?? ''} {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('levelLabel')}</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as SkillLevel)} className={DARK_SELECT}>
            {Object.values(SkillLevel).map((l) => (
              <option key={l} value={l}>{SKILL_LEVEL_LABELS[l] ?? l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('categoryLabel')} <span className="font-normal normal-case text-slate-500">{t('categoryOptional')}</span>
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={DARK_SELECT}>
            <option value="">{t('noCategory')}</option>
            {Object.values(MatchCategory).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={!sportId || saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-xl transition-colors duration-150 disabled:opacity-50">
          {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> {t('save')}</>}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, patch, upload } = useApi();
  const router = useRouter();
  const t = useTranslations('profile');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<'profile' | 'matches'>('profile');
  const [profile, setProfile] = useState<User | null>(null);
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', country: '', city: '', phone: '', birthDate: '' });
  const [setupData, setSetupData] = useState({ username: '', name: '' });
  const [setupError, setSetupError] = useState('');

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadProfile();
  }, [user, authLoading]);

  useEffect(() => {
    if (activeTab === 'matches' && !matchesLoaded && user) loadMatches();
  }, [activeTab, user]);

  const loadProfile = async () => {
    try {
      const [userData, sportsData] = await Promise.all([
        get<User>('/api/v1/users/me', { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL }),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
      ]);
      setProfile(userData);
      setAllSports(sportsData || []);
      setProfileNotFound(false);
      setFormData({
        name: userData.name || '',
        bio: userData.bio || '',
        country: userData.country || '',
        city: userData.city || '',
        phone: userData.phone || '',
        birthDate: userData.birthDate ? userData.birthDate.slice(0, 10) : '',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no encontrado')) {
        setProfileNotFound(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const [matchData, sportData, complexData] = await Promise.all([
        get<Match[]>('/api/v1/matches/mine', { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL }),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
        get<{ id: string; name: string; city: string }[]>('/api/v1/complexes', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }),
      ]);
      if (sportData && allSports.length === 0) setAllSports(sportData);
      const complexMap = new Map((complexData || []).map((c) => [c.id, c]));
      setMatches((matchData || []).map((m) => {
        const c = m.complexId ? complexMap.get(m.complexId) : undefined;
        return c ? { ...m, complex: { name: c.name, city: c.city } } : m;
      }));
      setMatchesLoaded(true);
    } catch { /* ignore */ }
    finally { setMatchesLoading(false); }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true); setSetupError('');
    try {
      await post('/api/v1/users', { email: user.email, username: setupData.username.trim(), name: setupData.name.trim() },
        { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setProfileNotFound(false);
      await loadProfile();
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Error al crear el perfil');
    } finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name || undefined,
        bio: formData.bio || undefined,
        country: formData.country || undefined,
        city: formData.city || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
      };
      await patch('/api/v1/users/me', payload, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setIsEditing(false);
      await loadProfile();
    } catch { /* ignore */ }
    finally { setIsSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await upload('/api/v1/users/me/avatar', form, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      await loadProfile();
    } catch { /* ignore */ }
    finally { setIsUploadingAvatar(false); }
  };

  const sportNameById = (id: string) => allSports.find((s) => s.id === id)?.name ?? id;
  const missingSports = allSports.filter((s) => !profile?.sportStats.some((st) => st.sportId === s.id));

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // ── Loading / setup ──────────────────────────────────────

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (profileNotFound) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <main className="max-w-md mx-auto px-6 py-12">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <h1 className="text-xl font-bold text-white mb-1">{t('setupTitle')}</h1>
            <p className="text-slate-400 text-sm mb-6">{t('setupSubtitle')}</p>
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('usernameLabel')}</label>
                <input value={setupData.username} onChange={(e) => setSetupData({ ...setupData, username: e.target.value })}
                  placeholder={t('usernamePlaceholder')} required className={DARK_INPUT} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('fullNameLabel')}</label>
                <input value={setupData.name} onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                  placeholder={t('fullNamePlaceholder')} required className={DARK_INPUT} />
              </div>
              {setupError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{setupError}</p>}
              <button type="submit" disabled={isSaving}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                {isSaving ? t('creating') : t('createProfile')}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">{t('notFound')}</p>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Profile hero */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-32 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <label className="relative w-16 h-16 rounded-2xl shrink-0 cursor-pointer group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <span className="text-2xl font-black text-white">{initials}</span>
                </div>
              )}
              {/* Overlay */}
              <div className={cn(
                'absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 transition-opacity duration-150',
                isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}>
                {isUploadingAvatar
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />
                }
              </div>
            </label>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white truncate">{profile.name}</h1>
              <p className="text-sm text-teal-400 font-medium">@{profile.username}</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
              {(profile.city || profile.country) && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:border-slate-500 hover:text-white rounded-xl transition-all duration-150 shrink-0">
                <Pencil className="w-3 h-3" /> {t('editBtn')}
              </button>
            )}
          </div>
          {!isEditing && (profile.bio || profile.phone || profile.birthDate) && (
            <div className="mt-4 space-y-1.5">
              {profile.bio && (
                <p className="text-sm text-slate-400 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1">
                {profile.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3 h-3 shrink-0" />{profile.phone}
                  </span>
                )}
                {profile.birthDate && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    {new Date(profile.birthDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <div className="mt-5 bg-slate-800/80 rounded-2xl border border-slate-700 p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('nameLabel')}</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={DARK_INPUT} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('bioLabel')}</label>
                <input value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={t('bioPlaceholder')} className={DARK_INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('countryLabel')}</label>
                  <CountrySelect
                    value={formData.country}
                    onChange={(v) => setFormData({ ...formData, country: v })}
                    placeholder={t('countryPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('cityLabel')}</label>
                  <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('cityPlaceholder')} className={DARK_INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('phoneLabel')}</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('phonePlaceholder')} className={DARK_INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('birthDateLabel')}</label>
                  <BirthDatePicker
                    value={formData.birthDate}
                    onChange={(v) => setFormData({ ...formData, birthDate: v })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  {isSaving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> {t('save')}</>}
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold rounded-xl transition-colors">
                  <X className="w-4 h-4" /> {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-8 border border-slate-700">
          {(['profile', 'matches'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-150',
                activeTab === tab ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}>
              {tab === 'profile' ? t('tabSports') : t('tabMatches')}
            </button>
          ))}
        </div>

        {/* ── Deportes tab ─────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {profile.sportStats.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">
                {t('noSports')}
              </p>
            )}
            {profile.sportStats.map((stat) => (
              <SportStatCard
                key={stat.sportId}
                stat={stat}
                sportName={sportNameById(stat.sportId)}
                onSaved={loadProfile}
              />
            ))}
            {missingSports.length > 0 && (
              <AddSportCard availableSports={missingSports} onSaved={loadProfile} />
            )}
          </div>
        )}

        {/* ── Partidos tab ─────────────────────────────── */}
        {activeTab === 'matches' && (
          <div>
            {matchesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-slate-800 rounded-2xl animate-pulse border border-slate-700" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-slate-800 rounded-2xl border border-slate-700 py-20 text-center">
                <Trophy className="w-10 h-10 text-slate-600 mb-4" />
                <p className="text-slate-300 font-bold mb-1">{t('noMatches')}</p>
                <p className="text-slate-500 text-sm">{t('noMatchesDesc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('matchCount', { count: matches.length })}</p>
                {matches.map((match) => (
                  <MyMatchCard key={match.id} match={match}
                    sportName={sportNameById(match.sportId)}
                    isAdmin={match.adminUserId === user?.id}
                    onResultSaved={() => { setMatchesLoaded(false); loadMatches(); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
