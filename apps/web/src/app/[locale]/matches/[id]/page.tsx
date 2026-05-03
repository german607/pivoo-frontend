'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Match, MatchParticipant, ParticipantStatus, Team, MatchCategory, MatchGender } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button, Card, Input, Skeleton } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
  Calendar, Users, Trophy, MapPin, CheckCircle, XCircle,
  Clock, UserPlus, UserMinus, Trash2, Shield,
} from 'lucide-react';

const SPORT_EMOJI: Record<string, string> = { TENNIS: '🎾', PADEL: '🏓' };
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  PROFESSIONAL: 'Profesional',
};
const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  MIXTO: 'Mixto',
};
const TEAM_COLORS = {
  TEAM_A: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Equipo A' },
  TEAM_B: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Equipo B' },
};

export default function MatchDetailPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { get, post, patch, delete: del } = useApi();
  const router = useRouter();
  const t = useTranslations('matchDetail');

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [sport, setSport] = useState<{ name: string } | null>(null);

  // Admin form state
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteTeam, setInviteTeam] = useState('');
  const [guestFirst, setGuestFirst] = useState('');
  const [guestLast, setGuestLast] = useState('');
  const [guestTeam, setGuestTeam] = useState('');

  // Result recording state
  const [resultWinner, setResultWinner] = useState<Team | ''>('');
  const [resultSets, setResultSets] = useState([{ setNumber: 1, teamAScore: '', teamBScore: '' }]);

  const allUserIds = (match?.participants ?? [])
    .map((p) => p.userId)
    .filter((id): id is string => !!id);
  const { getName, getInitials } = useUserProfiles(allUserIds);

  useEffect(() => { loadMatch(); }, [matchId]);

  const loadMatch = async () => {
    setIsLoading(true);
    try {
      const data = await get<Match>(`/api/v1/matches/${matchId}`, {
        baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL,
      });
      if (data.complexId) {
        const complex = await get<{ name: string; city: string; courts: { id: string; name: string }[] }>(
          `/api/v1/complexes/${data.complexId}`,
          { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }
        ).catch(() => null);
        if (complex) data.complex = { name: complex.name, city: complex.city };
      }
      const sports = await get<{ id: string; name: string }[]>('/api/v1/sports', {
        baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL,
      }).catch(() => null);
      if (sports) setSport(sports.find((s) => s.id === data.sportId) ?? null);
      setMatch(data);
    } catch {
      setMatch(null);
    } finally {
      setIsLoading(false);
    }
  };

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try { await fn(); await loadMatch(); }
    finally { setActionLoading(''); }
  };

  const MAPI = { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL };

  const handleJoin = () => act('join', () => post(`/api/v1/matches/${matchId}/join`, {}, MAPI));
  const handleAcceptInvite = () => act('acceptInvite', () => patch(`/api/v1/matches/${matchId}/invite/accept`, {}, MAPI));
  const handleDeclineInvite = () => act('declineInvite', () => patch(`/api/v1/matches/${matchId}/invite/decline`, {}, MAPI));
  const handleApprove = (userId: string, team?: string) =>
    act(userId, () => patch(`/api/v1/matches/${matchId}/participants/${userId}/approve${team ? `?team=${team}` : ''}`, {}, MAPI));
  const handleReject = (userId: string) =>
    act(userId + '_r', () => patch(`/api/v1/matches/${matchId}/participants/${userId}/reject`, {}, MAPI));
  const handleRemove = (participantId: string) =>
    act(participantId + '_rm', () => del(`/api/v1/matches/${matchId}/participants/${participantId}`, MAPI));
  const handleChangeTeam = (participantId: string, team: string) =>
    act(participantId + '_team', () => patch(
      `/api/v1/matches/${matchId}/participants/${participantId}/team${team ? `?team=${team}` : ''}`,
      {},
      MAPI,
    ));
  const handleCancel = async () => {
    if (!confirm(t('cancelConfirm'))) return;
    act('cancel', async () => { await del(`/api/v1/matches/${matchId}`, MAPI); router.push('/matches'); });
  };
  const handleRecordResult = () => {
    if (!resultWinner) return;
    act('result', () => post(`/api/v1/matches/${matchId}/result`, {
      winnerTeam: resultWinner,
      sets: resultSets
        .filter((s) => s.teamAScore !== '' && s.teamBScore !== '')
        .map((s) => ({ setNumber: s.setNumber, teamAScore: Number(s.teamAScore), teamBScore: Number(s.teamBScore) })),
    }, MAPI));
  };
  const handleInvite = async () => {
    if (!inviteUserId.trim()) return;
    await act('invite', () => post(`/api/v1/matches/${matchId}/invite`, {
      userId: inviteUserId.trim(),
      ...(inviteTeam ? { team: inviteTeam } : {}),
    }, MAPI));
    setInviteUserId('');
    setInviteTeam('');
  };
  const handleAddGuest = async () => {
    if (!guestFirst.trim() || !guestLast.trim()) return;
    await act('guest', () => post(`/api/v1/matches/${matchId}/guests`, {
      firstName: guestFirst.trim(),
      lastName: guestLast.trim(),
      ...(guestTeam ? { team: guestTeam } : {}),
    }, MAPI));
    setGuestFirst('');
    setGuestLast('');
    setGuestTeam('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-gray-500 font-medium mb-4">{t('notFound')}</p>
          <Link href="/matches" className="text-sm text-teal-600 hover:text-teal-700">← Volver a partidos</Link>
        </div>
      </div>
    );
  }

  const approved = match.participants.filter((p) => p.status === ParticipantStatus.APPROVED);
  const pending = match.participants.filter((p) => p.status === ParticipantStatus.PENDING);
  const invitedPending = match.participants.filter((p) => p.status === ParticipantStatus.INVITED);
  const pct = Math.round((approved.length / match.maxPlayers) * 100);
  const isFull = approved.length >= match.maxPlayers;

  const isAdmin = match.adminUserId === user?.id;
  const myParticipant = match.participants.find((p) => p.userId === user?.id);
  const myStatus = myParticipant?.status;

  const participantName = (p: MatchParticipant) =>
    p.participantType === 'GUEST'
      ? `${p.guestFirstName} ${p.guestLastName}`
      : getName(p.userId);
  const participantInitials = (p: MatchParticipant) =>
    p.participantType === 'GUEST'
      ? `${p.guestFirstName?.[0] ?? ''}${p.guestLastName?.[0] ?? ''}`.toUpperCase()
      : getInitials(p.userId);

  const statusColor =
    match.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
    match.status === 'FULL' ? 'bg-amber-100 text-amber-700' :
    match.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
    match.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
    'bg-red-100 text-red-600';
  const statusLabel =
    match.status === 'OPEN' ? 'Abierto' : match.status === 'FULL' ? 'Completo' :
    match.status === 'IN_PROGRESS' ? 'En curso' : match.status === 'COMPLETED' ? 'Finalizado' : 'Cancelado';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/matches" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors mb-6">
          ← Volver a partidos
        </Link>

        {/* ── Hero ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5">
          <div className="h-1.5 bg-gradient-to-r from-teal-400 to-blue-500" />
          <div className="p-7">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow">
                {SPORT_EMOJI[sport?.name ?? ''] ?? '🏅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      <Shield className="w-3 h-3" /> Administrador
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {sport?.name ?? match.sportId}
                  {match.complex && <span className="text-gray-500 font-normal text-lg"> · {match.complex.name}</span>}
                </h1>
                {match.complex && (
                  <p className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {match.complex.city}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    {new Date(match.scheduledAt).toLocaleString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {match.requiredLevel && (
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      {LEVEL_LABEL[match.requiredLevel] ?? match.requiredLevel}
                    </span>
                  )}
                  {match.requiredCategory && (
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      {match.requiredCategory.charAt(0) + match.requiredCategory.slice(1).toLowerCase()}
                    </span>
                  )}
                  {match.gender && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {GENDER_LABEL[match.gender] ?? match.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {match.description && (
              <p className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">{match.description}</p>
            )}

            {/* Capacity bar */}
            <div className="mt-5">
              <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{approved.length} jugadores</span>
                <span>{match.maxPlayers} plazas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isFull ? 'bg-amber-400' : 'bg-teal-500'}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── User action ───────────────────────── */}
        {!isAdmin && user && (
          <div className="mb-5">
            {!myParticipant && match.status === 'OPEN' && !isFull && (
              <Button variant="primary" size="lg" className="w-full" onClick={handleJoin}
                isLoading={actionLoading === 'join'}>
                {t('requestJoin')}
              </Button>
            )}
            {myStatus === ParticipantStatus.PENDING && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-700">{t('requestPending')}</p>
              </div>
            )}
            {myStatus === ParticipantStatus.INVITED && (
              <div className="flex items-center justify-between gap-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-teal-600 shrink-0" />
                  <p className="text-sm font-medium text-teal-700">{t('invitedTitle')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleAcceptInvite}
                    isLoading={actionLoading === 'acceptInvite'}>{t('acceptInvite')}</Button>
                  <Button variant="outline" size="sm" onClick={handleDeclineInvite}
                    isLoading={actionLoading === 'declineInvite'}>{t('declineInvite')}</Button>
                </div>
              </div>
            )}
            {myStatus === ParticipantStatus.APPROVED && myParticipant && (
              <div className="flex items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700">{t('alreadyJoined')}</p>
                    {myParticipant.team && (
                      <p className="text-xs text-emerald-600">
                        {TEAM_COLORS[myParticipant.team]?.label}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => act(myParticipant.id + '_rm', () => del(`/api/v1/matches/${matchId}/participants/${myParticipant.id}`, MAPI))}
                  isLoading={actionLoading === myParticipant.id + '_rm'}>
                  {t('leaveMatch')}
                </Button>
              </div>
            )}
            {myStatus === ParticipantStatus.REJECTED && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-600">{t('requestRejected')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Participants ──────────────────────── */}
        <Card padding="lg" className="mb-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t('participants')} ({approved.length}/{match.maxPlayers})
          </h2>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aún no hay jugadores confirmados</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {approved.map((p) => {
                const teamConfig = p.team ? TEAM_COLORS[p.team] : null;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {participantInitials(p)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.userId === user?.id ? <span className="text-teal-700">Tú</span> : participantName(p)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.participantType === 'GUEST' && (
                          <span className="text-xs text-gray-400">{t('guest')}</span>
                        )}
                        {p.userId === match.adminUserId && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-teal-600 font-medium">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        )}
                        {teamConfig && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${teamConfig.bg} ${teamConfig.text}`}>
                            {teamConfig.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={p.team ?? ''}
                          disabled={!!actionLoading}
                          onChange={(e) => handleChangeTeam(p.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-700 focus:border-teal-500 focus:outline-none disabled:opacity-50"
                        >
                          <option value="">Sin equipo</option>
                          <option value="TEAM_A">Eq. A</option>
                          <option value="TEAM_B">Eq. B</option>
                        </select>
                        {p.userId !== match.adminUserId && (
                          <button
                            onClick={() => handleRemove(p.id)}
                            disabled={!!actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('removeParticipant')}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Admin panel ───────────────────────── */}
        {isAdmin && (
          <div className="space-y-5">
            {/* Pending requests */}
            <Card padding="lg">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {t('pendingRequests')} {pending.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{pending.length}</span>}
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-gray-400">{t('noPendingRequests')}</p>
              ) : (
                <div className="space-y-2">
                  {pending.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                        {getInitials(p.userId)}
                      </div>
                      <p className="text-sm font-medium text-gray-800 flex-1 truncate">{getName(p.userId)}</p>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
                          defaultValue=""
                          id={`team-${p.id}`}
                        >
                          <option value="">Sin equipo</option>
                          <option value="TEAM_A">Equipo A</option>
                          <option value="TEAM_B">Equipo B</option>
                        </select>
                        <Button variant="primary" size="sm"
                          isLoading={actionLoading === p.userId}
                          onClick={() => {
                            if (!p.userId) return;
                            const sel = document.getElementById(`team-${p.id}`) as HTMLSelectElement;
                            handleApprove(p.userId, sel?.value || undefined);
                          }}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="danger" size="sm"
                          isLoading={actionLoading === p.userId + '_r'}
                          onClick={() => { if (p.userId) handleReject(p.userId); }}>
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Sent invitations */}
            {invitedPending.length > 0 && (
              <Card padding="lg">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('invitedPending')}</h2>
                <div className="space-y-2">
                  {invitedPending.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold shrink-0">
                        {getInitials(p.userId)}
                      </div>
                      <p className="text-sm font-medium text-gray-800 flex-1 truncate">{getName(p.userId)}</p>
                      <span className="text-xs text-teal-600 font-medium">Esperando respuesta</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Invite player */}
            <Card padding="lg">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('invitePlayer')}</h2>
              <div className="flex gap-2">
                <Input
                  placeholder={t('inviteUserId')}
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <select
                  value={inviteTeam}
                  onChange={(e) => setInviteTeam(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Sin equipo</option>
                  <option value="TEAM_A">Equipo A</option>
                  <option value="TEAM_B">Equipo B</option>
                </select>
                <Button variant="primary" onClick={handleInvite}
                  isLoading={actionLoading === 'invite'}
                  disabled={!inviteUserId.trim()}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Add guest */}
            <Card padding="lg">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('addGuest')}</h2>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input placeholder={t('guestFirstName')} value={guestFirst} onChange={(e) => setGuestFirst(e.target.value)} />
                <Input placeholder={t('guestLastName')} value={guestLast} onChange={(e) => setGuestLast(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <select
                  value={guestTeam}
                  onChange={(e) => setGuestTeam(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Sin equipo</option>
                  <option value="TEAM_A">Equipo A</option>
                  <option value="TEAM_B">Equipo B</option>
                </select>
                <Button variant="primary" onClick={handleAddGuest}
                  isLoading={actionLoading === 'guest'}
                  disabled={!guestFirst.trim() || !guestLast.trim()}>
                  {t('addGuestBtn')}
                </Button>
              </div>
            </Card>

            {/* Record result */}
            {(match.status === 'IN_PROGRESS' || match.status === 'FULL') && (
              <Card padding="lg">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Registrar resultado</h2>
                <div className="space-y-3">
                  {resultSets.map((set, i) => (
                    <div key={set.setNumber} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">Set {set.setNumber}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-xs text-blue-600 font-semibold w-14">Eq. A</span>
                        <input
                          type="number" min={0} placeholder="0"
                          value={set.teamAScore}
                          onChange={(e) => setResultSets((prev) => prev.map((s, j) => j === i ? { ...s, teamAScore: e.target.value } : s))}
                          className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-gray-300 font-bold">–</span>
                        <input
                          type="number" min={0} placeholder="0"
                          value={set.teamBScore}
                          onChange={(e) => setResultSets((prev) => prev.map((s, j) => j === i ? { ...s, teamBScore: e.target.value } : s))}
                          className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-xs text-orange-600 font-semibold w-14 text-right">Eq. B</span>
                      </div>
                      {resultSets.length > 1 && (
                        <button onClick={() => setResultSets((prev) => prev.filter((_, j) => j !== i))}
                          className="text-gray-300 hover:text-red-400 transition-colors text-xs px-1">✕</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setResultSets((prev) => [...prev, { setNumber: prev.length + 1, teamAScore: '', teamBScore: '' }])}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                  >
                    + Añadir set
                  </button>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <select
                      value={resultWinner}
                      onChange={(e) => setResultWinner(e.target.value as Team)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="">— Equipo ganador —</option>
                      <option value="TEAM_A">Equipo A</option>
                      <option value="TEAM_B">Equipo B</option>
                    </select>
                    <Button variant="primary" onClick={handleRecordResult}
                      isLoading={actionLoading === 'result'}
                      disabled={!resultWinner}>
                      Guardar resultado
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Cancel match */}
            {(match.status === 'OPEN' || match.status === 'FULL') && (
              <div className="flex justify-end pt-2">
                <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleCancel} isLoading={actionLoading === 'cancel'}>
                  {t('cancelMatch')}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
