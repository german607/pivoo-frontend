'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Tournament, TournamentStatus, SportComplex, UserRole } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button, Skeleton } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Trophy, Plus, Users, TrendingUp, Settings } from 'lucide-react';

const STATUS_BADGE: Record<TournamentStatus, { label: string; className: string }> = {
  [TournamentStatus.DRAFT]: { label: 'Borrador', className: 'bg-gray-100 text-gray-600' },
  [TournamentStatus.REGISTRATION_OPEN]: { label: 'Inscripción abierta', className: 'bg-green-100 text-green-700' },
  [TournamentStatus.REGISTRATION_CLOSED]: { label: 'Inscripciones cerradas', className: 'bg-yellow-100 text-yellow-700' },
  [TournamentStatus.IN_PROGRESS]: { label: 'En curso', className: 'bg-blue-100 text-blue-700' },
  [TournamentStatus.COMPLETED]: { label: 'Finalizado', className: 'bg-purple-100 text-purple-700' },
  [TournamentStatus.CANCELLED]: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
};

export default function ComplexDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get } = useApi();
  const router = useRouter();
  const t = useTranslations('complexDashboard');

  const [complex, setComplex] = useState<SportComplex | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== UserRole.COMPLEX) { router.push('/matches'); return; }
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [complexData, tournamentData] = await Promise.all([
        get<SportComplex[]>(`/api/v1/complexes?adminUserId=${user?.id}`, {
          baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL,
        }).then((arr) => arr?.[0] ?? null),
        get<Tournament[]>(`/api/v1/tournaments?complexAdminUserId=${user?.id}`, {
          baseUrl: process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL,
        }),
      ]);
      setComplex(complexData);
      setTournaments(tournamentData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeTournaments = tournaments.filter((t) => t.status === TournamentStatus.IN_PROGRESS).length;
  const totalParticipants = tournaments.reduce(
    (acc, t) => acc + (t._count?.registrations ?? t.registrations?.filter((r) => r.status === 'APPROVED').length ?? 0),
    0
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Skeleton className="h-32 mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {complex ? complex.name : t('title')}
              </h1>
              <p className="text-gray-500">
                {complex ? `${complex.city} · ${complex.address}` : t('subtitle')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {complex && (
              <Button variant="outline" size="sm" icon={<Settings className="w-4 h-4" />}>
                Editar perfil
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/tournaments/new')}
              disabled={!complex}
            >
              {t('createTournament')}
            </Button>
          </div>
        </div>

        {/* No complex setup */}
        {!complex && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center mb-8">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('setupTitle')}</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('setupDesc')}</p>
            <Button variant="primary" icon={<Settings className="w-4 h-4" />}>
              {t('setupBtn')}
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-teal-600" />}
            label={t('statTotal')}
            value={tournaments.length}
            bg="bg-teal-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            label={t('statActive')}
            value={activeTournaments}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-purple-600" />}
            label={t('statParticipants')}
            value={totalParticipants}
            bg="bg-purple-50"
          />
        </div>

        {/* Tournaments list */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('myTournaments')}</h2>
          {tournaments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('noTournaments')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Torneo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Participantes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Inicio</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament) => {
                    const badge = STATUS_BADGE[tournament.status];
                    const approved = tournament._count?.registrations ?? tournament.registrations?.filter((r) => r.status === 'APPROVED').length ?? 0;
                    return (
                      <tr key={tournament.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-gray-900">{tournament.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tournament.format === 'SINGLE_ELIMINATION' ? 'Eliminación directa' : 'Round Robin'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700 font-medium">
                          {approved}/{tournament.maxParticipants}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(tournament.startDate).toLocaleDateString('es-ES', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/tournaments/${tournament.id}`}>
                            <Button size="sm" variant="outline">{t('manage')}</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
