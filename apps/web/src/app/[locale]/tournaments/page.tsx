'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Tournament, TournamentStatus, Sport, UserRole } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Input, Button, Skeleton } from '@/components/ui';
import { Plus, Search, Trophy, Calendar, Users, ChevronRight } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

const STATUS_BADGE: Record<TournamentStatus, { label: string; className: string }> = {
  [TournamentStatus.DRAFT]: { label: 'Borrador', className: 'bg-gray-100 text-gray-600' },
  [TournamentStatus.REGISTRATION_OPEN]: { label: 'Inscripción abierta', className: 'bg-emerald-100 text-emerald-700' },
  [TournamentStatus.REGISTRATION_CLOSED]: { label: 'Inscripciones cerradas', className: 'bg-amber-100 text-amber-700' },
  [TournamentStatus.IN_PROGRESS]: { label: 'En curso', className: 'bg-blue-100 text-blue-700' },
  [TournamentStatus.COMPLETED]: { label: 'Finalizado', className: 'bg-purple-100 text-purple-700' },
  [TournamentStatus.CANCELLED]: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN: 'Round Robin',
};

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: TournamentStatus.REGISTRATION_OPEN, label: 'Inscripción abierta' },
  { value: TournamentStatus.IN_PROGRESS, label: 'En curso' },
  { value: TournamentStatus.COMPLETED, label: 'Finalizados' },
];

export default function TournamentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const t = useTranslations('tournaments');

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
        get<Tournament[]>('/api/v1/tournaments', { baseUrl: process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL }),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }),
      ]);
      if (tournsResult.status === 'fulfilled') setTournaments(tournsResult.value || []);
      if (sptsResult.status === 'fulfilled') setSports(sptsResult.value || []);
    } finally {
      setIsLoading(false);
    }
  };

  const sportById = (id: string) => sports.find((s) => s.id === id);

  const filtered = tournaments.filter((tourn) => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = !searchTerm
      || tourn.name.toLowerCase().includes(term)
      || (sportById(tourn.sportId)?.name ?? '').toLowerCase().includes(term)
      || (tourn.complex ? `${tourn.complex.name} ${tourn.complex.city}`.toLowerCase().includes(term) : false);
    const matchesStatus = !statusFilter || tourn.status === statusFilter;
    return matchesTerm && matchesStatus;
  });

  // Derived stats
  const openCount = tournaments.filter((t) => t.status === TournamentStatus.REGISTRATION_OPEN).length;
  const liveCount = tournaments.filter((t) => t.status === TournamentStatus.IN_PROGRESS).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold text-teal-200 mb-4">
                <Trophy className="w-3.5 h-3.5" /> Torneos organizados por complejos
              </div>
              <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
              <p className="text-gray-300 text-lg">{t('subtitle')}</p>
            </div>
            {user?.role === UserRole.COMPLEX && (
              <Button
                onClick={() => router.push('/tournaments/new')}
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                className="shrink-0"
              >
                {t('create')}
              </Button>
            )}
          </div>

          {/* Stats row */}
          {!isLoading && tournaments.length > 0 && (
            <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold">{tournaments.length}</p>
                <p className="text-sm text-gray-400">Total torneos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{openCount}</p>
                <p className="text-sm text-gray-400">Con inscripción abierta</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{liveCount}</p>
                <p className="text-sm text-gray-400">En curso</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder={t('searchPlaceholder')}
              icon={<Search className="w-5 h-5" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === value
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-2xl mb-5">
              <Trophy className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">{t('noTournamentsTitle')}</p>
            <p className="text-gray-500">{t('noTournamentsDesc')}</p>
          </div>
        ) : (
          <>
            {/* Featured: open registrations first */}
            {filtered.some((t) => t.status === TournamentStatus.REGISTRATION_OPEN) && !searchTerm && !statusFilter && (
              <div className="mb-10">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Inscripción abierta
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.filter((t) => t.status === TournamentStatus.REGISTRATION_OPEN).map((tourn) => (
                    <TournamentCard key={tourn.id} tournament={tourn} sport={sportById(tourn.sportId)} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Rest */}
            {(searchTerm || statusFilter || filtered.some((t) => t.status !== TournamentStatus.REGISTRATION_OPEN)) && (
              <>
                {!searchTerm && !statusFilter && filtered.some((t) => t.status !== TournamentStatus.REGISTRATION_OPEN) && (
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Otros torneos
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(searchTerm || statusFilter
                    ? filtered
                    : filtered.filter((t) => t.status !== TournamentStatus.REGISTRATION_OPEN)
                  ).map((tourn) => (
                    <TournamentCard key={tourn.id} tournament={tourn} sport={sportById(tourn.sportId)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TournamentCard({
  tournament,
  sport,
  featured = false,
}: {
  tournament: Tournament;
  sport: Sport | undefined;
  featured?: boolean;
}) {
  const badge = STATUS_BADGE[tournament.status] ?? STATUS_BADGE[TournamentStatus.DRAFT];
  const count = tournament._count?.registrations ?? 0;
  const pct = Math.min(100, Math.round((count / tournament.maxParticipants) * 100));

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className={`bg-white rounded-2xl border transition-all cursor-pointer group h-full flex flex-col ${
        featured
          ? 'border-teal-200 shadow-md hover:shadow-xl hover:border-teal-400'
          : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
      }`}>
        {/* Top accent */}
        {featured && (
          <div className="h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded-t-2xl" />
        )}

        <div className="p-6 flex flex-col flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
              featured ? 'bg-gradient-to-br from-teal-500 to-teal-700' : 'bg-gradient-to-br from-gray-600 to-gray-800'
            }`}>
              {sport?.name?.slice(0, 1) ?? '?'}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-lg mb-1 line-clamp-2 group-hover:text-teal-700 transition-colors ${
            featured ? 'text-gray-900' : 'text-gray-800'
          }`}>
            {tournament.name}
          </h3>
          {tournament.complex && (
            <p className="text-sm text-gray-500 mb-3">
              {tournament.complex.city} · {tournament.complex.name}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
              {FORMAT_LABEL[tournament.format] ?? tournament.format}
            </span>
            {sport && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                {sport.name}
              </span>
            )}
          </div>

          {/* Progress bar for open tournaments */}
          {tournament.status === TournamentStatus.REGISTRATION_OPEN && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{count} inscritos</span>
                <span>{tournament.maxParticipants} plazas</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{count}/{tournament.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <span className="text-teal-600 font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all text-xs">
              Ver <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
