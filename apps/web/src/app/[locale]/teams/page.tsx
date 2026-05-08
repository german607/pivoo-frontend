'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui';
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

interface Sport {
  id: string;
  name: string;
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
  const [sportsMap, setSportsMap] = useState<Record<string, string>>({});
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
      const [teamsData, invData, sportsData] = await Promise.all([
        get<TeamSummary[]>('/api/v1/teams/me', { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }),
        get<TeamInvitation[]>('/api/v1/teams/invitations/me', { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }).catch(() => []),
      ]);
      setTeams(teamsData || []);
      setInvitations(invData || []);
      const map: Record<string, string> = {};
      (sportsData || []).forEach((s) => { map[s.id] = s.name; });
      setSportsMap(map);
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
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-400">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">{t('pageTitle')}</h1>
            <p className="text-slate-400">{t('pageSubtitle')}</p>
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
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              {t('invitationsTitle')}
            </h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ background: inv.team.color }}
                    >
                      {inv.team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="font-medium text-white">{inv.team.name}</p>
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
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl text-center py-20 px-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-2">{t('noTeams')}</p>
            <p className="text-slate-400 mb-6">{t('noTeamsDesc')}</p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/teams/new')}
            >
              {t('createTeam')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="group bg-slate-800 rounded-2xl border border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
                  {/* Top accent line using team color */}
                  <div className="h-1 w-full" style={{ background: team.color }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow"
                          style={{ background: team.color }}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg group-hover:text-teal-400 transition-colors">
                            {team.name}
                          </h3>
                          <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {t('members', { count: team._count.members })}
                            {team.myRole === 'ADMIN' && (
                              <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-full text-xs font-medium border border-teal-500/30">
                                Admin
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors mt-1" />
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>{team.sportId ? (sportsMap[team.sportId] ?? team.sportId) : t('allSports')}</span>
                    </div>
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
