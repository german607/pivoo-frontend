'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import {
  Tournament,
  TournamentMatch,
  TournamentStatus,
  TournamentParticipantStatus,
  UserRole,
} from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button, Skeleton } from '@/components/ui';
import { Link } from '@/navigation';
import { cn } from '@/utils/cn';
import {
  Trophy, Users, Calendar, CheckCircle, XCircle, Clock,
  Medal, Star, CalendarClock, MapPin, ArrowLeft, Shield,
} from 'lucide-react';

interface Court { id: string; name: string; indoor: boolean }

type Tab = 'info' | 'registrations' | 'bracket' | 'standings';

const STATUS_CONFIG: Record<TournamentStatus, { label: string; dot: string; pill: string }> = {
  [TournamentStatus.DRAFT]:               { label: 'Borrador',            dot: 'bg-slate-400',   pill: 'bg-slate-400/20 text-slate-400 border border-slate-400/30' },
  [TournamentStatus.REGISTRATION_OPEN]:   { label: 'Inscripción abierta', dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  [TournamentStatus.REGISTRATION_CLOSED]: { label: 'Inscr. cerrada',      dot: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 border border-amber-200' },
  [TournamentStatus.IN_PROGRESS]:         { label: 'En curso',            dot: 'bg-blue-400',    pill: 'bg-blue-50 text-blue-700 border border-blue-200' },
  [TournamentStatus.COMPLETED]:           { label: 'Finalizado',          dot: 'bg-purple-400',  pill: 'bg-purple-50 text-purple-700 border border-purple-200' },
  [TournamentStatus.CANCELLED]:           { label: 'Cancelado',           dot: 'bg-red-400',     pill: 'bg-red-50 text-red-600 border border-red-200' },
};

const SPORT_BANNER: Record<string, { gradient: string; emoji: string }> = {
  TENNIS: { gradient: 'from-yellow-400 via-lime-400 to-green-500', emoji: '🎾' },
  PADEL:  { gradient: 'from-teal-400 via-cyan-500 to-blue-500',   emoji: '🏓' },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN:        'Round Robin',
};

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, patch, put, delete: del } = useApi();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sportName, setSportName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [actionLoading, setActionLoading] = useState('');

  const TAPI = { baseUrl: process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL };

  const allUserIds = [
    ...(tournament?.registrations?.map((r) => r.userId) ?? []),
    ...(tournament?.results?.map((r) => r.userId) ?? []),
  ];
  const { getName, getInitials } = useUserProfiles(allUserIds);

  const isComplexAdmin = user?.role === UserRole.COMPLEX && user?.complexId === tournament?.complexId;
  const myReg = tournament?.registrations?.find((r) => r.userId === user?.id);
  const approved = tournament?.registrations?.filter((r) => r.status === TournamentParticipantStatus.APPROVED) ?? [];
  const approvedCount = approved.length;

  useEffect(() => {
    if (!authLoading) loadTournament();
  }, [id, authLoading]);

  useEffect(() => {
    if (!tournament?.complexId) return;
    get<{ courts: Court[] }>(`/api/v1/complexes/${tournament.complexId}`, {
      baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL,
    }).then((c) => setCourts(c.courts ?? [])).catch(() => {});
  }, [tournament?.complexId]);

  useEffect(() => {
    if (!tournament?.sportId) return;
    get<{ id: string; name: string }[]>('/api/v1/sports', {
      baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL,
    }).then((sports) => {
      const s = (sports ?? []).find((sp) => sp.id === tournament.sportId);
      if (s) setSportName(s.name);
    }).catch(() => {});
  }, [tournament?.sportId]);

  const loadTournament = async () => {
    setIsLoading(true); setLoadError('');
    try {
      setTournament(await get<Tournament>(`/api/v1/tournaments/${id}`, TAPI));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar el torneo');
    } finally {
      setIsLoading(false);
    }
  };

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try { await fn(); await loadTournament(); }
    finally { setActionLoading(''); }
  };

  const handleRegister     = () => act('register', () => post(`/api/v1/tournaments/${id}/register`, {}, TAPI));
  const handleWithdraw     = () => act('withdraw', () => del(`/api/v1/tournaments/${id}/register`, TAPI));
  const handleApprove      = (uid: string) => act(uid, () => patch(`/api/v1/tournaments/${id}/registrations/${uid}/approve`, {}, TAPI));
  const handleReject       = (uid: string) => act(uid, () => patch(`/api/v1/tournaments/${id}/registrations/${uid}/reject`, {}, TAPI));
  const handleOpenReg      = () => act('status', () => patch(`/api/v1/tournaments/${id}/open-registration`, {}, TAPI));
  const handleCancelTournament = () => { if (!confirm('¿Cancelar este torneo? Esta acción no se puede deshacer.')) return; act('cancel', () => patch(`/api/v1/tournaments/${id}/cancel`, {}, TAPI)); };
  const handleGenBracket   = () => act('bracket', () => post(`/api/v1/tournaments/${id}/bracket`, {}, TAPI));
  const handleFinalize     = () => act('status', () => post(`/api/v1/tournaments/${id}/finalize`, {}, TAPI));
  const handleSetRankingPoints = (points: { position: number; points: number }[]) =>
    act('rankingPoints', () => put(`/api/v1/tournaments/${id}/ranking-points`, { points }, TAPI));
  const handleScore        = (matchId: string, winnerId: string, sets: { player1: string; player2: string }[]) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/score`, { winnerId, sets }, TAPI));
  const handleAssignPlayers = (matchId: string, player1Id: string | null, player2Id: string | null) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/players`, { player1Id, player2Id }, TAPI));
  const handleScheduleMatch = (matchId: string, scheduledAt: string, courtId?: string) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/schedule`, { scheduledAt, ...(courtId ? { courtId } : {}) }, TAPI));

  // ── Loading ──────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold mb-2">Torneo no encontrado</p>
          {loadError && <p className="text-sm text-red-500 mb-4">{loadError}</p>}
          <Link href="/tournaments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            ← Volver a torneos
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[tournament.status];
  const banner = SPORT_BANNER[sportName] ?? { gradient: 'from-slate-700 to-slate-900', emoji: '🏆' };
  const pct    = Math.min(100, Math.round((approvedCount / tournament.maxParticipants) * 100));
  const isFull = approvedCount >= tournament.maxParticipants;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info',          label: 'Información' },
    { key: 'registrations', label: `Participantes${(tournament.registrations?.length ?? 0) > 0 ? ` (${tournament.registrations!.length})` : ''}` },
    { key: 'bracket',       label: 'Cuadro' },
    { key: 'standings',     label: 'Clasificación' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/tournaments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver a torneos
        </Link>

        {/* ── Hero ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-card mb-6">
          {/* Sport banner */}
          <div className={cn('relative h-36 bg-gradient-to-br overflow-hidden', banner.gradient)}>
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-white/10" />

            {/* Sport emoji */}
            <div className="absolute left-8 bottom-5 text-6xl drop-shadow-lg select-none leading-none">{banner.emoji}</div>

            {/* Status */}
            <div className="absolute top-4 right-4">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm', status.pill)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', tournament.status === TournamentStatus.REGISTRATION_OPEN && 'animate-pulse', status.dot)} />
                {status.label}
              </span>
            </div>

            {/* Admin badge */}
            {isComplexAdmin && (
              <div className="absolute top-4 left-8">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white/90 bg-white/15 border border-white/25 rounded-full backdrop-blur-sm">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-7">
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {FORMAT_LABEL[tournament.format] ?? tournament.format}
                  </span>
                  {sportName && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {sportName}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {tournament.name}
                </h1>
                {tournament.complex && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {tournament.complex.city} · {tournament.complex.name}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {!isComplexAdmin && tournament.status === TournamentStatus.REGISTRATION_OPEN && !myReg && (
                  <Button variant="primary" size="lg" onClick={handleRegister} isLoading={actionLoading === 'register'}>
                    Inscribirse
                  </Button>
                )}
                {!isComplexAdmin && myReg && (
                  <div className="flex flex-col gap-2">
                    <RegistrationStatusPill status={myReg.status as TournamentParticipantStatus} />
                    {(myReg.status === TournamentParticipantStatus.PENDING || myReg.status === TournamentParticipantStatus.APPROVED) &&
                      tournament.status === TournamentStatus.REGISTRATION_OPEN && (
                      <Button variant="danger" size="sm" onClick={handleWithdraw} isLoading={actionLoading === 'withdraw'}>
                        Retirar inscripción
                      </Button>
                    )}
                  </div>
                )}
                {isComplexAdmin && (
                  <div className="flex flex-col gap-2">
                    {tournament.status === TournamentStatus.DRAFT && (
                      <Button variant="primary" size="sm" onClick={handleOpenReg} isLoading={actionLoading === 'status'}>
                        Abrir inscripciones
                      </Button>
                    )}
                    {tournament.status === TournamentStatus.REGISTRATION_OPEN && (
                      <Button variant="primary" size="sm" onClick={handleGenBracket} isLoading={actionLoading === 'bracket'}>
                        Generar cuadro
                      </Button>
                    )}
                    {tournament.status === TournamentStatus.IN_PROGRESS && (
                      <Button variant="outline" size="sm" onClick={handleFinalize} isLoading={actionLoading === 'status'}>
                        Finalizar torneo
                      </Button>
                    )}
                    {(tournament.status === TournamentStatus.DRAFT || tournament.status === TournamentStatus.REGISTRATION_OPEN) && (
                      <Button variant="danger" size="sm" onClick={handleCancelTournament} isLoading={actionLoading === 'cancel'}>
                        Cancelar torneo
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t border-slate-100 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{approvedCount}/{tournament.maxParticipants}</span>
                <span className="text-slate-400">participantes</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
              {tournament.registrationDeadline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-600 font-medium">
                    Inscripción hasta {new Date(tournament.registrationDeadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">{pct}% de plazas ocupadas</span>
                <span className={cn('font-bold', isFull ? 'text-amber-600' : 'text-emerald-600')}>
                  {isFull ? 'Completo' : `${tournament.maxParticipants - approvedCount} plazas libres`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700',
                    isFull ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                           : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl mb-5 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 min-w-fit px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-150',
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 lg:p-8">
          {activeTab === 'info' && (
            <InfoTab
              tournament={tournament}
              isComplexAdmin={isComplexAdmin}
              actionLoading={actionLoading}
              onSetRankingPoints={handleSetRankingPoints}
            />
          )}
          {activeTab === 'registrations' && (
            <RegistrationsTab
              tournament={tournament}
              isComplexAdmin={isComplexAdmin}
              actionLoading={actionLoading}
              onApprove={handleApprove}
              onReject={handleReject}
              getName={getName}
              getInitials={getInitials}
            />
          )}
          {activeTab === 'bracket' && (
            <BracketTab
              tournament={tournament}
              courts={courts}
              isComplexAdmin={isComplexAdmin}
              actionLoading={actionLoading}
              onSaveScore={handleScore}
              onAssignPlayers={handleAssignPlayers}
              onScheduleMatch={handleScheduleMatch}
              getName={getName}
              getInitials={getInitials}
            />
          )}
          {activeTab === 'standings' && (
            <StandingsTab tournament={tournament} getName={getName} getInitials={getInitials} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info tab
// ─────────────────────────────────────────────────────────────────────────────

function InfoTab({ tournament, isComplexAdmin, actionLoading, onSetRankingPoints }: {
  tournament: Tournament;
  isComplexAdmin: boolean;
  actionLoading: string;
  onSetRankingPoints: (points: { position: number; points: number }[]) => void;
}) {
  const [editingPoints, setEditingPoints] = useState(false);
  const [pointsDraft, setPointsDraft] = useState<{ position: number; points: number }[]>(
    tournament.rankingPoints?.length
      ? tournament.rankingPoints
      : [{ position: 1, points: 100 }, { position: 2, points: 60 }, { position: 3, points: 30 }]
  );

  return (
    <div className="space-y-8">
      {tournament.description && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</h3>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{tournament.description}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Puntos de ranking por posición
          </h3>
          {isComplexAdmin && !editingPoints && (
            <button onClick={() => setEditingPoints(true)}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Editar
            </button>
          )}
        </div>

        {editingPoints ? (
          <div className="space-y-2">
            {pointsDraft.map((rp, i) => (
              <div key={rp.position} className="flex items-center gap-3">
                <span className="text-sm text-slate-500 w-24 shrink-0">{rp.position}ª posición</span>
                <input
                  type="number" min={0}
                  value={rp.points}
                  onChange={(e) => setPointsDraft((prev) => prev.map((p, j) => j === i ? { ...p, points: Number(e.target.value) } : p))}
                  className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-bold text-center focus:border-teal-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400">pts</span>
                <button onClick={() => setPointsDraft((prev) => prev.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-400 transition-colors text-xs ml-auto">✕</button>
              </div>
            ))}
            <button
              onClick={() => setPointsDraft((prev) => [...prev, { position: prev.length + 1, points: 0 }])}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              + Añadir posición
            </button>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={actionLoading === 'rankingPoints'}
                onClick={() => { onSetRankingPoints(pointsDraft); setEditingPoints(false); }}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-500/20 disabled:opacity-40 transition-all">
                {actionLoading === 'rankingPoints' ? '···' : 'Guardar'}
              </button>
              <button onClick={() => setEditingPoints(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        ) : (tournament.rankingPoints?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tournament.rankingPoints!.map((rp, i) => (
              <div key={rp.position}
                className={cn(
                  'relative rounded-2xl p-5 text-center border',
                  i === 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                  : i === 1 ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200'
                  : 'bg-gradient-to-br from-teal-50 to-white border-teal-100'
                )}
              >
                <div className={cn('text-3xl font-black',
                  i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-600' : 'text-teal-600'
                )}>{rp.points}</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">pts ranking</div>
                <div className="text-xs text-slate-400">{rp.position}ª posición</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">
            {isComplexAdmin ? 'Sin puntos de ranking configurados. Haz clic en Editar para añadir.' : 'Sin puntos de ranking configurados.'}
          </p>
        )}
      </div>

      {!tournament.description && (tournament.rankingPoints?.length ?? 0) === 0 && !isComplexAdmin && (
        <p className="text-slate-400 text-center py-8">Sin información adicional</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registrations tab
// ─────────────────────────────────────────────────────────────────────────────

function RegistrationsTab({
  tournament, isComplexAdmin, actionLoading, onApprove, onReject, getName, getInitials,
}: {
  tournament: Tournament; isComplexAdmin: boolean; actionLoading: string;
  onApprove: (uid: string) => void; onReject: (uid: string) => void;
  getName: (uid: string | null) => string; getInitials: (uid: string | null) => string;
}) {
  const regs     = tournament.registrations ?? [];
  const pending  = regs.filter((r) => r.status === TournamentParticipantStatus.PENDING);
  const approved = regs.filter((r) => r.status === TournamentParticipantStatus.APPROVED);
  const rejected = regs.filter((r) => r.status === TournamentParticipantStatus.REJECTED);

  if (regs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-400 font-semibold">Aún no hay participantes inscritos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending */}
      {isComplexAdmin && pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Pendientes de aprobación ({pending.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{getName(r.userId)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.registeredAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" isLoading={actionLoading === r.userId}
                    onClick={() => onApprove(r.userId)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="danger" isLoading={actionLoading === r.userId}
                    onClick={() => onReject(r.userId)} icon={<XCircle className="w-3.5 h-3.5" />}>
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Aprobados — {approved.length}/{tournament.maxParticipants}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {approved.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {r.seed ?? i + 1}
                </span>
                <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} size="sm" />
                <span className="font-semibold text-slate-800 text-sm flex-1 truncate">{getName(r.userId)}</span>
                {r.seed && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Star className="w-3 h-3" /> #{r.seed}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rejected */}
      {isComplexAdmin && rejected.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Rechazados ({rejected.length})</h3>
          </div>
          <div className="space-y-1.5">
            {rejected.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl opacity-60">
                <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} size="sm" />
                <span className="text-sm text-slate-600">{getName(r.userId)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bracket tab
// ─────────────────────────────────────────────────────────────────────────────

function BracketTab({
  tournament, courts, isComplexAdmin, actionLoading,
  onSaveScore, onAssignPlayers, onScheduleMatch, getName, getInitials,
}: {
  tournament: Tournament; courts: Court[]; isComplexAdmin: boolean; actionLoading: string;
  onSaveScore: (id: string, winnerId: string, sets: { player1: string; player2: string }[]) => void;
  onAssignPlayers: (matchId: string, player1Id: string | null, player2Id: string | null) => void;
  onScheduleMatch: (matchId: string, scheduledAt: string, courtId?: string) => void;
  getName: (uid: string | null) => string; getInitials: (uid: string | null) => string;
}) {
  const matches = tournament.matches ?? [];
  const [inputs, setInputs] = useState<Record<string, { s1: string; s2: string; winner: string }>>({});

  const inp = (match: TournamentMatch) =>
    inputs[match.id] ?? { s1: (match.sets ?? [])[0]?.player1 ?? '', s2: (match.sets ?? [])[0]?.player2 ?? '', winner: match.winnerId ?? '' };

  const updateInp = (match: TournamentMatch, u: Partial<{ s1: string; s2: string; winner: string }>) =>
    setInputs((p) => ({ ...p, [match.id]: { ...inp(match), ...(p[match.id] ?? {}), ...u } }));

  if (matches.length === 0) {
    if (isComplexAdmin) {
      const approvedCount = (tournament.registrations ?? []).filter(
        (r) => r.status === TournamentParticipantStatus.APPROVED
      ).length;
      return (
        <div className="py-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Pasos para activar el torneo</p>
          <div className="space-y-3">
            {[
              {
                done: approvedCount >= 2,
                step: '1',
                title: 'Aprobar participantes',
                desc: `${approvedCount} aprobados — ve a la pestaña Participantes para gestionar inscripciones`,
              },
              {
                done: false,
                step: '2',
                title: 'Generar cuadro',
                desc: 'Usa el botón Generar cuadro en la parte superior de la página',
                disabled: approvedCount < 2,
              },
            ].map((item) => (
              <div key={item.step} className={cn('flex items-center gap-4 p-4 rounded-xl border transition-opacity',
                item.done ? 'bg-emerald-50 border-emerald-200' : item.disabled ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-teal-50 border-teal-200'
              )}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  item.done ? 'bg-emerald-500 text-white' : item.disabled ? 'bg-slate-300 text-white' : 'bg-teal-500 text-white'
                )}>
                  {item.done ? '✓' : item.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-400 font-semibold">El cuadro aún no ha sido generado</p>
        <p className="text-slate-300 text-sm mt-1">El administrador del torneo lo generará pronto.</p>
      </div>
    );
  }

  const rounds       = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);
  const pendingMatches = matches.filter((m) => m.status !== 'COMPLETED');
  const approvedRegs   = (tournament.registrations ?? []).filter((r) => r.status === TournamentParticipantStatus.APPROVED);

  if (tournament.format === 'ROUND_ROBIN') {
    return (
      <div className="space-y-8">
        {isComplexAdmin && pendingMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partidos pendientes — anotar resultado</p>
            </div>
            <div className="space-y-3">
              {pendingMatches.map((match) => (
                <ScoreForm key={match.id} match={match} approved={approvedRegs} courts={courts} getName={getName} getInitials={getInitials}
                  inp={inp(match)} onUpdate={(u) => updateInp(match, u)}
                  onSave={() => { const i = inp(match); onSaveScore(match.id, i.winner, [{ player1: i.s1, player2: i.s2 }]); }}
                  onAssignPlayers={(p1, p2) => onAssignPlayers(match.id, p1, p2)}
                  onSchedule={(at, cid) => onScheduleMatch(match.id, at, cid)}
                  isLoading={actionLoading === match.id}
                />
              ))}
            </div>
          </div>
        )}
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber);
          const doneCount = roundMatches.filter((m) => m.winnerId).length;
          return (
            <div key={round}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jornada {round}</h3>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                  doneCount === roundMatches.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                )}>{doneCount}/{roundMatches.length} completados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roundMatches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} getName={getName} getInitials={getInitials} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single elimination visual tree
  const totalRounds = rounds.length;
  const roundLabel  = (r: number) => {
    const fromEnd = totalRounds - rounds.indexOf(r);
    if (fromEnd === 1) return 'Final';
    if (fromEnd === 2) return 'Semifinal';
    if (fromEnd === 3) return 'Cuartos';
    return `Ronda ${r}`;
  };

  const CARD_H = 96, CARD_GAP = 12, ROUND_W = 224, CONN_W = 48;
  const round1Count = matches.filter((m) => m.round === rounds[0]).length;
  const slotH1  = CARD_H + CARD_GAP;
  const totalH  = round1Count * slotH1;

  return (
    <div className="space-y-8">
      {isComplexAdmin && pendingMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partidos pendientes — anotar resultado</p>
          </div>
          <div className="space-y-3">
            {pendingMatches.map((match) => (
              <ScoreForm key={match.id} match={match} approved={approvedRegs} courts={courts} getName={getName} getInitials={getInitials}
                inp={inp(match)} onUpdate={(u) => updateInp(match, u)}
                onSave={() => { const i = inp(match); onSaveScore(match.id, i.winner, [{ player1: i.s1, player2: i.s2 }]); }}
                onAssignPlayers={(p1, p2) => onAssignPlayers(match.id, p1, p2)}
                onSchedule={(at, cid) => onScheduleMatch(match.id, at, cid)}
                isLoading={actionLoading === match.id}
              />
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex mb-4">
          {rounds.map((r, ri) => (
            <div key={r} style={{ width: ROUND_W + (ri < totalRounds - 1 ? CONN_W : 0) }}>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{roundLabel(r)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex" style={{ height: totalH }}>
          {rounds.map((round, ri) => {
            const roundMatches = matches.filter((m) => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber);
            const slotH = slotH1 * Math.pow(2, ri);
            return (
              <div key={round} className="flex shrink-0">
                <div style={{ width: ROUND_W, height: totalH, position: 'relative' }}>
                  {roundMatches.map((match, mi) => {
                    const topPos = mi * slotH + (slotH - CARD_H) / 2;
                    return (
                      <div key={match.id} style={{ position: 'absolute', top: topPos, left: 4, right: 4 }}>
                        <BracketMatchCard match={match} getName={getName} getInitials={getInitials} />
                      </div>
                    );
                  })}
                </div>
                {ri < totalRounds - 1 && (
                  <svg width={CONN_W} height={totalH} className="shrink-0" style={{ overflow: 'visible' }}>
                    {roundMatches.map((match, mi) => {
                      const matchCenterY = mi * slotH + slotH / 2;
                      const nextSlotH    = slotH * 2;
                      const nextCenterY  = Math.floor(mi / 2) * nextSlotH + nextSlotH / 2;
                      const midX = CONN_W / 2;
                      const isWinner = !!match.winnerId;
                      return (
                        <path key={match.id}
                          d={`M 0 ${matchCenterY} H ${midX} V ${nextCenterY} H ${CONN_W}`}
                          stroke={isWinner ? '#14b8a6' : '#e2e8f0'}
                          strokeWidth={isWinner ? 2 : 1.5}
                          fill="none"
                          strokeDasharray={isWinner ? undefined : '4 3'}
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bracket match card (read-only)
// ─────────────────────────────────────────────────────────────────────────────

function BracketMatchCard({ match, getName, getInitials }: {
  match: TournamentMatch;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const isCompleted = match.status === 'COMPLETED';
  const scoreStr = (match.sets ?? []).length > 0
    ? match.sets.map((s) => `${s.player1}-${s.player2}`).join(', ')
    : null;

  return (
    <div className={cn('rounded-xl border text-sm overflow-hidden bg-white',
      isCompleted ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-200'
    )}>
      <PlayerRow userId={match.player1Id}
        isWinner={match.winnerId === match.player1Id && !!match.player1Id}
        score={scoreStr ? match.sets.map((s) => s.player1).join(' ') : undefined}
        getName={getName} getInitials={getInitials}
      />
      <div className="border-t border-slate-100 mx-3" />
      <PlayerRow userId={match.player2Id}
        isWinner={match.winnerId === match.player2Id && !!match.player2Id}
        score={scoreStr ? match.sets.map((s) => s.player2).join(' ') : undefined}
        getName={getName} getInitials={getInitials}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score form (admin)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreForm({
  match, approved, courts, getName, getInitials, inp, onUpdate, onSave, onAssignPlayers, onSchedule, isLoading,
}: {
  match: TournamentMatch; approved: { userId: string }[]; courts: Court[];
  getName: (uid: string | null) => string; getInitials: (uid: string | null) => string;
  inp: { s1: string; s2: string; winner: string };
  onUpdate: (u: Partial<{ s1: string; s2: string; winner: string }>) => void;
  onSave: () => void;
  onAssignPlayers: (p1: string | null, p2: string | null) => void;
  onSchedule: (scheduledAt: string, courtId?: string) => void;
  isLoading: boolean;
}) {
  const [p1Sel, setP1Sel]     = useState(match.player1Id ?? '');
  const [p2Sel, setP2Sel]     = useState(match.player2Id ?? '');
  const toLocalDt = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [schedDt, setSchedDt]     = useState(toLocalDt(match.scheduledAt));
  const [schedCourt, setSchedCourt] = useState(match.courtId ?? '');

  const playersChanged = p1Sel !== (match.player1Id ?? '') || p2Sel !== (match.player2Id ?? '');
  const schedChanged   = schedDt !== toLocalDt(match.scheduledAt) || schedCourt !== (match.courtId ?? '');
  const bothAssigned   = !!match.player1Id && !!match.player2Id;

  const selectCls = 'flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:border-teal-500 focus:outline-none';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Player assignment */}
      <div className="flex items-center gap-2">
        <select value={p1Sel} onChange={(e) => setP1Sel(e.target.value)} className={selectCls}>
          <option value="">— Jugador 1 —</option>
          {approved.map((r) => <option key={r.userId} value={r.userId}>{getName(r.userId)}</option>)}
        </select>
        <span className="text-slate-400 font-bold text-xs shrink-0">vs</span>
        <select value={p2Sel} onChange={(e) => setP2Sel(e.target.value)} className={selectCls}>
          <option value="">— Jugador 2 —</option>
          {approved.map((r) => <option key={r.userId} value={r.userId}>{getName(r.userId)}</option>)}
        </select>
        {playersChanged && (
          <button disabled={isLoading} onClick={() => onAssignPlayers(p1Sel || null, p2Sel || null)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
            Asignar
          </button>
        )}
      </div>

      {/* Schedule */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
        <CalendarClock className="w-4 h-4 text-slate-400 shrink-0" />
        <input type="datetime-local" value={schedDt} onChange={(e) => setSchedDt(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:border-teal-500 focus:outline-none" />
        {courts.length > 0 && (
          <select value={schedCourt} onChange={(e) => setSchedCourt(e.target.value)} className={cn(selectCls, 'py-1.5')}>
            <option value="">— Pista —</option>
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.indoor ? ' (int.)' : ' (ext.)'}</option>)}
          </select>
        )}
        {schedChanged && schedDt && (
          <button disabled={isLoading} onClick={() => onSchedule(new Date(schedDt).toISOString(), schedCourt || undefined)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
            Programar
          </button>
        )}
      </div>

      {/* Score */}
      {bothAssigned && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
          <div className="flex items-center gap-2 flex-1">
            <PlayerAvatar name={getName(match.player1Id)} initials={getInitials(match.player1Id)} size="sm" />
            <span className="text-sm font-medium text-slate-700 truncate flex-1">{getName(match.player1Id)}</span>
            <input type="number" min={0} placeholder="0" value={inp.s1} onChange={(e) => onUpdate({ s1: e.target.value })}
              className="w-12 px-1.5 py-1 border border-slate-200 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none" />
          </div>
          <span className="text-slate-300 font-bold shrink-0">–</span>
          <div className="flex items-center gap-2 flex-1 flex-row-reverse">
            <PlayerAvatar name={getName(match.player2Id)} initials={getInitials(match.player2Id)} size="sm" />
            <span className="text-sm font-medium text-slate-700 truncate flex-1 text-right">{getName(match.player2Id)}</span>
            <input type="number" min={0} placeholder="0" value={inp.s2} onChange={(e) => onUpdate({ s2: e.target.value })}
              className="w-12 px-1.5 py-1 border border-slate-200 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none" />
          </div>
        </div>
      )}

      {bothAssigned && (
        <div className="flex items-center gap-2">
          <select value={inp.winner} onChange={(e) => onUpdate({ winner: e.target.value })} className={selectCls}>
            <option value="">— Seleccionar ganador —</option>
            <option value={match.player1Id ?? ''}>{getName(match.player1Id)}</option>
            <option value={match.player2Id ?? ''}>{getName(match.player2Id)}</option>
          </select>
          <button disabled={!inp.winner || isLoading} onClick={onSave}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-md shadow-teal-500/20">
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            Guardar resultado
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ userId, isWinner, score, getName, getInitials }: {
  userId: string | null; isWinner: boolean; score?: string;
  getName: (uid: string | null) => string; getInitials: (uid: string | null) => string;
}) {
  if (!userId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-slate-300 italic text-xs">
        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 text-xs shrink-0">–</span>
        BYE
      </div>
    );
  }
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2', isWinner && 'bg-emerald-50')}>
      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isWinner ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
      )}>
        {isWinner ? '✓' : getInitials(userId)}
      </div>
      <span className={cn('text-xs font-medium truncate flex-1', isWinner ? 'text-emerald-700' : 'text-slate-700')}>
        {getName(userId)}
      </span>
      {score !== undefined && (
        <span className={cn('text-xs font-bold shrink-0', isWinner ? 'text-emerald-600' : 'text-slate-400')}>{score}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Standings tab
// ─────────────────────────────────────────────────────────────────────────────

function StandingsTab({ tournament, getName, getInitials }: {
  tournament: Tournament;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const results = tournament.results ?? [];
  const rankingPoints = tournament.rankingPoints ?? [];
  const pointsFor = (pos: number) => rankingPoints.find((rp) => rp.position === pos)?.points ?? 0;

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Medal className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-400 font-semibold">La clasificación estará disponible al finalizar el torneo</p>
      </div>
    );
  }

  const PODIUM: Record<number, { bg: string; border: string; emoji: string }> = {
    1: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',   border: 'border-amber-200',  emoji: '🥇' },
    2: { bg: 'bg-gradient-to-r from-slate-50 to-gray-50',     border: 'border-slate-200',  emoji: '🥈' },
    3: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50',   border: 'border-orange-200', emoji: '🥉' },
  };

  return (
    <div className="space-y-2">
      {[...results].sort((a, b) => a.position - b.position).map((r) => {
        const pts   = pointsFor(r.position);
        const style = PODIUM[r.position];
        return (
          <div key={r.userId}
            className={cn('flex items-center gap-4 p-4 rounded-xl border',
              style ? `${style.bg} ${style.border}` : 'bg-white border-slate-100'
            )}
          >
            <div className="w-10 text-center shrink-0">
              {style
                ? <span className="text-2xl">{style.emoji}</span>
                : <span className="text-lg font-black text-slate-400">{r.position}º</span>}
            </div>
            <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} />
            <span className="font-semibold text-slate-900 flex-1">{getName(r.userId)}</span>
            {pts > 0 && (
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-teal-600">{pts}</span>
                <span className="text-xs text-slate-400 ml-1">pts</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function PlayerAvatar({ name, initials, size = 'md' }: { name: string; initials: string; size?: 'sm' | 'md' }) {
  const sz  = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const hue = Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
  return (
    <div className={cn(sz, 'rounded-full flex items-center justify-center font-bold text-white shrink-0')}
      style={{ backgroundColor: `hsl(${hue}, 55%, 50%)` }}>
      {initials}
    </div>
  );
}

function RegistrationStatusPill({ status }: { status: TournamentParticipantStatus }) {
  if (status === TournamentParticipantStatus.APPROVED) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
        <CheckCircle className="w-4 h-4" /> Inscripción aprobada
      </div>
    );
  }
  if (status === TournamentParticipantStatus.REJECTED) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
        <XCircle className="w-4 h-4" /> Inscripción rechazada
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
      <Clock className="w-4 h-4" /> Pendiente de aprobación
    </div>
  );
}
