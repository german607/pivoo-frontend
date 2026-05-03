'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Tournament, TournamentStatus, Sport, UserRole } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Input, Button, Skeleton } from '@/components/ui';
import { Plus, Search, Trophy, Calendar, Users, ArrowRight, Frown } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { cn } from '@/utils/cn';

const STATUS_CONFIG: Record<TournamentStatus, { label: string; dot: string; pill: string }> = {
  [TournamentStatus.DRAFT]:               { label: 'Borrador',            dot: 'bg-slate-400',   pill: 'bg-slate-400/20 text-slate-300 border border-slate-400/30' },
  [TournamentStatus.REGISTRATION_OPEN]:   { label: 'Inscripción abierta', dot: 'bg-emerald-400', pill: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' },
  [TournamentStatus.REGISTRATION_CLOSED]: { label: 'Inscr. cerrada',      dot: 'bg-amber-400',   pill: 'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  [TournamentStatus.IN_PROGRESS]:         { label: 'En curso',            dot: 'bg-blue-400',    pill: 'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  [TournamentStatus.COMPLETED]:           { label: 'Finalizado',          dot: 'bg-purple-400',  pill: 'bg-purple-400/20 text-purple-300 border border-purple-400/30' },
  [TournamentStatus.CANCELLED]:           { label: 'Cancelado',           dot: 'bg-red-400',     pill: 'bg-red-400/20 text-red-300 border border-red-400/30' },
};

const SPORT_BANNER: Record<string, { gradient: string; emoji: string }> = {
  TENNIS: { gradient: 'from-yellow-400 via-lime-400 to-green-500', emoji: '🎾' },
  PADEL:  { gradient: 'from-teal-400 via-cyan-500 to-blue-500',   emoji: '🏓' },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN:        'Round Robin',
};

const FILTERS = [
  { value: '',                               label: 'Todos' },
  { value: TournamentStatus.REGISTRATION_OPEN,  label: 'Inscripción abierta' },
  { value: TournamentStatus.IN_PROGRESS,        label: 'En curso' },
  { value: TournamentStatus.COMPLETED,          label: 'Finalizados' },
];

export default function TournamentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tournsResult, sptsResult] = await Promise.allSettled([
        get<Tournament[]>('/api/v1/tournaments', { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL}),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
      ]);
      if (tournsResult.status === 'fulfilled') setTournaments(tournsResult.value || []);
      if (sptsResult.status === 'fulfilled') setSports(sptsResult.value || []);
    } finally {
      setIsLoading(false);
    }
  };

  const sportById = (id: string) => sports.find((s) => s.id === id);

  const filtered = tournaments.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = !searchTerm
      || t.name.toLowerCase().includes(term)
      || (sportById(t.sportId)?.name ?? '').toLowerCase().includes(term)
      || (t.complex ? `${t.complex.name} ${t.complex.city}`.toLowerCase().includes(term) : false);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesTerm && matchesStatus;
  });

  const openCount = tournaments.filter((t) => t.status === TournamentStatus.REGISTRATION_OPEN).length;
  const liveCount = tournaments.filter((t) => t.status === TournamentStatus.IN_PROGRESS).length;
  const featuredTournaments = filtered.filter((t) => t.status === TournamentStatus.REGISTRATION_OPEN);
  const otherTournaments    = filtered.filter((t) => t.status !== TournamentStatus.REGISTRATION_OPEN);
  const showSections = !searchTerm && !statusFilter && featuredTournaments.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0f172a 300px, #f8fafc 300px)' }}>
      <Header />

      {/* ── Hero banner ───────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute right-0 top-0 w-96 h-72 bg-amber-500 opacity-[0.07] blur-3xl rounded-full pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-64 h-48 bg-teal-500 opacity-[0.07] blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Competición oficial</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Torneos</h1>
              <p className="text-slate-400 text-sm">Participa en torneos organizados por complejos deportivos</p>
            </div>
            {user?.role === UserRole.COMPLEX && (
              <Button
                onClick={() => router.push('/tournaments/new')}
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                Crear torneo
              </Button>
            )}
          </div>

          {/* Stats */}
          {!isLoading && tournaments.length > 0 && (
            <div className="flex gap-6 mt-8 pt-8 border-t border-white/8">
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-xl font-black text-white">{tournaments.length}</p>
                <p className="text-xs text-slate-400">Total torneos</p>
              </div>
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-xl font-black text-emerald-400">{openCount}</p>
                <p className="text-xs text-slate-400">Inscripción abierta</p>
              </div>
              <div className="glass rounded-xl px-5 py-3">
                <p className="text-xl font-black text-blue-400">{liveCount}</p>
                <p className="text-xs text-slate-400">En curso</p>
              </div>
            </div>
          )}

          {/* Search + filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="sm:w-72">
              <Input
                placeholder="Buscar torneos..."
                icon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/15 text-white placeholder-slate-400 focus:bg-white/15 focus:border-teal-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 border',
                    statusFilter === value
                      ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/30'
                      : 'bg-white/8 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 py-24 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5 mx-auto">
              <Frown className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">No se encontraron torneos</p>
            <p className="text-sm text-slate-500 max-w-xs">Sé el primero en organizar un torneo</p>
          </div>
        ) : showSections ? (
          <div className="space-y-10">
            {/* Open registrations — featured */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Inscripción abierta · {featuredTournaments.length} torneos
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredTournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} sport={sportById(t.sportId)} featured />
                ))}
              </div>
            </section>

            {otherTournaments.length > 0 && (
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Otros torneos · {otherTournaments.length}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {otherTournaments.map((t) => (
                    <TournamentCard key={t.id} tournament={t} sport={sportById(t.sportId)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              {filtered.length} torneos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => (
                <TournamentCard key={t.id} tournament={t} sport={sportById(t.sportId)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── TournamentCard ─────────────────────────────────────────────────────────────

function TournamentCard({
  tournament,
  sport,
  featured = false,
}: {
  tournament: Tournament;
  sport: Sport | undefined;
  featured?: boolean;
}) {
  const banner = SPORT_BANNER[sport?.name ?? ''] ?? { gradient: 'from-slate-600 to-slate-800', emoji: '🏆' };
  const status = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG[TournamentStatus.DRAFT];
  const count  = tournament._count?.registrations ?? 0;
  const pct    = Math.min(100, Math.round((count / tournament.maxParticipants) * 100));
  const isFull = count >= tournament.maxParticipants;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block group">
      <article className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">

        {/* ── Sport banner ──────────────────── */}
        <div className={cn('relative h-28 bg-gradient-to-br overflow-hidden shrink-0', banner.gradient)}>
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />

          {/* Trophy emoji */}
          <div className="absolute left-5 bottom-4 text-4xl drop-shadow-lg select-none leading-none">
            {banner.emoji}
          </div>

          {/* Sport label + complex */}
          <div className="absolute left-16 bottom-5 right-20">
            <p className="text-white font-black text-sm leading-none drop-shadow truncate">
              {sport?.name ?? 'Torneo'}
            </p>
            {tournament.complex && (
              <p className="text-white/75 text-xs mt-0.5 truncate">{tournament.complex.name}</p>
            )}
          </div>

          {/* Status pill */}
          <div className="absolute top-3 right-3">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-sm', status.pill)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', tournament.status === TournamentStatus.REGISTRATION_OPEN && 'animate-pulse', status.dot)} />
              {status.label}
            </span>
          </div>
        </div>

        {/* ── Content ───────────────────────── */}
        <div className="p-5 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">
            {tournament.name}
          </h3>
          {tournament.complex && (
            <p className="text-xs text-slate-400 mb-3">
              {tournament.complex.city}
            </p>
          )}

          {/* Format tag */}
          <div className="mb-4">
            <span className="inline-block text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {FORMAT_LABEL[tournament.format] ?? tournament.format}
            </span>
          </div>

          {/* Participants */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1 text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {count} / {tournament.maxParticipants}
              </span>
              <span className={cn('font-bold', isFull ? 'text-amber-600' : 'text-emerald-600')}>
                {isFull ? 'Completo' : `${tournament.maxParticipants - count} plazas`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isFull ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                         : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(tournament.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-teal-600 transition-colors">
              Ver torneo
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
