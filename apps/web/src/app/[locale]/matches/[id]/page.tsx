'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { Match, MatchParticipant, ParticipantStatus, SportComplex } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Button, Card } from '@/components/ui';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const { user } = useAuth();
  const { get, post, patch } = useApi();
  const router = useRouter();
  const t = useTranslations('matchDetail');
  const tc = useTranslations('common');

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userRequest, setUserRequest] = useState<MatchParticipant | null>(null);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const data = await get<Match>(`/api/v1/matches/${matchId}`, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      if (data.complexId) {
        const complex = await get<SportComplex>(`/api/v1/complexes/${data.complexId}`, { baseUrl: process.env.NEXT_PUBLIC_COMPLEXES_API_URL }).catch(() => null);
        if (complex) data.complex = { name: complex.name, city: complex.city };
      }
      setMatch(data);

      const userParticipant = data.participants.find((p) => p.userId === user?.id);
      if (userParticipant) {
        setUserRequest(userParticipant);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!match) return;
    setIsJoining(true);
    try {
      await post(`/api/v1/matches/${matchId}/join`, {}, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      await loadMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  const isAdmin = match?.adminUserId === user?.id;
  const approvedCount = match?.participants.filter((p) => p.status === ParticipantStatus.APPROVED).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  if (!match) {
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:underline mb-6"
        >
          {t('back')}
        </button>

        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {match.complex ? `${match.complex.city} · ${match.complex.name}` : match.sportId}
            </h1>
            <p className="text-sm text-gray-400">{match.sportId === 'TENNIS' ? '🎾' : '🏓'} {match.sportId}</p>
            <p className="text-gray-500">
              {new Date(match.scheduledAt).toLocaleString()}
            </p>
            {match.description && (
              <p className="text-gray-600 mt-4">{match.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-500">{t('players')}</p>
              <p className="text-xl font-bold">
                {approvedCount}/{match.maxPlayers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('status')}</p>
              <p className="text-xl font-bold text-green-600">{match.status}</p>
            </div>
            {match.requiredLevel && (
              <div>
                <p className="text-sm text-gray-500">{t('requiredLevel')}</p>
                <p className="text-xl font-bold">{match.requiredLevel}</p>
              </div>
            )}
          </div>

          {!isAdmin && !userRequest && (
            <Button
              onClick={handleJoinMatch}
              isLoading={isJoining}
              variant="primary"
              className="w-full mb-6"
            >
              {t('requestJoin')}
            </Button>
          )}

          {userRequest && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                {t('requestStatus')} <strong>{userRequest.status}</strong>
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold text-lg mb-4">{t('pendingRequests')}</h3>
              <div className="space-y-2">
                {match.participants
                  .filter((p) => p.status === ParticipantStatus.PENDING)
                  .map((p) => (
                    <div key={p.userId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>{p.userId}</span>
                      <div className="flex gap-2">
                        <ApproveButton matchId={matchId} userId={p.userId} onSuccess={loadMatch} />
                        <RejectButton matchId={matchId} userId={p.userId} onSuccess={loadMatch} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function ApproveButton({
  matchId,
  userId,
  onSuccess,
}: {
  matchId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const { patch } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('matchDetail');

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await patch(`/api/v1/matches/${matchId}/participants/${userId}/approve?team=TEAM_A`, {}, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="primary" size="sm" onClick={handleApprove} isLoading={isLoading}>
      {t('approve')}
    </Button>
  );
}

function RejectButton({
  matchId,
  userId,
  onSuccess,
}: {
  matchId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const { patch } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('matchDetail');

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await patch(`/api/v1/matches/${matchId}/participants/${userId}/reject`, {}, { baseUrl: process.env.NEXT_PUBLIC_MATCHES_API_URL });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleReject} isLoading={isLoading}>
      {t('reject')}
    </Button>
  );
}
