import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export function useUserProfiles(userIds: string[]) {
  const { get } = useApi();
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unique = Array.from(new Set(userIds)).filter((id) => id && !profiles[id]);
    if (unique.length === 0) return;

    setIsLoading(true);
    Promise.allSettled(
      unique.map((id) =>
        get<UserProfile>(`/api/v1/users/${id}`, {
          baseUrl: process.env.NEXT_PUBLIC_USERS_API_URL,
        })
      )
    ).then((results) => {
      setProfiles((prev) => {
        const next = { ...prev };
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            next[unique[i]] = result.value;
          }
        });
        return next;
      });
    }).finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(',')]);

  const getName = (userId: string | null) => {
    if (!userId) return 'BYE';
    const p = profiles[userId];
    return p ? (p.name || p.username) : userId.slice(0, 8) + '…';
  };

  const getInitials = (userId: string | null) => {
    if (!userId) return '?';
    const p = profiles[userId];
    if (!p) return '?';
    const n = p.name || p.username;
    return n.slice(0, 2).toUpperCase();
  };

  return { profiles, getName, getInitials, isLoading };
}
