'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Match, MatchParticipant, ParticipantStatus, Team, MatchCategory, MatchGender, MatchMode } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button, Skeleton } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
  Calendar, Users, Trophy, MapPin, CheckCircle, XCircle,
  Clock, UserPlus, UserMinus, Trash2, Shield, RotateCcw, ListOrdered,
} from 'lucide-react';
import { SportIcon } from '@/components/SportIcon';

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
};
const GENDER_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino', FEMENINO: 'Femenino', MIXTO: 'Mixto',
};
const TEAM_COLORS = {
  TEAM_A: { bg: 'bg-blue-500/20',   text: 'text-blue-400',   label: 'Equipo A' },
  TEAM_B: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Equipo B' },
};

const CARD   = 'bg-slate-800 rounded-2xl border border-slate-700/60 p-6';
const INPUT  = 'bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const SELECT = 'bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

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

  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteTeam, setInviteTeam] = useState('');
  const [guestFirst, setGuestFirst] = useState('');
  const [guestLast, setGuestLast] = useState('');
  const [guestTeam, setGuestTeam] = useState('');
  const [resultWinner, setResultWinner] = useState<Team | ''>('');
  const [resultSets, setResultSets] = useState([{ setNumber: 1, teamAScore: '', teamBScore: '' }]);
  const [challengePartnerId, setChallengePartnerId] = useState('');
  const [rematchDate, setRematchDate] = useState('');
  const [rematchTime, setRematchTime] = useState('');

  const allUserIds = (match?.participants ?? []).map((p) => p.userId).filter((id): id is string => !!id);
  const { getName, getInitials } = useUserProfiles(allUserIds);

  useEffect(() => { loadMatch(); }, [matchId]);

  const loadMatch = async () => {
    setIsLoading(true);
    try {
      const data = await get<Match>(`/api/v1/matches/${matchId}`, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      if (data.complexId) {
        const complex = await get<{ name: string; city: string; courts: { id: string; name: string }[] }>(
          `/api/v1/complexes/${data.complexId}`, { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }
        ).catch(() => null);
        if (complex) data.complex = { name: complex.name, city: complex.city };
      }
      const sports = await get<{ id: string; name: string }[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }).catch(() => null);
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

  const handleJoin          = () => act('join',        () => post(`/api/v1/matches/${matchId}/join`, {}, MAPI));
  const handleAcceptInvite  = () => act('acceptInvite',() => patch(`/api/v1/matches/${matchId}/invite/accept`, {}, MAPI));
  const handleDeclineInvite = () => act('declineInvite',() => patch(`/api/v1/matches/${matchId}/invite/decline`, {}, MAPI));
  const handleApprove = (userId: string, team?: string) =>
    act(userId, () => patch(`/api/v1/matches/${matchId}/participants/${userId}/approve${team ? `?team=${team}` : ''}`, {}, MAPI));
  const handleReject  = (userId: string) =>
    act(userId + '_r', () => patch(`/api/v1/matches/${matchId}/participants/${userId}/reject`, {}, MAPI));
  const handleRemove  = (participantId: string) =>
    act(participantId + '_rm', () => del(`/api/v1/matches/${matchId}/participants/${participantId}`, MAPI));
  const handleChangeTeam = (participantId: string, team: string) =>
    act(participantId + '_team', () => patch(`/api/v1/matches/${matchId}/participants/${participantId}/team${team ? `?team=${team}` : ''}`, {}, MAPI));
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
      userId: inviteUserId.trim(), ...(inviteTeam ? { team: inviteTeam } : {}),
    }, MAPI));
    setInviteUserId(''); setInviteTeam('');
  };
  const handleChallenge = async () => {
    if (!challengePartnerId.trim()) return;
    await act('challenge', () => post(`/api/v1/matches/${matchId}/challenge`, { partnerId: challengePartnerId.trim() }, MAPI));
    setChallengePartnerId('');
  };
  const handleApproveChallenge = () => act('approveChallenge', () => post(`/api/v1/matches/${matchId}/approve-challenge`, {}, MAPI));
  const handleRejectChallenge  = () => act('rejectChallenge',  () => post(`/api/v1/matches/${matchId}/reject-challenge`,  {}, MAPI));
  const handleRematch = async () => {
    if (!rematchDate || !rematchTime) return;
    const [y, mo, d] = rematchDate.split('-').map(Number);
    const [h, mi] = rematchTime.split(':').map(Number);
    const scheduledAt = new Date(y, mo - 1, d, h, mi, 0).toISOString();
    setActionLoading('rematch');
    try {
      const newMatch = await post<{ id: string }>(`/api/v1/matches/${matchId}/rematch`, { scheduledAt }, MAPI);
      router.push(`/matches/${newMatch.id}`);
    } finally { setActionLoading(''); }
  };

  const handleAddGuest = async () => {
    if (!guestFirst.trim() || !guestLast.trim()) return;
    await act('guest', () => post(`/api/v1/matches/${matchId}/guests`, {
      firstName: guestFirst.trim(), lastName: guestLast.trim(), ...(guestTeam ? { team: guestTeam } : {}),
    }, MAPI));
    setGuestFirst(''); setGuestLast(''); setGuestTeam('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-48" /><Skeleton className="h-32" /><Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-slate-400 font-medium mb-4">{t('notFound')}</p>
          <Link href="/matches" className="text-sm text-teal-400 hover:text-teal-300">{t('back')}</Link>
        </div>
      </div>
    );
  }

  const approved        = match.participants.filter((p) => p.status === ParticipantStatus.APPROVED);
  const pending         = match.participants.filter((p) => p.status === ParticipantStatus.PENDING);
  const invitedPending  = match.participants.filter((p) => p.status === ParticipantStatus.INVITED);
  const waitlisted      = match.participants.filter((p) => p.status === ParticipantStatus.WAITLISTED);
  const isTeamVsTeam    = match.mode === MatchMode.TEAM_VS_TEAM;
  const pendingTeamB    = pending.filter((p) => p.team === Team.TEAM_B);
  const approvedTeamB   = approved.filter((p) => p.team === Team.TEAM_B);
  const hasPendingChallenge = pendingTeamB.length > 0;
  const hasApprovedTeamB    = approvedTeamB.length > 0;
  const pct           = Math.round((approved.length / match.maxPlayers) * 100);
  const isFull        = approved.length >= match.maxPlayers;
  const isAdmin       = match.adminUserId === user?.id;
  const myParticipant = match.participants.find((p) => p.userId === user?.id);
  const myStatus      = myParticipant?.status;

  const participantName    = (p: MatchParticipant) =>
    p.participantType === 'GUEST' ? `${p.guestFirstName} ${p.guestLastName}` : getName(p.userId);
  const participantInitials = (p: MatchParticipant) =>
    p.participantType === 'GUEST'
      ? `${p.guestFirstName?.[0] ?? ''}${p.guestLastName?.[0] ?? ''}`.toUpperCase()
      : getInitials(p.userId);

  const statusColor =
    match.status === 'OPEN'        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
    match.status === 'FULL'        ? 'bg-amber-500/20  text-amber-400  border border-amber-500/30'  :
    match.status === 'IN_PROGRESS' ? 'bg-blue-500/20   text-blue-400   border border-blue-500/30'   :
    match.status === 'COMPLETED'   ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                     'bg-red-500/20    text-red-400    border border-red-500/30';
  const statusLabel =
    match.status === 'OPEN' ? 'Abierto' : match.status === 'FULL' ? 'Completo' :
    match.status === 'IN_PROGRESS' ? 'En curso' : match.status === 'COMPLETED' ? 'Finalizado' : 'Cancelado';

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/matches" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6">
          {t('back')}
        </Link>

        {/* ── Hero ─────────────────────────────────── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="h-1.5 bg-gradient-to-r from-teal-400 to-blue-500" />
          <div className="p-7">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shrink-0 shadow">
                <SportIcon sport={sport?.name ?? ''} className="w-9 h-[41px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
                  {match.mode === MatchMode.TEAM_VS_TEAM && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {t('pairsMatch')}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 bg-teal-500/20 px-2.5 py-1 rounded-full border border-teal-500/30">
                      <Shield className="w-3 h-3" /> Administrador
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {sport?.name ?? match.sportId}
                  {(match.complex?.name || match.complexName) && (
                    <span className="text-slate-400 font-normal text-lg"> · {match.complex?.name ?? match.complexName}</span>
                  )}
                </h1>
                {match.complex?.city && (
                  <p className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {match.complex.city}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    {new Date(match.scheduledAt).toLocaleString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {match.requiredLevel && (
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      {LEVEL_LABEL[match.requiredLevel] ?? match.requiredLevel}
                    </span>
                  )}
                  {match.requiredCategory && (
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      {match.requiredCategory.charAt(0) + match.requiredCategory.slice(1).toLowerCase()}
                    </span>
                  )}
                  {match.gender && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {GENDER_LABEL[match.gender] ?? match.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {match.description && (
              <p className="mt-4 text-sm text-slate-400 border-t border-slate-700 pt-4">{match.description}</p>
            )}

            {/* Capacity bar */}
            <div className="mt-5">
              <div className="flex justify-between text-sm text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {isFull ? 'Completo' : `${match.maxPlayers - approved.length === 1 ? 'Falta 1 jugador' : `Faltan ${match.maxPlayers - approved.length} jugadores`}`}
                </span>
                <span>Partido de {match.maxPlayers}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isFull ? 'bg-amber-400' : 'bg-teal-500'}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── User action ─────────────────────────── */}
        {!isAdmin && user && (
          <div className="mb-5">
            {!myParticipant && match.status === 'OPEN' && !isFull && !isTeamVsTeam && (
              <Button variant="primary" size="lg" className="w-full" onClick={handleJoin} isLoading={actionLoading === 'join'}>
                {t('requestJoin')}
              </Button>
            )}
            {!myParticipant && match.status === 'FULL' && !isTeamVsTeam && (
              <Button variant="outline" size="lg" className="w-full !border-slate-500 !text-slate-300" onClick={handleJoin} isLoading={actionLoading === 'join'}>
                <ListOrdered className="w-4 h-4 mr-2" />
                Unirse a lista de espera
              </Button>
            )}

            {/* ── Team vs Team: challenge form ── */}
            {!myParticipant && match.status === 'OPEN' && isTeamVsTeam && !hasApprovedTeamB && (
              hasPendingChallenge ? (
                <div className="flex items-center gap-3 p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                  <Clock className="w-5 h-5 text-violet-400 shrink-0" />
                  <p className="text-sm font-medium text-violet-400">{t('challengePending')}</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-700/40 border border-slate-600/60 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-white">{t('challengeTitle')}</p>
                  <div className="flex gap-2">
                    <input
                      value={challengePartnerId}
                      onChange={(e) => setChallengePartnerId(e.target.value)}
                      placeholder={t('challengePartnerPlaceholder')}
                      className={`flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    />
                    <Button variant="primary" onClick={handleChallenge} isLoading={actionLoading === 'challenge'} disabled={!challengePartnerId.trim()}
                      className="!bg-violet-600 hover:!bg-violet-500 !border-violet-600">
                      {t('challengeBtn')}
                    </Button>
                  </div>
                </div>
              )
            )}
            {myStatus === ParticipantStatus.PENDING && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm font-medium text-amber-400">{t('requestPending')}</p>
              </div>
            )}
            {myStatus === ParticipantStatus.INVITED && (
              <div className="flex items-center justify-between gap-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-teal-400 shrink-0" />
                  <p className="text-sm font-medium text-teal-400">{t('invitedTitle')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleAcceptInvite} isLoading={actionLoading === 'acceptInvite'}>{t('acceptInvite')}</Button>
                  <Button variant="outline" size="sm" onClick={handleDeclineInvite} isLoading={actionLoading === 'declineInvite'}>{t('declineInvite')}</Button>
                </div>
              </div>
            )}
            {myStatus === ParticipantStatus.APPROVED && myParticipant && (
              <div className="flex items-center justify-between gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">{t('alreadyJoined')}</p>
                    {myParticipant.team && (
                      <p className="text-xs text-emerald-500">{TEAM_COLORS[myParticipant.team]?.label}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => act('leave', () => del(`/api/v1/matches/${matchId}/leave`, MAPI))}
                  isLoading={actionLoading === 'leave'}>
                  {t('leaveMatch')}
                </Button>
              </div>
            )}
            {myStatus === ParticipantStatus.WAITLISTED && (
              <div className="flex items-center gap-3 p-4 bg-slate-600/30 border border-slate-500/40 rounded-xl">
                <ListOrdered className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Estás en lista de espera</p>
                  <p className="text-xs text-slate-500 mt-0.5">Te notificaremos si se libera un lugar.</p>
                </div>
              </div>
            )}
            {myStatus === ParticipantStatus.REJECTED && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm font-medium text-red-400">{t('requestRejected')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Participants ─────────────────────────── */}
        <div className={`${CARD} mb-5`}>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            {t('participants')} ({approved.length}/{match.maxPlayers})
          </h2>
          {approved.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Aún no hay jugadores confirmados</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {approved.map((p) => {
                const teamConfig = p.team ? TEAM_COLORS[p.team] : null;
                const isMe = p.userId === user?.id;
                const isGuest = p.participantType === 'GUEST';
                const canLink = !isMe && !isGuest && !!p.userId;
                const avatar = (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {participantInitials(p)}
                  </div>
                );
                const meta = (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {isMe ? <span className="text-teal-400">Tú</span> : participantName(p)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isGuest && <span className="text-xs text-slate-500">{t('guest')}</span>}
                      {p.userId === match.adminUserId && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-teal-400 font-medium">
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
                );
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl">
                    {canLink ? (
                      <Link href={`/profile/${p.userId}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        {avatar}{meta}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {avatar}{meta}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={p.team ?? ''}
                          disabled={!!actionLoading}
                          onChange={(e) => handleChangeTeam(p.id, e.target.value)}
                          className="text-xs bg-slate-700 border border-slate-600 text-white rounded-lg px-1.5 py-1 focus:border-teal-500 focus:outline-none disabled:opacity-50"
                        >
                          <option value="">Sin equipo</option>
                          <option value="TEAM_A">Eq. A</option>
                          <option value="TEAM_B">Eq. B</option>
                        </select>
                        {p.userId !== match.adminUserId && (
                          <button
                            onClick={() => handleRemove(p.id)}
                            disabled={!!actionLoading}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        </div>

        {/* ── Result display ───────────────────────── */}
        {match.result && (
          <div className={`${CARD} mb-5 border-amber-500/30`}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Resultado</h2>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-slate-400">Ganador:</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${match.result.winnerTeam === 'TEAM_A' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                {match.result.winnerTeam === 'TEAM_A' ? 'Equipo A' : 'Equipo B'}
              </span>
            </div>
            {match.result.sets.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {match.result.sets.map((s) => (
                  <div key={s.setNumber} className="flex flex-col items-center bg-slate-700/60 rounded-xl px-4 py-3 border border-slate-600/50 min-w-[72px]">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Set {s.setNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-black ${s.teamAScore > s.teamBScore ? 'text-blue-400' : 'text-slate-400'}`}>{s.teamAScore}</span>
                      <span className="text-slate-600 font-bold text-lg">–</span>
                      <span className={`text-xl font-black ${s.teamBScore > s.teamAScore ? 'text-orange-400' : 'text-slate-400'}`}>{s.teamBScore}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-[9px] text-blue-400/60 font-medium">A</span>
                      <span className="text-[9px] text-orange-400/60 font-medium">B</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Admin panel ──────────────────────────── */}
        {isAdmin && (
          <div className="space-y-5">

            {/* Team B challenge (pairs mode) */}
            {isTeamVsTeam && (
              <div className={CARD}>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  {t('teamBLabel')}
                  {hasPendingChallenge && (
                    <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingTeamB.length}
                    </span>
                  )}
                </h2>
                {hasPendingChallenge ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {pendingTeamB.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                            {getInitials(p.userId)}
                          </div>
                          <p className="text-sm font-medium text-white flex-1 truncate">{getName(p.userId)}</p>
                          <span className="text-xs text-violet-400 font-medium">Desafiante</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="primary" className="flex-1" onClick={handleApproveChallenge} isLoading={actionLoading === 'approveChallenge'}>
                        {t('challengeApproveBtn')}
                      </Button>
                      <Button variant="danger" className="flex-1" onClick={handleRejectChallenge} isLoading={actionLoading === 'rejectChallenge'}>
                        {t('challengeRejectBtn')}
                      </Button>
                    </div>
                  </div>
                ) : hasApprovedTeamB ? (
                  <div className="space-y-2">
                    {approvedTeamB.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                          {getInitials(p.userId)}
                        </div>
                        <p className="text-sm font-medium text-white flex-1 truncate">{getName(p.userId)}</p>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t('noChallengeYet')}</p>
                )}
              </div>
            )}

            {/* Pending requests */}
            <div className={CARD}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                {t('pendingRequests')}
                {pending.length > 0 && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pending.length}
                  </span>
                )}
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-slate-500">{t('noPendingRequests')}</p>
              ) : (
                <div className="space-y-2">
                  {pending.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
                        {getInitials(p.userId)}
                      </div>
                      <p className="text-sm font-medium text-white flex-1 truncate">{getName(p.userId)}</p>
                      <div className="flex items-center gap-2">
                        <select
                          className={`${SELECT} text-xs py-1.5`}
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
            </div>

            {/* Waitlist */}
            {waitlisted.length > 0 && (
              <div className={CARD}>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5" />
                  Lista de espera
                  <span className="bg-slate-600/40 text-slate-400 border border-slate-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {waitlisted.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {waitlisted.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-slate-600/50 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
                        {getInitials(p.userId)}
                      </div>
                      <p className="text-sm font-medium text-slate-300 flex-1 truncate">{getName(p.userId)}</p>
                      <span className="text-xs text-slate-500 font-medium">En espera</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3">Si alguien abandona, el primero de la lista recibe una invitación automática.</p>
              </div>
            )}

            {/* Sent invitations */}
            {invitedPending.length > 0 && (
              <div className={CARD}>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('invitedPending')}</h2>
                <div className="space-y-2">
                  {invitedPending.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-teal-500/10 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0">
                        {getInitials(p.userId)}
                      </div>
                      <p className="text-sm font-medium text-white flex-1 truncate">{getName(p.userId)}</p>
                      <span className="text-xs text-teal-400 font-medium">Esperando respuesta</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite player */}
            <div className={CARD}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('invitePlayer')}</h2>
              <div className="flex gap-2">
                <input
                  placeholder={t('inviteUserId')}
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  className={`flex-1 ${INPUT}`}
                />
                <select value={inviteTeam} onChange={(e) => setInviteTeam(e.target.value)} className={SELECT}>
                  <option value="">Sin equipo</option>
                  <option value="TEAM_A">Equipo A</option>
                  <option value="TEAM_B">Equipo B</option>
                </select>
                <Button variant="primary" onClick={handleInvite} isLoading={actionLoading === 'invite'} disabled={!inviteUserId.trim()}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add guest */}
            <div className={CARD}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('addGuest')}</h2>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input placeholder={t('guestFirstName')} value={guestFirst} onChange={(e) => setGuestFirst(e.target.value)} className={INPUT} />
                <input placeholder={t('guestLastName')}  value={guestLast}  onChange={(e) => setGuestLast(e.target.value)}  className={INPUT} />
              </div>
              <div className="flex gap-2">
                <select value={guestTeam} onChange={(e) => setGuestTeam(e.target.value)} className={`flex-1 ${SELECT}`}>
                  <option value="">Sin equipo</option>
                  <option value="TEAM_A">Equipo A</option>
                  <option value="TEAM_B">Equipo B</option>
                </select>
                <Button variant="primary" onClick={handleAddGuest} isLoading={actionLoading === 'guest'} disabled={!guestFirst.trim() || !guestLast.trim()}>
                  {t('addGuestBtn')}
                </Button>
              </div>
            </div>

            {/* Record result */}
            {(match.status === 'IN_PROGRESS' || match.status === 'FULL' || match.status === 'OPEN') && !match.result && (
              <div className={CARD}>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registrar resultado</h2>
                <p className="text-xs text-slate-500 mb-4">Los sets son opcionales. Solo el equipo ganador es obligatorio.</p>
                <div className="space-y-3">
                  {resultSets.map((set, i) => (
                    <div key={set.setNumber} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 w-12 shrink-0">Set {set.setNumber}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-xs text-blue-400 font-semibold w-14">Eq. A</span>
                        <input
                          type="number" min={0} placeholder="0"
                          value={set.teamAScore}
                          onChange={(e) => setResultSets((prev) => prev.map((s, j) => j === i ? { ...s, teamAScore: e.target.value } : s))}
                          className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 text-white rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-slate-600 font-bold">–</span>
                        <input
                          type="number" min={0} placeholder="0"
                          value={set.teamBScore}
                          onChange={(e) => setResultSets((prev) => prev.map((s, j) => j === i ? { ...s, teamBScore: e.target.value } : s))}
                          className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 text-white rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                        />
                        <span className="text-xs text-orange-400 font-semibold w-14 text-right">Eq. B</span>
                      </div>
                      {resultSets.length > 1 && (
                        <button onClick={() => setResultSets((prev) => prev.filter((_, j) => j !== i))}
                          className="text-slate-500 hover:text-red-400 transition-colors text-xs px-1">✕</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setResultSets((prev) => [...prev, { setNumber: prev.length + 1, teamAScore: '', teamBScore: '' }])}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                  >
                    + Añadir set
                  </button>
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                    <select
                      value={resultWinner}
                      onChange={(e) => setResultWinner(e.target.value as Team)}
                      className={`flex-1 ${SELECT}`}
                    >
                      <option value="">— Equipo ganador —</option>
                      <option value="TEAM_A">Equipo A</option>
                      <option value="TEAM_B">Equipo B</option>
                    </select>
                    <Button variant="primary" onClick={handleRecordResult} isLoading={actionLoading === 'result'} disabled={!resultWinner}>
                      Guardar resultado
                    </Button>
                  </div>
                </div>
              </div>
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

            {/* Rematch */}
            {(match.status === 'COMPLETED' || match.status === 'CANCELLED') && (
              <div className={CARD}>
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className="w-4 h-4 text-teal-400" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revancha</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Crea un nuevo partido con la misma configuración. Los participantes recibirán una invitación.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
                    <input
                      type="date"
                      value={rematchDate}
                      onChange={(e) => setRematchDate(e.target.value)}
                      className={`w-full ${INPUT} [color-scheme:dark]`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hora</label>
                    <select value={rematchTime} onChange={(e) => setRematchTime(e.target.value)} className={`w-full ${SELECT}`}>
                      <option value="">Elegí hora</option>
                      {Array.from({ length: 36 }, (_, i) => {
                        const total = 6 * 60 + i * 30;
                        const h = String(Math.floor(total / 60)).padStart(2, '0');
                        const m = String(total % 60).padStart(2, '0');
                        return `${h}:${m}`;
                      }).map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleRematch}
                  isLoading={actionLoading === 'rematch'}
                  disabled={!rematchDate || !rematchTime}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Crear revancha
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
