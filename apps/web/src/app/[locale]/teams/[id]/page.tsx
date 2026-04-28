'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Header } from '@/components/Header';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Users, Trophy, TrendingUp, UserMinus, Crown, Send, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface TeamDetail {
  id: string;
  name: string;
  color: string;
  sportId: string | null;
  adminUserId: string;
  members: TeamMember[];
  invitations: { id: string; invitedUserId: string }[];
}

interface TeamStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  teamName: string;
  memberCount: number;
  recentMatches: { id: string; sportId: string; scheduledAt: string }[];
  note?: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const { get, post, patch, delete: del } = useApi();
  const router = useRouter();
  const t = useTranslations('teamDetail');
  const tc = useTranslations('common');

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteUserId, setInviteUserId] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) loadData();
  }, [authLoading, user, teamId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teamData, statsData] = await Promise.all([
        get<TeamDetail>(`/api/v1/teams/${teamId}`, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }),
        get<TeamStats>(`/api/v1/teams/${teamId}/stats`, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }).catch(() => null),
      ]);
      setTeam(teamData);
      setEditName(teamData.name);
      setStats(statsData);
    } catch {
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteUserId.trim()) return;
    setIsSendingInvite(true);
    try {
      await post(`/api/v1/teams/${teamId}/invitations`, { userId: inviteUserId.trim() }, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      setInviteUserId('');
      await loadData();
    } catch {}
    setIsSendingInvite(false);
  };

  const removeMember = async (userId: string) => {
    try {
      await del(`/api/v1/teams/${teamId}/members/${userId}`, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      await loadData();
    } catch {}
  };

  const saveName = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await patch(`/api/v1/teams/${teamId}`, { name: editName.trim() }, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      setIsEditing(false);
      await loadData();
    } catch {}
    setIsSaving(false);
  };

  const disband = async () => {
    if (!confirm(t('disbandConfirm'))) return;
    try {
      await del(`/api/v1/teams/${teamId}`, { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL });
      router.push('/teams');
    } catch {}
  };

  const isAdmin = team?.adminUserId === user?.id;

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

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Team header card */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow"
                style={{ background: team.color }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-bold"
                    />
                    <Button size="sm" variant="primary" onClick={saveName} isLoading={isSaving}>
                      {t('save')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                ) : (
                  <h1
                    className={`text-3xl font-bold text-gray-900 ${isAdmin ? 'cursor-pointer hover:text-teal-700' : ''}`}
                    onClick={() => isAdmin && setIsEditing(true)}
                    title={isAdmin ? t('editName') : undefined}
                  >
                    {team.name}
                  </h1>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {team.members.length} {t('members').toLowerCase()}
                  {team.sportId && ` · ${team.sportId}`}
                </p>
              </div>
            </div>

            {isAdmin && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={disband}
              >
                {t('disbandTeam')}
              </Button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Members */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                {t('members')}
              </h2>

              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {member.userId.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.userId === user?.id ? (
                            <span className="text-teal-700">{t('you')}</span>
                          ) : (
                            member.userId
                          )}
                        </p>
                        {member.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Crown className="w-3 h-3" />
                            {t('admin')}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && member.userId !== user?.id && (
                      <button
                        onClick={() => removeMember(member.userId)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('removeMember')}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite section — admin only */}
              {isAdmin && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('inviteMember')}</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('inviteUserId')}
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                    />
                    <Button
                      variant="primary"
                      icon={<Send className="w-4 h-4" />}
                      onClick={sendInvite}
                      isLoading={isSendingInvite}
                      disabled={!inviteUserId.trim()}
                    >
                      {t('sendInvite')}
                    </Button>
                  </div>
                  {team.invitations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">{t('pendingInvitations')}</p>
                      <div className="space-y-1">
                        {team.invitations.map((inv) => (
                          <p key={inv.id} className="text-xs text-gray-600 bg-amber-50 rounded px-2 py-1">
                            {inv.invitedUserId}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Stats */}
          <div>
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {t('statsTitle')}
              </h2>

              {!stats || stats.matchesPlayed === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">{t('noStats')}</p>
                  <p className="text-sm text-gray-400">{t('noStatsDesc')}</p>
                </div>
              ) : (
                <>
                  {/* Win rate ring */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke="#14B8A6" strokeWidth="3"
                          strokeDasharray={`${stats.winRate} ${100 - stats.winRate}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.winRate}%</span>
                        <span className="text-xs text-gray-500">{t('statsWinRate')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: t('statsPlayed'), value: stats.matchesPlayed, color: 'text-gray-900' },
                      { label: t('statsWon'), value: stats.matchesWon, color: 'text-teal-600' },
                      { label: t('statsLost'), value: stats.matchesLost, color: 'text-red-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent matches */}
                  {stats.recentMatches.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{t('recentMatches')}</p>
                      <div className="space-y-2">
                        {stats.recentMatches.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-medium">{m.sportId}</span>
                            <span className="text-gray-400 text-xs">
                              {new Date(m.scheduledAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
