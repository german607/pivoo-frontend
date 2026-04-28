'use client';

import { Match, MATCH_STATUS_LABELS } from '@pivoo/shared';
import { Link } from '@/navigation';
import { Calendar, Users, Trophy } from 'lucide-react';
import { Badge } from './ui';
import { useTranslations, useLocale } from 'next-intl';

interface MatchCardProps {
  match: Match;
  sportName?: string;
}

export function MatchCard({ match, sportName }: MatchCardProps) {
  const t = useTranslations('matchCard');
  const locale = useLocale();

  const approvedCount = match.participants.filter((p) => p.status === 'APPROVED').length;
  const isFull = approvedCount >= match.maxPlayers;
  const isOpen = match.status === 'OPEN' && !isFull;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 overflow-hidden cursor-pointer">
        <div className="h-1 bg-gradient-to-r from-teal-600 to-blue-600 group-hover:opacity-100 opacity-75 transition-opacity" />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                {match.complex
                  ? `${match.complex.city} · ${match.complex.name}`
                  : (sportName || match.sportId)}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                🏟️ {sportName || match.sportId}
              </p>
            </div>
            <Badge
              variant={isFull ? 'error' : isOpen ? 'success' : 'default'}
              size="sm"
            >
              {isFull ? t('full') : MATCH_STATUS_LABELS[match.status]}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium">{formatDate(match.scheduledAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium">
                {t('players', { count: approvedCount, max: match.maxPlayers })}
              </span>
              <div className="ml-auto">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(approvedCount, 3))].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full border-2 border-white"
                    />
                  ))}
                  {approvedCount > 3 && (
                    <div className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                      +{approvedCount - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {match.requiredLevel && (
              <div className="flex items-center gap-2 text-gray-600">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">
                  {t('level', { level: match.requiredLevel })}
                </span>
              </div>
            )}
          </div>

          {match.description && (
            <p className="mt-4 text-sm text-gray-500 line-clamp-2 group-hover:text-gray-600 transition-colors">
              {match.description}
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 group-hover:text-teal-600 transition-colors font-medium">
              {t('viewDetails')}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
