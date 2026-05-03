'use client';

import { Match } from '@pivoo/shared';
import { Link } from '@/navigation';
import { Calendar, Users, Trophy, MapPin, ArrowRight, Clock } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/utils/cn';

const SPORT_CONFIG: Record<string, { emoji: string; gradient: string; label: string }> = {
  TENNIS: { emoji: '🎾', gradient: 'from-yellow-400 via-lime-400 to-green-500', label: 'Tenis' },
  PADEL:  { emoji: '🏓', gradient: 'from-teal-400 via-cyan-500 to-blue-500',   label: 'Pádel' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string }> = {
  OPEN:        { label: 'Abierto',   dot: 'bg-emerald-400', pill: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' },
  FULL:        { label: 'Completo',  dot: 'bg-amber-400',   pill: 'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  IN_PROGRESS: { label: 'En curso',  dot: 'bg-blue-400',    pill: 'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  COMPLETED:   { label: 'Finalizado',dot: 'bg-slate-400',   pill: 'bg-slate-400/20 text-slate-300 border border-slate-400/30' },
  CANCELLED:   { label: 'Cancelado', dot: 'bg-red-400',     pill: 'bg-red-400/20 text-red-300 border border-red-400/30' },
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',     PROFESSIONAL: 'Profesional',
};

interface MatchCardProps {
  match: Match;
  sportName?: string;
}

export function MatchCard({ match, sportName }: MatchCardProps) {
  const locale = useLocale();
  const sport = SPORT_CONFIG[sportName ?? ''] ?? { emoji: '🏅', gradient: 'from-slate-600 to-slate-700', label: sportName ?? '' };
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
      <article className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">

        {/* ── Sport banner ─────────────────── */}
        <div className={cn('relative h-28 bg-gradient-to-br overflow-hidden', sport.gradient)}>
          {/* Dot pattern overlay */}
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

          {/* Diagonal light sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />

          {/* Sport emoji */}
          <div className="absolute left-5 bottom-4 text-5xl drop-shadow-lg select-none leading-none">
            {sport.emoji}
          </div>

          {/* Sport label */}
          <div className="absolute left-16 bottom-5">
            <p className="text-white font-black text-lg leading-none drop-shadow">{sport.label}</p>
            {match.complex && (
              <p className="text-white/75 text-xs font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{match.complex.name}
              </p>
            )}
          </div>

          {/* Status pill */}
          <div className="absolute top-3 right-3">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-sm', status.pill)}>
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', status.dot)} />
              {status.label}
            </span>
          </div>
        </div>

        {/* ── Content ──────────────────────── */}
        <div className="p-5">
          {/* Date + level */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={cn('text-xs font-semibold', isToday && 'text-teal-600')}>{formatDate()}</span>
            </div>
            {match.requiredLevel && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {LEVEL_LABEL[match.requiredLevel] ?? match.requiredLevel}
              </span>
            )}
          </div>

          {match.complex && (
            <p className="flex items-center gap-1 text-xs text-slate-400 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              {match.complex.city}
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
              <span className={cn('font-bold', isFull ? 'text-amber-600' : 'text-emerald-600')}>
                {isFull ? 'Completo' : `${match.maxPlayers - approvedCount} plazas`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

          {/* ── Footer ───────────────────── */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {/* Participant avatars */}
            <div className="flex -space-x-2">
              {approvedCount === 0 ? (
                <span className="text-xs text-slate-400">Sin jugadores aún</span>
              ) : (
                <>
                  {[...Array(Math.min(approvedCount, 5))].map((_, i) => (
                    <div key={i}
                      style={{ zIndex: 5 - i }}
                      className={cn('w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm bg-gradient-to-br', sport.gradient)}
                    />
                  ))}
                  {approvedCount > 5 && (
                    <div className="relative w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                      +{approvedCount - 5}
                    </div>
                  )}
                </>
              )}
            </div>

            <span className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-teal-600 transition-colors">
              Ver partido
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
