'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { User, Sport, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { Header } from '@/components/Header';
import { Link } from '@/navigation';
import { cn } from '@/utils/cn';
import { MapPin, UserPlus, UserCheck, ArrowLeft, Trophy } from 'lucide-react';
import { SportIcon } from '@/components/SportIcon';

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     'bg-slate-500/20 text-slate-300 border-slate-500/40',
  INTERMEDIATE: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ADVANCED:     'bg-amber-500/20 text-amber-300 border-amber-500/40',
  PROFESSIONAL: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const FOLLOWING_KEY = 'pivoo_following';

function getFollowing(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FOLLOWING_KEY) ?? '[]');
  } catch { return []; }
}

function setFollowing(ids: string[]) {
  localStorage.setItem(FOLLOWING_KEY, JSON.stringify(ids));
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { get } = useApi();

  const [profile, setProfile] = useState<User | null>(null);
  const [sports, setSports] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    setIsFollowing(getFollowing().includes(userId));
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [userData, sportsData] = await Promise.all([
          get<User>(`/api/v1/users/${userId}`, { baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL }),
          get<Sport[]>('/api/v1/sports', { baseUrl: process.env.NEXT_PUBLIC_SPORTS_API_URL }).catch(() => []),
        ]);
        setProfile(userData);
        const map: Record<string, string> = {};
        (sportsData || []).forEach((s) => { map[s.id] = s.name; });
        setSports(map);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  const toggleFollow = () => {
    const current = getFollowing();
    const next = isFollowing
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    setFollowing(next);
    setIsFollowing(!isFollowing);
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="text-slate-400 font-medium mb-4">Perfil no encontrado</p>
          <Link href="/" className="text-sm text-teal-400 hover:text-teal-300">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-32 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 pt-6 pb-8">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>

          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <span className="text-3xl font-black text-white">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{profile.name}</h1>
              <p className="text-sm text-teal-400 font-medium">@{profile.username}</p>
              {(profile.city || profile.country) && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm text-slate-400 leading-relaxed mt-2">{profile.bio}</p>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0 mt-1">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:border-slate-500 hover:text-white rounded-xl transition-all duration-150"
                >
                  Editar perfil
                </Link>
              ) : user ? (
                <button
                  onClick={toggleFollow}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-150',
                    isFollowing
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                      : 'bg-teal-500 text-white border-teal-500 hover:bg-teal-400 shadow-md shadow-teal-500/20',
                  )}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-4 h-4" /> Siguiendo</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Seguir</>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Sport stats */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {profile.sportStats.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Sin estadísticas deportivas aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Deportes</p>
            {profile.sportStats.map((stat) => {
              const sportName = sports[stat.sportId] ?? stat.sportId;
              return (
                <div key={stat.sportId} className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-900/50 border-b border-slate-700/60">
                    <SportIcon sport={sportName} className="w-6 h-[28px]" />
                    <span className="text-sm font-bold text-white">{sportName}</span>
                    <span className={cn('ml-auto inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border', LEVEL_COLOR[stat.level])}>
                      {SKILL_LEVEL_LABELS[stat.level] ?? stat.level}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Jugados', value: stat.matchesPlayed },
                        { label: 'Ganados',  value: stat.matchesWon },
                        { label: 'Perdidos', value: stat.matchesPlayed - stat.matchesWon },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-700/40 rounded-xl px-3 py-2.5 text-center">
                          <p className="text-lg font-black text-white">{value}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 bg-slate-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Puntos ranking</span>
                      <span className="text-base font-black text-teal-400">{stat.rankingPoints} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
