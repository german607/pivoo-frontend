'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { X, Bell, Check, CheckCheck, Trophy, Calendar, UserCheck, UserX, XCircle, BarChart2 } from 'lucide-react';
import { Notification, NotificationType } from '@pivoo/shared';

interface Props {
  notifications: Notification[];
  loading: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpen: () => void;
}

function notificationIcon(type: NotificationType) {
  const cls = 'w-4 h-4 shrink-0';
  switch (type) {
    case NotificationType.MATCH_INVITATION:
      return <Calendar className={`${cls} text-teal-400`} />;
    case NotificationType.MATCH_JOIN_APPROVED:
      return <UserCheck className={`${cls} text-emerald-400`} />;
    case NotificationType.MATCH_JOIN_REJECTED:
      return <UserX className={`${cls} text-red-400`} />;
    case NotificationType.MATCH_CANCELLED:
      return <XCircle className={`${cls} text-red-400`} />;
    case NotificationType.MATCH_RESULT_RECORDED:
      return <BarChart2 className={`${cls} text-blue-400`} />;
    case NotificationType.TOURNAMENT_REGISTRATION_APPROVED:
      return <UserCheck className={`${cls} text-emerald-400`} />;
    case NotificationType.TOURNAMENT_REGISTRATION_REJECTED:
      return <UserX className={`${cls} text-red-400`} />;
    case NotificationType.TOURNAMENT_BRACKET_GENERATED:
      return <Trophy className={`${cls} text-amber-400`} />;
    case NotificationType.TOURNAMENT_FINALIZED:
      return <Trophy className={`${cls} text-amber-400`} />;
    default:
      return <Bell className={`${cls} text-slate-400`} />;
  }
}

function notificationHref(n: Notification): string | null {
  if (n.data?.matchId) return `/matches/${n.data.matchId}`;
  if (n.data?.tournamentId) return `/tournaments/${n.data.tournamentId}`;
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function NotificationPanel({ notifications, loading, onClose, onMarkRead, onMarkAllRead, onOpen }: Props) {
  const router = useRouter();
  const t = useTranslations('notifications');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpen();
  }, [onOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const unread = notifications.filter((n) => !n.read).length;

  function handleItemClick(n: Notification) {
    if (!n.read) onMarkRead(n.id);
    const href = notificationHref(n);
    if (href) {
      onClose();
      router.push(href as Parameters<typeof router.push>[0]);
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-white">{t('title')}</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
              title={t('markAllRead')}
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[420px]">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            {t('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">{t('empty')}</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              const hasLink = !!notificationHref(n);
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors ${
                    hasLink ? 'cursor-pointer hover:bg-white/5' : ''
                  } ${!n.read ? 'bg-teal-500/5' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    {notificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                      className="mt-1 p-1 text-slate-500 hover:text-teal-400 transition-colors shrink-0"
                      title={t('markRead')}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
