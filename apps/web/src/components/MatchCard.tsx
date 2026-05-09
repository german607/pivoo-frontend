'use client';

import { Match, MatchMode } from '@pivoo/shared';
import { Link } from '@/navigation';
import { Users, MapPin, Clock } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/utils/cn';
import { ReactNode } from 'react';
import { PadelPaddle } from '@/components/SportIcon';

const SPORT_CONFIG: Record<string, { icon: ReactNode; gradient: string; label: string }> = {
  TENNIS: { icon: <span className="text-5xl leading-none select-none">🎾</span>, gradient: 'from-yellow-400 via-lime-400 to-green-500', label: 'Tenis' },
  PADEL:  { icon: <PadelPaddle className="w-12 h-[55px]" />, gradient: 'from-teal-400 via-cyan-500 to-blue-500', label: 'Pádel' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string }> = {
  OPEN:        { label: 'Abierto',    dot: 'bg-violet-400', pill: 'bg-violet-500/30 text-violet-200 border border-violet-400/40' },
  FULL:        { label: 'Completo',   dot: 'bg-amber-400',  pill: 'bg-amber-500/30 text-amber-200 border border-amber-400/40' },
  IN_PROGRESS: { label: 'En curso',   dot: 'bg-violet-300', pill: 'bg-violet-400/20 text-violet-200 border border-violet-300/40' },
  COMPLETED:   { label: 'Finalizado', dot: 'bg-slate-300',  pill: 'bg-slate-500/30 text-slate-200 border border-slate-400/40' },
  CANCELLED:   { label: 'Cancelado',  dot: 'bg-red-400',    pill: 'bg-red-500/30 text-red-200 border border-red-400/40' },
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',     PROFESSIONAL: 'Profesional',
};

interface MatchCardProps {
  match: Match;
  sportName?: string;
  recommended?: boolean;
}

export function MatchCard({ match, sportName, recommended }: MatchCardProps) {
  const locale = useLocale();
  const sport = SPORT_CONFIG[sportName ?? ''] ?? { icon: <span className="text-5xl leading-none select-none">🏅</span>, gradient: 'from-slate-600 to-slate-700', label: sportName ?? '' };
  const status = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.OPEN;
  const approvedCount = match.participants.length;
  const isFull = approvedCount >= match.maxPlayers;
  const fillPct = Math.min(100, Math.round((approvedCount / match.maxPlayers) * 100));

  const now = new Date();
  const matchDate = new Date(match.scheduledAt);
  const isToday = matchDate.toDateString() === now.toDateString();
  const isTomorrow = matchDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const formatDate = () => {
    if (isToday) return `Hoy · ${matchDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    if (isTomorrow) return `Mañana · ${matchDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    return matchDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Link href={`/matches/${match.id}`} className="block group">
      <article className="relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300">

        {/* ── Status bar ───────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full', status.pill)}>
            <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', status.dot)} />
            {status.label}
          </span>
          <div className="flex items-center gap-1.5">
            {match.mode === MatchMode.TEAM_VS_TEAM && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-violet-300 bg-violet-500/15 border border-violet-400/30 rounded-full tracking-wide uppercase">
                Parejas
              </span>
            )}
            {recommended && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-teal-300 bg-teal-500/15 border border-teal-400/30 rounded-full tracking-wide uppercase">
                Para ti
              </span>
            )}
          </div>
        </div>

        {/* ── Sport banner ─────────────────── */}
        <div className={cn('relative h-20 bg-gradient-to-br overflow-hidden', sport.gradient)}>
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute left-4 bottom-2">
            {sport.icon}
          </div>

          <div className="absolute left-16 bottom-4">
            <p className="text-white font-black text-lg leading-none drop-shadow">{sport.label}</p>
            {(match.complex || match.complexName) && (
              <p className="text-white/70 text-xs font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{match.complex?.name ?? match.complexName}
              </p>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────── */}
        <div className="p-5">
          {/* Date + badges */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className={cn('text-xs font-semibold truncate', isToday && 'text-teal-400')}>{formatDate()}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {match.requiredLevel && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">
                  {LEVEL_LABEL[match.requiredLevel] ?? match.requiredLevel}
                </span>
              )}
              {match.requiredCategory && (
                <span className="text-xs font-semibold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/25">
                  {match.requiredCategory.charAt(0) + match.requiredCategory.slice(1).toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {(match.complex || match.complexName) && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              {match.complex ? match.complex.city : match.complexName}
            </p>
          )}

          {match.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
              {match.description}
            </p>
          )}

          {/* ── Capacity ─────────────────── */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1 text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {approvedCount} / {match.maxPlayers}
              </span>
              <span className={cn('font-bold', isFull ? 'text-amber-400' : 'text-emerald-400')}>
                {isFull ? 'Completo' : `${match.maxPlayers - approvedCount} plazas`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${fillPct}%` }}
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isFull
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                )}
              />
            </div>
          </div>

        </div>
      </article>
    </Link>
  );
}
