'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Link } from '@/navigation';
import { Match, MatchStatus, Sport, ParticipantStatus } from '@pivoo/shared';
import { SportIcon } from './SportIcon';
import {
  X, ArrowLeft, MapPin, Clock, Users, Trophy, ChevronRight,
  Calendar, CheckCircle2, XCircle, Hourglass,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ── Constants ────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  OPEN:        'bg-violet-500/20 text-violet-300 border-violet-400/30',
  FULL:        'bg-amber-500/20 text-amber-300 border-amber-400/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  COMPLETED:   'bg-slate-500/20 text-slate-300 border-slate-400/30',
  CANCELLED:   'bg-red-500/20 text-red-300 border-red-400/30',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN:        'Abierto',
  FULL:        'Completo',
  IN_PROGRESS: 'En curso',
  COMPLETED:   'Finalizado',
  CANCELLED:   'Cancelado',
};

const TEAM_LABEL: Record<string, string> = {
  TEAM_A: 'Equipo A',
  TEAM_B: 'Equipo B',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── List item ────────────────────────────────────────────────

function MatchListItem({
  match,
  sportName,
  onClick,
}: {
  match: Match;
  sportName: string;
  onClick: () => void;
}) {
  const approved = match.participants.filter((p) => p.status === ParticipantStatus.APPROVED).length;
  const statusCls = STATUS_CLS[match.status] ?? STATUS_CLS.OPEN;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/4 transition-colors text-left group"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
        <SportIcon sport={sportName} className="w-5 h-[23px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-white truncate">{sportName}</span>
          <span className={cn('shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border', statusCls)}>
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {formatDate(match.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 shrink-0" />
            {approved}/{match.maxPlayers}
          </span>
        </div>
        {(match.complex?.name || match.complexName) && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {match.complex?.name ?? match.complexName}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  );
}

// ── Detail view ──────────────────────────────────────────────

function MatchDetailView({
  matchId,
  sports,
  onBack,
}: {
  matchId: string;
  sports: Sport[];
  onBack: () => void;
}) {
  const { get } = useApi();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<Match>(`/api/v1/matches/${matchId}`, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL })
      .then(setMatch)
      .catch(() => setMatch(null))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
        <XCircle className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-500">No se pudo cargar el partido</p>
        <button onClick={onBack} className="text-xs text-violet-400 hover:text-violet-300 mt-2">
          ← Volver
        </button>
      </div>
    );
  }

  const sportName = sports.find((s) => s.id === match.sportId)?.name ?? '';
  const approved = match.participants.filter((p) => p.status === ParticipantStatus.APPROVED);
  const pending = match.participants.filter((p) => p.status === ParticipantStatus.PENDING);
  const statusCls = STATUS_CLS[match.status] ?? STATUS_CLS.OPEN;
  const isAdmin = match.adminUserId === user?.id;

  const myParticipant = match.participants.find(
    (p) => p.userId === user?.id && p.participantType === 'REGISTERED',
  );
  const myStatus = myParticipant?.status;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-white transition-colors border-b border-white/5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Mis partidos
      </button>

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
              <SportIcon sport={sportName} className="w-6 h-[27px]" />
            </div>
            <div>
              <p className="text-base font-black text-white">{sportName}</p>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', statusCls)}>
                {STATUS_LABEL[match.status]}
              </span>
            </div>
            {isAdmin && (
              <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {formatDate(match.scheduledAt)}
            </p>
            {(match.complex?.name || match.complexName) && (
              <p className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {match.complex?.name ?? match.complexName}
                {match.complex?.city && <span className="text-slate-500 text-xs">— {match.complex.city}</span>}
              </p>
            )}
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {approved.length} / {match.maxPlayers} jugadores
            </p>
          </div>

          {/* My status */}
          {myStatus && (
            <div className={cn(
              'mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold',
              myStatus === ParticipantStatus.APPROVED && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
              myStatus === ParticipantStatus.PENDING && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
              myStatus === ParticipantStatus.REJECTED && 'bg-red-500/10 text-red-400 border border-red-500/20',
            )}>
              {myStatus === ParticipantStatus.APPROVED && <CheckCircle2 className="w-3.5 h-3.5" />}
              {myStatus === ParticipantStatus.PENDING && <Hourglass className="w-3.5 h-3.5" />}
              {myStatus === ParticipantStatus.REJECTED && <XCircle className="w-3.5 h-3.5" />}
              {myStatus === ParticipantStatus.APPROVED && 'Confirmado'}
              {myStatus === ParticipantStatus.PENDING && 'Solicitud pendiente'}
              {myStatus === ParticipantStatus.REJECTED && 'Solicitud rechazada'}
              {myParticipant?.team && (
                <span className="ml-auto text-[10px]">{TEAM_LABEL[myParticipant.team]}</span>
              )}
            </div>
          )}
        </div>

        {/* Participants */}
        {approved.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Participantes ({approved.length})
            </p>
            <div className="space-y-1.5">
              {approved.map((p) => {
                const name = p.participantType === 'GUEST'
                  ? `${p.guestFirstName ?? ''} ${p.guestLastName ?? ''}`.trim()
                  : p.userId === user?.id ? 'Tú' : `Jugador`;
                const initials = name.slice(0, 2).toUpperCase();
                const isMe = p.userId === user?.id;
                const isMatchAdmin = p.userId === match.adminUserId;

                return (
                  <div key={p.id} className="flex items-center gap-2.5 py-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="text-sm text-slate-300 flex-1 min-w-0 truncate">
                      {name}
                      {isMe && <span className="ml-1.5 text-[10px] text-slate-500">(tú)</span>}
                    </span>
                    {isMatchAdmin && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Admin</span>
                    )}
                    {p.team && (
                      <span className="text-[10px] text-slate-500 shrink-0">{TEAM_LABEL[p.team]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pending.length > 0 && isAdmin && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Solicitudes pendientes ({pending.length})
            </p>
            <div className="space-y-1">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 py-1">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    ?
                  </div>
                  <span className="text-sm text-slate-400 flex-1">Jugador pendiente</span>
                  <Hourglass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {match.result && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resultado</p>
            </div>
            <p className="text-sm font-bold text-amber-400">{TEAM_LABEL[match.result.winnerTeam]} gana</p>
            {match.result.sets.length > 0 && (
              <div className="flex gap-2 mt-2">
                {match.result.sets.map((s) => (
                  <div key={s.setNumber} className="flex flex-col items-center bg-slate-700/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400">Set {s.setNumber}</span>
                    <span className="text-sm font-black text-white">{s.teamAScore}–{s.teamBScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {match.description && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs text-slate-400 leading-relaxed">{match.description}</p>
          </div>
        )}

        {/* Full page link */}
        <div className="px-4 py-4">
          <Link
            href={`/matches/${match.id}` as Parameters<typeof Link>[0]['href']}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 hover:text-violet-200 text-sm font-semibold rounded-xl border border-violet-500/30 hover:border-violet-500/50 transition-all duration-150"
          >
            <Calendar className="w-4 h-4" />
            Ver partido completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main drawer ──────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  sports: Sport[];
}

export function MyMatchesDrawer({ open, onClose, sports }: Props) {
  const { user } = useAuth();
  const { get } = useApi();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await get<Match[]>('/api/v1/matches/mine', {
        baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL,
      });
      setMatches(data ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user, get]);

  useEffect(() => {
    if (open) {
      setSelectedMatchId(null);
      load();
    }
  }, [open]);

  const sportName = (sportId: string) => sports.find((s) => s.id === sportId)?.name ?? '';

  const ACTIVE = new Set([MatchStatus.OPEN, MatchStatus.FULL, MatchStatus.IN_PROGRESS]);

  // Only active matches, sorted soonest first
  const sorted = matches
    .filter((m) => ACTIVE.has(m.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900 border-l border-white/8 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-base font-bold text-white">Mis partidos</span>
            {sorted.length > 0 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {sorted.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {selectedMatchId ? (
          <MatchDetailView
            matchId={selectedMatchId}
            sports={sports}
            onBack={() => setSelectedMatchId(null)}
          />
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <Calendar className="w-10 h-10 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">No tenés partidos activos</p>
            <p className="text-xs text-slate-600 text-center">Tus partidos abiertos, completos o en curso aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {sorted.map((match) => (
              <MatchListItem
                key={match.id}
                match={match}
                sportName={sportName(match.sportId)}
                onClick={() => setSelectedMatchId(match.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
