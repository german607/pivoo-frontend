'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { User, Match, Sport, MatchStatus, Team, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Card, Input, Button } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, Clock, Users, Trophy, Plus, Minus, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  OPEN:        { text: 'Abierto',    cls: 'bg-violet-500/20 text-violet-300 border border-violet-400/30' },
  FULL:        { text: 'Completo',   cls: 'bg-amber-500/20 text-amber-300 border border-amber-400/30' },
  IN_PROGRESS: { text: 'En curso',   cls: 'bg-blue-500/20 text-blue-300 border border-blue-400/30' },
  COMPLETED:   { text: 'Finalizado', cls: 'bg-slate-500/20 text-slate-300 border border-slate-400/30' },
  CANCELLED:   { text: 'Cancelado',  cls: 'bg-red-500/20 text-red-300 border border-red-400/30' },
};

const TEAM_LABEL: Record<string, string> = { TEAM_A: 'Equipo A', TEAM_B: 'Equipo B' };

interface SetRow { teamAScore: string; teamBScore: string }

function ResultForm({ matchId, onSaved }: { matchId: string; onSaved: () => void }) {
  const { post } = useApi();
  const MAPI = { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL };

  const [sets, setSets] = useState<SetRow[]>([{ teamAScore: '', teamBScore: '' }]);
  const [winner, setWinner] = useState<Team | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateSet = (i: number, field: keyof SetRow, val: string) =>
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winner) { setError('Seleccioná el equipo ganador'); return; }
    const validSets = sets.filter((s) => s.teamAScore !== '' && s.teamBScore !== '');
    setSaving(true);
    setError('');
    try {
      await post(`/api/v1/matches/${matchId}/result`, {
        winnerTeam: winner,
        sets: validSets.map((s, i) => ({
          setNumber: i + 1,
          teamAScore: Number(s.teamAScore),
          teamBScore: Number(s.teamBScore),
        })),
      }, MAPI);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 space-y-4">
      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Guardar resultado</p>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          <span>Set <span className="font-normal normal-case text-slate-500">(opcional)</span></span>
          <span className="text-center">Equipo A</span><span className="text-center">Equipo B</span>
        </div>
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            <span className="text-sm font-bold text-slate-400 pl-1">Set {i + 1}</span>
            <input
              type="number" min="0" value={s.teamAScore}
              onChange={(e) => updateSet(i, 'teamAScore', e.target.value)}
              className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              placeholder="0"
            />
            <input
              type="number" min="0" value={s.teamBScore}
              onChange={(e) => updateSet(i, 'teamBScore', e.target.value)}
              className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              placeholder="0"
            />
          </div>
        ))}
        <div className="flex gap-2">
          {sets.length < 5 && (
            <button type="button" onClick={() => setSets((p) => [...p, { teamAScore: '', teamBScore: '' }])}
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium">
              <Plus className="w-3 h-3" /> Agregar set
            </button>
          )}
          {sets.length > 1 && (
            <button type="button" onClick={() => setSets((p) => p.slice(0, -1))}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-medium ml-auto">
              <Minus className="w-3 h-3" /> Quitar set
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Equipo ganador</p>
        <div className="flex gap-2">
          {([Team.TEAM_A, Team.TEAM_B] as const).map((t) => (
            <button
              key={t} type="button"
              onClick={() => setWinner(winner === t ? '' : t)}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-xl border transition-all duration-150',
                winner === t
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400'
              )}
            >
              {TEAM_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" variant="primary" isLoading={saving} className="w-full">
        Guardar resultado
      </Button>
    </form>
  );
}

function MyMatchCard({
  match, sportName, isAdmin, onResultSaved,
}: {
  match: Match;
  sportName: string;
  isAdmin: boolean;
  onResultSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const matchDate = new Date(match.scheduledAt);
  const isPast = matchDate < now;
  const canRecord = isAdmin && !match.result && match.status !== MatchStatus.CANCELLED;
  const status = STATUS_LABEL[match.status] ?? STATUS_LABEL.OPEN;

  const formatDate = () =>
    matchDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{sportName === 'TENNIS' ? '🎾' : sportName === 'PADEL' ? '🏓' : '🏅'}</span>
          <span className="text-sm font-bold text-white truncate">{sportName}</span>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', status.cls)}>{status.text}</span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className={cn('text-xs font-medium', !isPast && 'text-teal-400')}>{formatDate()}</span>
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
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">Ganador: {TEAM_LABEL[match.result.winnerTeam]}</span>
            </div>
            <div className="flex gap-2">
              {(match.result.sets as { setNumber: number; teamAScore: number; teamBScore: number }[]).map((s) => (
                <div key={s.setNumber} className="flex flex-col items-center bg-slate-700/60 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Set {s.setNumber}</span>
                  <span className="text-sm font-black text-white">{s.teamAScore} - {s.teamBScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canRecord && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              {showForm ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {showForm ? 'Cancelar' : 'Guardar resultado'}
            </button>
            {showForm && (
              <ResultForm
                matchId={match.id}
                onSaved={() => { setShowForm(false); onResultSaved(); }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, patch } = useApi();
  const router = useRouter();
  const t = useTranslations('profile');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<'profile' | 'matches'>('profile');
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatarUrl: '' });
  const [setupData, setSetupData] = useState({ username: '', name: '' });
  const [setupError, setSetupError] = useState('');

  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
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
      const data = await get<User>('/api/v1/users/me', { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setProfile(data);
      setProfileNotFound(false);
      setFormData({ name: data.name || '', bio: data.bio || '', avatarUrl: data.avatarUrl || '' });
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
      setSports(sportData || []);
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
    setIsSaving(true);
    setSetupError('');
    try {
      await post('/api/v1/users', {
        email: user.email,
        username: setupData.username.trim(),
        name: setupData.name.trim(),
      }, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setProfileNotFound(false);
      await loadProfile();
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Error al crear el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patch('/api/v1/users/me', formData, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL });
      setIsEditing(false);
      await loadProfile();
    } catch { /* ignore */ }
    finally { setIsSaving(false); }
  };

  const sportNameById = (id: string) => sports.find((s) => s.id === id)?.name ?? '';

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  if (profileNotFound) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <main className="max-w-md mx-auto px-6 py-12">
          <Card>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Completar perfil</h1>
            <p className="text-gray-500 text-sm mb-6">Elegí un nombre de usuario y tu nombre para empezar.</p>
            <form onSubmit={handleSetup} className="space-y-4">
              <Input
                label="Nombre de usuario"
                value={setupData.username}
                onChange={(e) => setSetupData({ ...setupData, username: e.target.value })}
                placeholder="ej: jugador123"
                required
              />
              <Input
                label="Nombre completo"
                value={setupData.name}
                onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                placeholder="ej: Juan Perez"
                required
              />
              {setupError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{setupError}</p>
              )}
              <Button type="submit" variant="primary" isLoading={isSaving} className="w-full">
                Crear perfil
              </Button>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-8 border border-slate-700">
          {(['profile', 'matches'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-150',
                activeTab === tab
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab === 'profile' ? 'Perfil' : 'Mis partidos'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <Card>
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name || profile.email}</h1>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="secondary">
                  {t('editProfile')}
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 mb-6">
                <Input
                  label={t('name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label={t('avatarUrl')}
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
                <Input
                  label={t('bio')}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={t('bioPlaceholder')}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} variant="primary" isLoading={isSaving}>
                    {t('save')}
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="secondary">
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-500 mb-2">{profile.email}</p>
                {profile.bio && <p className="text-gray-600 mb-6">{profile.bio}</p>}
              </>
            )}

            {profile.sportStats && profile.sportStats.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('sportStats')}</h2>
                <div className="space-y-3">
                  {profile.sportStats.map((stat) => (
                    <div key={stat.sportId} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{stat.sportId}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">{t('statMatches')}</p>
                          <p className="font-bold">{stat.matchesPlayed}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('statWon')}</p>
                          <p className="font-bold">{stat.matchesWon}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('statRanking')}</p>
                          <p className="font-bold">{stat.rankingPoints} pts</p>
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-500">{t('statLevel')}</p>
                          <p className="font-bold text-green-600">
                            {SKILL_LEVEL_LABELS[stat.level] || stat.level}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

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
                <p className="text-slate-300 font-bold mb-1">Sin partidos todavia</p>
                <p className="text-slate-500 text-sm">Tus partidos jugados apareceran aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  {matches.length} partidos
                </p>
                {matches.map((match) => (
                  <MyMatchCard
                    key={match.id}
                    match={match}
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
