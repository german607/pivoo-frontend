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
import { useTranslations } from 'next-intl';
import {
  Trophy, Users, Calendar, CheckCircle, XCircle, Clock,
  ChevronRight, Medal, Star, CalendarClock,
} from 'lucide-react';

interface Court {
  id: string;
  name: string;
  indoor: boolean;
}

type Tab = 'info' | 'registrations' | 'bracket' | 'standings';

const STATUS_BADGE: Record<TournamentStatus, { label: string; bg: string; text: string }> = {
  [TournamentStatus.DRAFT]:                { label: 'Borrador',               bg: 'bg-gray-100',    text: 'text-gray-600' },
  [TournamentStatus.REGISTRATION_OPEN]:    { label: 'Inscripción abierta',    bg: 'bg-emerald-100', text: 'text-emerald-700' },
  [TournamentStatus.REGISTRATION_CLOSED]:  { label: 'Inscripciones cerradas', bg: 'bg-amber-100',   text: 'text-amber-700' },
  [TournamentStatus.IN_PROGRESS]:          { label: 'En curso',               bg: 'bg-blue-100',    text: 'text-blue-700' },
  [TournamentStatus.COMPLETED]:            { label: 'Finalizado',             bg: 'bg-purple-100',  text: 'text-purple-700' },
  [TournamentStatus.CANCELLED]:            { label: 'Cancelado',              bg: 'bg-red-100',     text: 'text-red-600' },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN: 'Round Robin',
};

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, patch } = useApi();
  const t = useTranslations('tournamentDetail');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [actionLoading, setActionLoading] = useState('');

  const TAPI = { baseUrl: process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL };

  // Resolve all userIds to names
  const allUserIds = [
    ...(tournament?.registrations?.map((r) => r.userId) ?? []),
    ...(tournament?.results?.map((r) => r.userId) ?? []),
  ];
  const { getName, getInitials } = useUserProfiles(allUserIds);

  const isComplexAdmin = user?.role === UserRole.COMPLEX && user?.complexId === tournament?.complexId;
  const myReg = tournament?.registrations?.find((r) => r.userId === user?.id);
  const approved = tournament?.registrations?.filter((r) => r.status === TournamentParticipantStatus.APPROVED) ?? [];
  const approvedCount = approved.length;

  // Load tournament as soon as auth state is resolved — GET is public, no user required
  useEffect(() => {
    if (!authLoading) loadTournament();
  }, [id, authLoading]);

  // Fetch courts once we know the complex
  useEffect(() => {
    if (!tournament?.complexId) return;
    get<{ courts: Court[] }>(`/api/v1/complexes/${tournament.complexId}`, {
      baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL,
    }).then((c) => setCourts(c.courts ?? [])).catch(() => {});
  }, [tournament?.complexId]);

  const loadTournament = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setTournament(await get<Tournament>(`/api/v1/tournaments/${id}`, TAPI));
    } catch (err) {
      console.error(err);
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

  const handleRegister      = () => act('register', () => post(`/api/v1/tournaments/${id}/register`, {}, TAPI));
  const handleApprove       = (uid: string) => act(uid, () => patch(`/api/v1/tournaments/${id}/registrations/${uid}/approve`, {}, TAPI));
  const handleReject        = (uid: string) => act(uid, () => patch(`/api/v1/tournaments/${id}/registrations/${uid}/reject`, {}, TAPI));
  const handleOpenReg       = () => act('status', () => patch(`/api/v1/tournaments/${id}/open-registration`, {}, TAPI));
  const handleGenBracket    = () => act('bracket', () => post(`/api/v1/tournaments/${id}/bracket`, {}, TAPI));
  const handleFinalize      = () => act('status', () => post(`/api/v1/tournaments/${id}/finalize`, {}, TAPI));
  const handleScore         = (matchId: string, winnerId: string, sets: { player1: string; player2: string }[]) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/score`, { winnerId, sets }, TAPI));
  const handleAssignPlayers  = (matchId: string, player1Id: string | null, player2Id: string | null) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/players`, { player1Id, player2Id }, TAPI));
  const handleScheduleMatch  = (matchId: string, scheduledAt: string, courtId?: string) =>
    act(matchId, () => patch(`/api/v1/tournaments/${id}/matches/${matchId}/schedule`, { scheduledAt, ...(courtId ? { courtId } : {}) }, TAPI));

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-12" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Torneo no encontrado</p>
          {loadError && (
            <p className="text-sm text-red-500 mb-4">{loadError}</p>
          )}
          <Link href="/tournaments" className="text-sm text-teal-600 hover:text-teal-700">
            ← Volver a torneos
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[tournament.status];
  const pct = Math.min(100, Math.round((approvedCount / tournament.maxParticipants) * 100));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tournaments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors mb-6">
          ← Volver a torneos
        </Link>

        {/* ── Hero card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="h-2 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600" />
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Icon + info */}
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {FORMAT_LABEL[tournament.format] ?? tournament.format}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-1">{tournament.name}</h1>
                  {tournament.complex && (
                    <p className="text-gray-500">{tournament.complex.city} · {tournament.complex.name}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {!isComplexAdmin && tournament.status === TournamentStatus.REGISTRATION_OPEN && !myReg && (
                  <Button variant="primary" size="lg" onClick={handleRegister} isLoading={actionLoading === 'register'}>
                    Inscribirse
                  </Button>
                )}
                {!isComplexAdmin && myReg && (
                  <RegistrationStatusPill status={myReg.status as TournamentParticipantStatus} />
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
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{approvedCount}/{tournament.maxParticipants}</span>
                <span>participantes</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
              {tournament.registrationDeadline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Inscripción hasta</span>
                  <span className="font-medium">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'short',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {tournament.status === TournamentStatus.REGISTRATION_OPEN && (
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}% de plazas ocupadas</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div className="bg-white rounded-t-2xl border border-gray-200 border-b-0">
          <div className="flex overflow-x-auto">
            {(
              [
                { key: 'info',          label: 'Información' },
                { key: 'registrations', label: `Participantes ${(tournament.registrations?.length ?? 0) > 0 ? `(${tournament.registrations!.length})` : ''}` },
                { key: 'bracket',       label: 'Cuadro' },
                { key: 'standings',     label: 'Clasificación' },
              ] as { key: Tab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ───────────────────────────── */}
        <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 p-6 lg:p-8">
          {activeTab === 'info' && <InfoTab tournament={tournament} />}
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
            <StandingsTab
              tournament={tournament}
              getName={getName}
              getInitials={getInitials}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info tab
// ─────────────────────────────────────────────────────────────────────────────

function InfoTab({ tournament }: { tournament: Tournament }) {
  return (
    <div className="space-y-8">
      {tournament.description && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{tournament.description}</p>
        </div>
      )}

      {(tournament.rankingPoints?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Puntos de ranking por posición
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tournament.rankingPoints!.map((rp) => (
              <div key={rp.position} className="relative bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-2xl p-5 text-center">
                <div className="text-3xl font-black text-teal-600">{rp.points}</div>
                <div className="text-xs text-gray-500 mt-1 font-semibold">puntos</div>
                <div className="text-xs text-gray-400">{rp.position}ª posición</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!tournament.description && (tournament.rankingPoints?.length ?? 0) === 0 && (
        <p className="text-gray-400 text-center py-8">Sin información adicional</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registrations tab
// ─────────────────────────────────────────────────────────────────────────────

function RegistrationsTab({
  tournament,
  isComplexAdmin,
  actionLoading,
  onApprove,
  onReject,
  getName,
  getInitials,
}: {
  tournament: Tournament;
  isComplexAdmin: boolean;
  actionLoading: string;
  onApprove: (uid: string) => void;
  onReject: (uid: string) => void;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const regs = tournament.registrations ?? [];
  const pending  = regs.filter((r) => r.status === TournamentParticipantStatus.PENDING);
  const approved = regs.filter((r) => r.status === TournamentParticipantStatus.APPROVED);
  const rejected = regs.filter((r) => r.status === TournamentParticipantStatus.REJECTED);

  if (regs.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Aún no hay participantes inscritos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending — complex admin only */}
      {isComplexAdmin && pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-amber-600">Pendientes de aprobación ({pending.length})</h3>
          </div>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} />
                  <div>
                    <p className="font-semibold text-gray-900">{getName(r.userId)}</p>
                    <p className="text-xs text-gray-400">
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
            <h3 className="text-sm font-bold text-emerald-600">
              Aprobados — {approved.length}/{tournament.maxParticipants} plazas
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {approved.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {r.seed ?? i + 1}
                </span>
                <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} size="sm" />
                <span className="font-medium text-gray-800 text-sm">{getName(r.userId)}</span>
                {r.seed && (
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3" /> #{r.seed}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rejected — complex admin only */}
      {isComplexAdmin && rejected.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-red-500">Rechazados ({rejected.length})</h3>
          </div>
          <div className="space-y-1.5">
            {rejected.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl opacity-60">
                <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} size="sm" />
                <span className="text-sm text-gray-600">{getName(r.userId)}</span>
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
  tournament,
  courts,
  isComplexAdmin,
  actionLoading,
  onSaveScore,
  onAssignPlayers,
  onScheduleMatch,
  getName,
  getInitials,
}: {
  tournament: Tournament;
  courts: Court[];
  isComplexAdmin: boolean;
  actionLoading: string;
  onSaveScore: (id: string, winnerId: string, sets: { player1: string; player2: string }[]) => void;
  onAssignPlayers: (matchId: string, player1Id: string | null, player2Id: string | null) => void;
  onScheduleMatch: (matchId: string, scheduledAt: string, courtId?: string) => void;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const matches = tournament.matches ?? [];
  // inputs keyed by matchId — stores score fields being edited by the admin
  const [inputs, setInputs] = useState<Record<string, { s1: string; s2: string; winner: string }>>({});

  // For each match compute the current editable state
  const inp = (match: TournamentMatch) =>
    inputs[match.id] ?? {
      s1: (match.sets ?? [])[0]?.player1 ?? '',
      s2: (match.sets ?? [])[0]?.player2 ?? '',
      winner: match.winnerId ?? '',
    };

  // Update a field for a specific match, using its current inp as base
  const updateInp = (match: TournamentMatch, u: Partial<{ s1: string; s2: string; winner: string }>) =>
    setInputs((p) => ({ ...p, [match.id]: { ...inp(match), ...(p[match.id] ?? {}), ...u } }));

  // ── Empty state ───────────────────────────────────────────────
  if (matches.length === 0) {
    if (isComplexAdmin) {
      const approvedCount = (tournament.registrations ?? []).filter(
        (r) => r.status === TournamentParticipantStatus.APPROVED
      ).length;
      return (
        <div className="py-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
            Pasos para activar el torneo
          </p>
          <div className="space-y-3">
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              approvedCount >= 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                approvedCount >= 2 ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'
              }`}>
                {approvedCount >= 2 ? '✓' : '1'}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Aprobar participantes</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {approvedCount} aprobados — ve a la pestaña <strong>Participantes</strong> para gestionar inscripciones
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              approvedCount >= 2 ? 'bg-white border-teal-200' : 'bg-gray-50 border-gray-200 opacity-60'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                approvedCount >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-300 text-white'
              }`}>2</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Generar cuadro</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Usa el botón <strong>Generar cuadro</strong> en la parte superior de la página
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-400 font-medium">El cuadro aún no ha sido generado</p>
        <p className="text-gray-300 text-sm mt-1">El administrador del torneo lo generará pronto.</p>
      </div>
    );
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);
  const pendingMatches = matches.filter((m) => m.status !== 'COMPLETED');
  const approved = (tournament.registrations ?? []).filter(
    (r) => r.status === TournamentParticipantStatus.APPROVED,
  );

  // ── ROUND ROBIN: flat jornadas + admin score panel ────────────
  if (tournament.format === 'ROUND_ROBIN') {
    return (
      <div className="space-y-8">
        {/* Score entry panel for admin */}
        {isComplexAdmin && pendingMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Partidos pendientes — anotar resultado
              </p>
            </div>
            <div className="space-y-3">
              {pendingMatches.map((match) => (
                <ScoreForm
                  key={match.id}
                  match={match}
                  approved={approved}
                  courts={courts}
                  getName={getName}
                  getInitials={getInitials}
                  inp={inp(match)}
                  onUpdate={(u) => updateInp(match, u)}
                  onSave={() => {
                    const i = inp(match);
                    onSaveScore(match.id, i.winner, [{ player1: i.s1, player2: i.s2 }]);
                  }}
                  onAssignPlayers={(p1, p2) => onAssignPlayers(match.id, p1, p2)}
                  onSchedule={(at, cid) => onScheduleMatch(match.id, at, cid)}
                  isLoading={actionLoading === match.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Jornadas read-only view */}
        {rounds.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.matchNumber - b.matchNumber);
          const doneCount = roundMatches.filter((m) => m.winnerId).length;
          return (
            <div key={round}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Jornada {round}
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  doneCount === roundMatches.length
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {doneCount}/{roundMatches.length} completados
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    getName={getName}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── SINGLE ELIMINATION: visual tree + admin score panel ───────
  const totalRounds = rounds.length;

  const roundLabel = (r: number) => {
    const fromEnd = totalRounds - rounds.indexOf(r);
    if (fromEnd === 1) return 'Final';
    if (fromEnd === 2) return 'Semifinal';
    if (fromEnd === 3) return 'Cuartos';
    return `Ronda ${r}`;
  };

  const CARD_H = 96;
  const CARD_GAP = 12;
  const ROUND_W = 224;
  const CONN_W = 48;
  const round1Count = matches.filter((m) => m.round === rounds[0]).length;
  const slotH1 = CARD_H + CARD_GAP;
  const totalH = round1Count * slotH1;

  return (
    <div className="space-y-8">
      {/* Admin score panel */}
      {isComplexAdmin && pendingMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Partidos pendientes — anotar resultado
            </p>
          </div>
          <div className="space-y-3">
            {pendingMatches.map((match) => (
              <ScoreForm
                key={match.id}
                match={match}
                approved={approved}
                courts={courts}
                getName={getName}
                getInitials={getInitials}
                inp={inp(match)}
                onUpdate={(u) => updateInp(match, u)}
                onSave={() => {
                  const i = inp(match);
                  onSaveScore(match.id, i.winner, [{ player1: i.s1, player2: i.s2 }]);
                }}
                onAssignPlayers={(p1, p2) => onAssignPlayers(match.id, p1, p2)}
                onSchedule={(at, cid) => onScheduleMatch(match.id, at, cid)}
                isLoading={actionLoading === match.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visual tree bracket */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex mb-4">
          {rounds.map((r, ri) => (
            <div key={r} style={{ width: ROUND_W + (ri < totalRounds - 1 ? CONN_W : 0) }}>
              <div className="text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {roundLabel(r)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex" style={{ height: totalH }}>
          {rounds.map((round, ri) => {
            const roundMatches = matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.matchNumber - b.matchNumber);
            const slotH = slotH1 * Math.pow(2, ri);

            return (
              <div key={round} className="flex shrink-0">
                <div style={{ width: ROUND_W, height: totalH, position: 'relative' }}>
                  {roundMatches.map((match, mi) => {
                    const topPos = mi * slotH + (slotH - CARD_H) / 2;
                    return (
                      <div
                        key={match.id}
                        style={{ position: 'absolute', top: topPos, left: 4, right: 4 }}
                      >
                        <MatchCard match={match} getName={getName} getInitials={getInitials} />
                      </div>
                    );
                  })}
                </div>

                {ri < totalRounds - 1 && (
                  <svg width={CONN_W} height={totalH} className="shrink-0" style={{ overflow: 'visible' }}>
                    {roundMatches.map((match, mi) => {
                      const matchCenterY = mi * slotH + slotH / 2;
                      const nextSlotH = slotH * 2;
                      const nextMatchIdx = Math.floor(mi / 2);
                      const nextCenterY = nextMatchIdx * nextSlotH + nextSlotH / 2;
                      const midX = CONN_W / 2;
                      const isWinner = !!match.winnerId;
                      return (
                        <path
                          key={match.id}
                          d={`M 0 ${matchCenterY} H ${midX} V ${nextCenterY} H ${CONN_W}`}
                          stroke={isWinner ? '#14b8a6' : '#e5e7eb'}
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

// Read-only match card used inside the visual bracket
function MatchCard({
  match, getName, getInitials,
}: {
  match: TournamentMatch;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const isCompleted = match.status === 'COMPLETED';
  const scoreStr = (match.sets ?? []).length > 0
    ? match.sets.map((s) => `${s.player1}-${s.player2}`).join(', ')
    : null;

  return (
    <div className={`rounded-xl border text-sm overflow-hidden shadow-sm bg-white ${
      isCompleted ? 'border-gray-200' : 'border-dashed border-gray-200'
    }`}>
      <PlayerRow
        userId={match.player1Id}
        isWinner={match.winnerId === match.player1Id && !!match.player1Id}
        score={scoreStr ? match.sets.map((s) => s.player1).join(' ') : undefined}
        getName={getName}
        getInitials={getInitials}
      />
      <div className="border-t border-gray-100 mx-3" />
      <PlayerRow
        userId={match.player2Id}
        isWinner={match.winnerId === match.player2Id && !!match.player2Id}
        score={scoreStr ? match.sets.map((s) => s.player2).join(' ') : undefined}
        getName={getName}
        getInitials={getInitials}
      />
    </div>
  );
}

// Admin score entry card — full width, prominent
function ScoreForm({
  match, approved, courts, getName, getInitials, inp, onUpdate, onSave, onAssignPlayers, onSchedule, isLoading,
}: {
  match: TournamentMatch;
  approved: { userId: string }[];
  courts: Court[];
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
  inp: { s1: string; s2: string; winner: string };
  onUpdate: (u: Partial<{ s1: string; s2: string; winner: string }>) => void;
  onSave: () => void;
  onAssignPlayers: (p1: string | null, p2: string | null) => void;
  onSchedule: (scheduledAt: string, courtId?: string) => void;
  isLoading: boolean;
}) {
  const [p1Sel, setP1Sel] = useState(match.player1Id ?? '');
  const [p2Sel, setP2Sel] = useState(match.player2Id ?? '');

  // datetime-local value derived from existing scheduledAt or empty
  const toLocalDt = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [schedDt, setSchedDt] = useState(toLocalDt(match.scheduledAt));
  const [schedCourt, setSchedCourt] = useState(match.courtId ?? '');

  const playersChanged = p1Sel !== (match.player1Id ?? '') || p2Sel !== (match.player2Id ?? '');
  const schedChanged   = schedDt !== toLocalDt(match.scheduledAt) || schedCourt !== (match.courtId ?? '');
  const bothAssigned   = !!match.player1Id && !!match.player2Id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Player assignment row */}
      <div className="flex items-center gap-2">
        <select
          value={p1Sel}
          onChange={(e) => setP1Sel(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:border-teal-500 focus:outline-none"
        >
          <option value="">— Jugador 1 —</option>
          {approved.map((r) => (
            <option key={r.userId} value={r.userId}>{getName(r.userId)}</option>
          ))}
        </select>
        <span className="text-gray-400 font-bold text-xs shrink-0">vs</span>
        <select
          value={p2Sel}
          onChange={(e) => setP2Sel(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:border-teal-500 focus:outline-none"
        >
          <option value="">— Jugador 2 —</option>
          {approved.map((r) => (
            <option key={r.userId} value={r.userId}>{getName(r.userId)}</option>
          ))}
        </select>
        {playersChanged && (
          <button
            disabled={isLoading}
            onClick={() => onAssignPlayers(p1Sel || null, p2Sel || null)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Asignar
          </button>
        )}
      </div>

      {/* Schedule row */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="datetime-local"
          value={schedDt}
          onChange={(e) => setSchedDt(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:border-teal-500 focus:outline-none"
        />
        {courts.length > 0 && (
          <select
            value={schedCourt}
            onChange={(e) => setSchedCourt(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="">— Pista —</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.indoor ? ' (int.)' : ' (ext.)'}</option>
            ))}
          </select>
        )}
        {schedChanged && schedDt && (
          <button
            disabled={isLoading}
            onClick={() => onSchedule(new Date(schedDt).toISOString(), schedCourt || undefined)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Programar
          </button>
        )}
      </div>

      {/* Score row — only when both players are set */}
      {bothAssigned && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-1">
            <PlayerAvatar name={getName(match.player1Id)} initials={getInitials(match.player1Id)} size="sm" />
            <span className="text-sm font-medium text-gray-700 truncate flex-1">{getName(match.player1Id)}</span>
            <input
              type="number" min={0} placeholder="0" value={inp.s1}
              onChange={(e) => onUpdate({ s1: e.target.value })}
              className="w-12 px-1.5 py-1 border border-gray-300 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
            />
          </div>
          <span className="text-gray-300 font-bold shrink-0">–</span>
          <div className="flex items-center gap-2 flex-1 flex-row-reverse">
            <PlayerAvatar name={getName(match.player2Id)} initials={getInitials(match.player2Id)} size="sm" />
            <span className="text-sm font-medium text-gray-700 truncate flex-1 text-right">{getName(match.player2Id)}</span>
            <input
              type="number" min={0} placeholder="0" value={inp.s2}
              onChange={(e) => onUpdate({ s2: e.target.value })}
              className="w-12 px-1.5 py-1 border border-gray-300 rounded-lg text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {bothAssigned && (
        <div className="flex items-center gap-2">
          <select
            value={inp.winner}
            onChange={(e) => onUpdate({ winner: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:border-teal-500 focus:outline-none"
          >
            <option value="">— Seleccionar ganador —</option>
            <option value={match.player1Id ?? ''}>{getName(match.player1Id)}</option>
            <option value={match.player2Id ?? ''}>{getName(match.player2Id)}</option>
          </select>
          <button
            disabled={!inp.winner || isLoading}
            onClick={onSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Guardar resultado
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  userId, isWinner, score, getName, getInitials,
}: {
  userId: string | null;
  isWinner: boolean;
  score?: string;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  if (!userId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-gray-300 italic text-xs">
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">
          –
        </span>
        BYE
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${isWinner ? 'bg-emerald-50' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isWinner ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {isWinner ? '✓' : getInitials(userId)}
      </div>
      <span className={`text-xs font-medium truncate flex-1 ${isWinner ? 'text-emerald-700' : 'text-gray-700'}`}>
        {getName(userId)}
      </span>
      {score !== undefined && (
        <span className={`text-xs font-bold shrink-0 ${isWinner ? 'text-emerald-600' : 'text-gray-400'}`}>
          {score}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Standings tab
// ─────────────────────────────────────────────────────────────────────────────

function StandingsTab({
  tournament,
  getName,
  getInitials,
}: {
  tournament: Tournament;
  getName: (uid: string | null) => string;
  getInitials: (uid: string | null) => string;
}) {
  const results = tournament.results ?? [];
  const rankingPoints = tournament.rankingPoints ?? [];

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <Medal className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">La clasificación estará disponible al finalizar el torneo</p>
      </div>
    );
  }

  const pointsFor = (pos: number) => rankingPoints.find((rp) => rp.position === pos)?.points ?? 0;

  return (
    <div>
      <div className="space-y-2">
        {[...results].sort((a, b) => a.position - b.position).map((r) => {
          const pts = pointsFor(r.position);
          return (
            <div
              key={r.userId}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                r.position === 1 ? 'bg-amber-50 border-amber-200' :
                r.position === 2 ? 'bg-gray-50 border-gray-200' :
                r.position === 3 ? 'bg-orange-50 border-orange-200' :
                'bg-white border-gray-100'
              }`}
            >
              <div className="w-10 text-center shrink-0">
                {r.position === 1 && <span className="text-2xl">🥇</span>}
                {r.position === 2 && <span className="text-2xl">🥈</span>}
                {r.position === 3 && <span className="text-2xl">🥉</span>}
                {r.position > 3  && <span className="text-lg font-bold text-gray-500">{r.position}º</span>}
              </div>
              <PlayerAvatar name={getName(r.userId)} initials={getInitials(r.userId)} />
              <span className="font-semibold text-gray-900 flex-1">{getName(r.userId)}</span>
              {pts > 0 && (
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-teal-600">{pts}</span>
                  <span className="text-xs text-gray-400 ml-1">pts ranking</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function PlayerAvatar({ name, initials, size = 'md' }: { name: string; initials: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const hue = Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  );
}

function RegistrationStatusPill({ status }: { status: TournamentParticipantStatus }) {
  if (status === TournamentParticipantStatus.APPROVED) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
        <CheckCircle className="w-4 h-4" /> Inscripción aprobada
      </div>
    );
  }
  if (status === TournamentParticipantStatus.REJECTED) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
        <XCircle className="w-4 h-4" /> Inscripción rechazada
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700">
      <Clock className="w-4 h-4" /> Pendiente de aprobación
    </div>
  );
}
