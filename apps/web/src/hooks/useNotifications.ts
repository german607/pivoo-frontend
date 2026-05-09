import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { useApi } from './useApi';
import { Notification } from '@pivoo/shared';

const NOTIFICATIONS_API = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL;
const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const { user } = useAuth();
  const api = useApi();
  // Keep a ref so callbacks never go stale without being re-created
  const apiRef = useRef(api);
  apiRef.current = api;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = user?.id ?? null;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiRef.current.get<{ count: number }>(
        '/api/v1/notifications/unread-count',
        { baseUrl: NOTIFICATIONS_API },
      );
      setUnreadCount(data.count);
    } catch {
      // silently ignore polling errors
    }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await apiRef.current.get<Notification[]>(
        '/api/v1/notifications?limit=30',
        { baseUrl: NOTIFICATIONS_API },
      );
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    try {
      const updated = await apiRef.current.patch<Notification>(
        `/api/v1/notifications/${id}/read`,
        undefined,
        { baseUrl: NOTIFICATIONS_API },
      );
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiRef.current.patch<void>(
        '/api/v1/notifications/read-all',
        undefined,
        { baseUrl: NOTIFICATIONS_API },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchUnreadCount]);

  return { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead };
}

