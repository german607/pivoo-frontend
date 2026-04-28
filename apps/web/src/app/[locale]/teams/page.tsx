'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Header } from '@/components/Header';
import { Card, Button } from '@/components/ui';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Users, Trophy, ChevronRight, Bell } from 'lucide-react';

interface TeamSummary {
  id: string;
  name: string;
  color: string;
  sportId: string | null;
  myRole: 'ADMIN' | 'MEMBER';
  _count: { members: number };
}

interface TeamInvitation {
  id: string;
  team: { id: string; name: string; color: string };
  invitedByUserId: string;
}

export default function TeamsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { get, patch } = useApi();
  const router = useRouter();
  const t = useTranslations('teams');
  const tc = useTranslations('common');

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teamsData, invData] = await Promise.all([
        get<TeamSummary[]>('/api/v1/teams/me', { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }),
        get<TeamInvitation[]>('/api/v1/teams/invitations/me', { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }),
      ]);
      setTeams(teamsData || []);
      setInvitations(invData || []);
    } catch {
      // silently fail — backend may not be up in dev
    } finally {
      setIsLoading(false);
    }
  };

  const respond = async (invId: string, accept: boolean) => {
    try {
      await patch(`/api/v1/teams/invitations/${invId}/${accept ? 'accept' : 'decline'}`, {}, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      await loadData();
    } catch {}
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">{t('pageTitle')}</h1>
            <p className="text-gray-500">{t('pageSubtitle')}</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push('/teams/new')}
          >
            {t('createTeam')}
          </Button>
        </div>

        {/* Pending invitations banner */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              {t('invitationsTitle')}
            </h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-white border border-amber-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: inv.team.color }}
                    >
                      {inv.team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="font-medium text-gray-900">{inv.team.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => respond(inv.id, true)}>
                      {t('accept')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => respond(inv.id, false)}>
                      {t('decline')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams grid */}
        {teams.length === 0 ? (
          <Card className="text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">{t('noTeams')}</p>
            <p className="text-gray-500 mb-6">{t('noTeamsDesc')}</p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/teams/new')}
            >
              {t('createTeam')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-200 p-6 cursor-pointer">
                  {/* Top accent line using team color */}
                  <div
                    className="h-1 rounded-full mb-5 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ background: team.color }}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Color avatar */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ background: team.color }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-teal-700 transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t('members', { count: team._count.members })}
                          {team.myRole === 'ADMIN' && (
                            <span className="ml-2 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors mt-1" />
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      {team.sportId ? team.sportId : t('allSports')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
