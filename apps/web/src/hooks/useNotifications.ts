import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth';
import { useApi } from './useApi';
import { Notification } from '@pivoo/shared';

const NOTIFICATIONS_API = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL;

export function useNotifications() {
  const { user, tokens } = useAuth();
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const userId = user?.id ?? null;
  const accessToken = tokens?.accessToken ?? null;

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

  // WebSocket: connect when logged in, disconnect on logout
  useEffect(() => {
    if (!userId || !accessToken || !NOTIFICATIONS_API) return;

    const socket = io(`${NOTIFICATIONS_API}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('notification', (incoming: Notification) => {
      setNotifications((prev) => {
        // avoid duplicates if already present
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    // Fetch existing notifications once on connect
    socket.on('connect', () => {
      fetchNotifications();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, accessToken, fetchNotifications]);

  // Clear state on logout
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  return { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead };
}
